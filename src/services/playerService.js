import {
  collection, doc, getDoc, getDocs, limit, orderBy, query,
  onSnapshot, runTransaction, serverTimestamp, updateDoc
} from "firebase/firestore"
import { db } from "./firebase"
import { RESEARCH_CONSENT_VERSION, TERMS_VERSION } from "../utils/constants.js"
import { defaultNickname, validateNickname } from "../utils/nickname.js"
import { initialPlayerStats, nextPlayerStats } from "../utils/playerStats.js"
import { withPlayerWrite } from "./accountLifecycle"
import { nextWordDoc } from "../utils/wordHistory.js"

function playerRefs(uid) {
  return {
    privateRef: doc(db, "jogadores", uid),
    publicRef: doc(db, "perfisPublicos", uid)
  }
}

export async function ensurePlayerExists(uid, displayName) {
  const { privateRef, publicRef } = playerRefs(uid)
  return withPlayerWrite(uid, () => runTransaction(db, async transaction => {
    // Todas as leituras precedem as escritas, inclusive na criação parcial.
    const privateSnap = await transaction.get(privateRef)
    const publicSnap = await transaction.get(publicRef)
    const player = privateSnap.exists() ? privateSnap.data() : {
      schemaVersion: 2,
      termsAccepted: false,
      termsAcceptedAt: null,
      termsVersion: TERMS_VERSION,
      createdAt: serverTimestamp(),
      stats: initialPlayerStats(serverTimestamp())
    }
    const publicProfile = publicSnap.exists() ? publicSnap.data() : {
      apelido: defaultNickname(displayName),
      sequenciaAtual: 0,
      sequenciasPerdidas: 0,
      runnerScores: { "10": 0, "30": 0, "60": 0 },
      updatedAt: serverTimestamp()
    }
    // Não migra nem sobrescreve documentos existentes no login.
    if (!privateSnap.exists()) transaction.set(privateRef, player)
    if (!publicSnap.exists()) transaction.set(publicRef, publicProfile)
    return { player, publicProfile }
  }))
}

export async function getPlayer(uid) {
  const snapshot = await getDoc(doc(db, "jogadores", uid))
  return snapshot.exists() ? snapshot.data() : null
}

export async function getPublicProfile(uid) {
  const snapshot = await getDoc(doc(db, "perfisPublicos", uid))
  return snapshot.exists() ? snapshot.data() : null
}

export function subscribeToPublicProfile(uid, onProfile, onError) {
  return onSnapshot(doc(db, "perfisPublicos", uid), snapshot => {
    onProfile(snapshot.exists() ? snapshot.data() : null)
  }, onError)
}

export function subscribeToPlayer(uid, onPlayer, onError) {
  return onSnapshot(doc(db, "jogadores", uid), snapshot => {
    onPlayer(snapshot.exists() ? snapshot.data() : null)
  }, onError)
}

function researchDecision(accepted) {
  if (typeof accepted !== "boolean") throw new TypeError("Decisão de pesquisa inválida.")
  return { accepted, version: RESEARCH_CONSENT_VERSION, updatedAt: serverTimestamp() }
}

export async function setTermsAccepted(uid, participateInResearch = false) {
  return withPlayerWrite(uid, () => updateDoc(doc(db, "jogadores", uid), {
    termsAccepted: true,
    termsAcceptedAt: serverTimestamp(),
    termsVersion: TERMS_VERSION,
    researchConsent: researchDecision(participateInResearch)
  }))
}

export async function setResearchConsent(uid, accepted) {
  return withPlayerWrite(uid, () => updateDoc(doc(db, "jogadores", uid), {
    researchConsent: researchDecision(accepted)
  }))
}

export async function updateNickname(uid, nickname) {
  const error = validateNickname(nickname)
  if (error) throw new Error(error)
  return withPlayerWrite(uid, () => updateDoc(doc(db, "perfisPublicos", uid), {
    apelido: nickname,
    updatedAt: serverTimestamp()
  }))
}

function validateMatch(result) {
  if (!Number.isSafeInteger(result.timeMs) || result.timeMs < 0) {
    throw new Error("Tempo da partida inválido.")
  }
  if (!result.abandoned && !/^[A-Z]{5}$/.test(result.word ?? "")) {
    throw new Error("Palavra da partida inválida.")
  }
  if (!Number.isInteger(result.attempts) ||
      result.attempts < 0 || result.attempts > 6 ||
      (!result.abandoned && result.attempts < 1)) {
    throw new Error("Número de tentativas inválido.")
  }
}

async function registerClassicResult(uid, result, matchId) {
  validateMatch(result)
  const { privateRef, publicRef } = playerRefs(uid)
  const matches = collection(privateRef, "partidas")
  // Referência estável entre tentativas da transação; matchId evita reenvios da mesma partida.
  const matchRef = matchId ? doc(matches, matchId) : doc(matches)
  const wordRef = result.abandoned ? null : doc(privateRef, "palavras", result.word)
  return withPlayerWrite(uid, () => runTransaction(db, async transaction => {
    const privateSnap = await transaction.get(privateRef)
    const publicSnap = await transaction.get(publicRef)
    const matchSnap = await transaction.get(matchRef)
    if (!privateSnap.exists() || !publicSnap.exists()) {
      throw new Error("Perfil indisponível. Entre novamente para continuar.")
    }
    if (matchSnap.exists()) return { matchId: matchRef.id, recorded: false }

    // Ler a palavra antes das escritas permite preservar a primeira ocorrência
    // inclusive se outra partida obrigar o Firestore a repetir a transação.
    const wordSnap = wordRef ? await transaction.get(wordRef) : null
    const previousWord = wordSnap?.exists() ? wordSnap.data() : null
    const wordHistory = wordRef ? nextWordDoc(previousWord, result, serverTimestamp()) : null

    const stats = nextPlayerStats(privateSnap.data().stats, result, serverTimestamp())
    const profile = publicSnap.data()
    const sequenciaAtual = result.won ? profile.sequenciaAtual + 1 : 0
    const sequenciasPerdidas = profile.sequenciasPerdidas + Number(!result.won)
    transaction.update(privateRef, { stats })
    transaction.update(publicRef, {
      sequenciaAtual,
      sequenciasPerdidas,
      updatedAt: serverTimestamp()
    })
    const match = {
      mode: "classico",
      won: result.won,
      attempts: result.attempts,
      timeMs: result.timeMs,
      abandoned: result.abandoned,
      createdAt: serverTimestamp()
    }
    if (!result.abandoned) match.word = result.word
    transaction.set(matchRef, match)
    if (wordRef) transaction.set(wordRef, wordHistory)
    return {
      matchId: matchRef.id, recorded: true, sequenciaAtual, wordHistory,
      firstOccurrence: wordHistory ? {
        won: wordHistory.primeiraVenceu,
        attempts: wordHistory.primeiraTentativas,
        timeMs: wordHistory.primeiraTempoMs
      } : null
    }
  }))
}

export function registerWin(uid, { word, attempts, timeMs, matchId }) {
  return registerClassicResult(uid, {
    word, attempts, timeMs, won: true, abandoned: false
  }, matchId)
}

export function registerLoss(uid, { word, timeMs, matchId }) {
  return registerClassicResult(uid, {
    word, timeMs, attempts: 6, won: false, abandoned: false
  }, matchId)
}

export function registerAbandon(uid, { timeMs = 0, matchId } = {}) {
  return registerClassicResult(uid, {
    timeMs, attempts: 0, won: false, abandoned: true
  }, matchId)
}

export async function saveRunnerRecord(uid, time, score) {
  const duration = String(time)
  if (!["10", "30", "60"].includes(duration) ||
      !Number.isInteger(score) || score < 0 || score > Number(duration)) {
    throw new Error("Recorde do Runner fora dos limites permitidos.")
  }
  const ref = doc(db, "perfisPublicos", uid)
  return withPlayerWrite(uid, () => runTransaction(db, async transaction => {
    const snapshot = await transaction.get(ref)
    if (!snapshot.exists()) {
      throw new Error("Perfil indisponível. Entre novamente para continuar.")
    }
    const currentBest = snapshot.data().runnerScores[duration]
    if (score <= currentBest) return currentBest
    transaction.update(ref, {
      runnerScores: { ...snapshot.data().runnerScores, [duration]: score },
      updatedAt: serverTimestamp()
    })
    return score
  }))
}

export async function getRecentMatches(uid, count = 10) {
  const matches = query(
    collection(db, "jogadores", uid, "partidas"),
    orderBy("createdAt", "desc"),
    limit(count)
  )
  const snapshot = await getDocs(matches)
  return snapshot.docs.map(match => ({ id: match.id, ...match.data() }))
}
