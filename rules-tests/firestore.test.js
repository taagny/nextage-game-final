import { after, before, beforeEach, test } from "node:test"
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { assertFails, assertSucceeds, initializeTestEnvironment } from "@firebase/rules-unit-testing"
import {
  collection, deleteDoc, doc, documentId, endBefore, FieldPath, getCountFromServer,
  getDoc, getDocs, limit, orderBy, query, runTransaction, serverTimestamp,
  setDoc, Timestamp, updateDoc, where, writeBatch
} from "firebase/firestore"
import { initialPlayerStats, nextPlayerStats } from "../src/utils/playerStats.js"
import { nextWordDoc } from "../src/utils/wordHistory.js"

// Estes testes limitam formato, permissões e magnitude. Não provam que alguém
// jogou de fato; um cliente modificado pode declarar partidas dentro dos limites.
// Cálculo confiável no servidor é trabalho futuro, fora do escopo desta versão.
const address = process.env.FIRESTORE_EMULATOR_HOST
if (!address || !/^(127\.0\.0\.1|localhost):\d+$/.test(address)) {
  throw new Error("Execute com npm run test:rules: é obrigatório usar o emulador local.")
}
const [host, port] = address.split(":")
const projectId = "demo-nextage-v2"
const past = Timestamp.fromMillis(1000)
let env
const asOwner = () => env.authenticatedContext("alice").firestore()
const asOther = () => env.authenticatedContext("bob").firestore()
const asAdmin = () => env.authenticatedContext("admin-fixture", { admin: true }).firestore()
const asVisitor = () => env.unauthenticatedContext().firestore()

function playerData(timestamp, accepted = false) {
  return { schemaVersion: 2, termsAccepted: accepted, termsAcceptedAt: accepted ? timestamp : null,
    termsVersion: "2", createdAt: timestamp, stats: initialPlayerStats(timestamp) }
}
function publicData(timestamp) {
  return { apelido: "Jogador", sequenciaAtual: 0, sequenciasPerdidas: 0,
    runnerScores: { 10: 0, 30: 0, 60: 0 }, updatedAt: timestamp }
}
function firstWordData() {
  return { vezesVista: 1, vitorias: 1, totalTentativas: 3, mediaTentativas: 3,
    primeiraVenceu: true, primeiraTentativas: 3, primeiraTempoMs: 1000,
    melhorTentativas: 3, melhorTempoMs: 1000, ultimaVenceu: true,
    ultimaTentativas: 3, ultimaTempoMs: 1000, atualizadoEm: serverTimestamp() }
}

async function record(db, { won = true, abandoned = false, attempts = 3, timeMs = 1000 } = {}, options = {}) {
  return runTransaction(db, async transaction => {
    const privateRef = doc(db, "jogadores/alice")
    const publicRef = doc(db, "perfisPublicos/alice")
    const privateSnap = await transaction.get(privateRef)
    const publicSnap = await transaction.get(publicRef)
    const wordRef = options.trackWord && !abandoned ? doc(db, "jogadores/alice/palavras/CASAS") : null
    const wordSnap = wordRef ? await transaction.get(wordRef) : null
    const result = { won, abandoned, attempts, timeMs }
    const stats = nextPlayerStats(privateSnap.data().stats, result, serverTimestamp())
    const profile = publicSnap.data()
    transaction.update(privateRef, { stats: { ...stats, ...options.stats } })
    transaction.update(publicRef, {
      sequenciaAtual: won ? profile.sequenciaAtual + 1 : 0,
      sequenciasPerdidas: profile.sequenciasPerdidas + Number(!won),
      updatedAt: serverTimestamp(), ...options.profile
    })
    transaction.set(doc(db, "jogadores/alice/partidas", options.id ?? "partida-a"), {
      mode: "classico", ...result, ...(!abandoned ? { word: "CASAS" } : {}),
      createdAt: serverTimestamp(), ...options.match
    })
    if (options.word) {
      transaction.set(doc(db, "jogadores/alice/palavras", options.wordId ?? "CASAS"), options.word)
    } else if (wordRef) {
      transaction.set(wordRef, nextWordDoc(wordSnap.exists() ? wordSnap.data() : null, result, serverTimestamp()))
    }
  })
}

before(async () => {
  env = await initializeTestEnvironment({ projectId, firestore: {
    host, port: Number(port), rules: await readFile(new URL("../firestore.rules", import.meta.url), "utf8")
  } })
})
beforeEach(async () => {
  await env.clearFirestore()
  await env.withSecurityRulesDisabled(async context => {
    const db = context.firestore()
    const batch = writeBatch(db)
    batch.set(doc(db, "jogadores/alice"), playerData(past, true))
    batch.set(doc(db, "perfisPublicos/alice"), publicData(past))
    await batch.commit()
  })
})
after(async () => { await env?.cleanup() })

test("visitante lê o ranking mas não jogador privado nem sua coleção", async () => {
  const db = asVisitor()
  await assertSucceeds(getDoc(doc(db, "perfisPublicos/alice")))
  await assertSucceeds(getDocs(collection(db, "perfisPublicos")))
  await assertFails(getDoc(doc(db, "jogadores/alice")))
  await assertFails(getDocs(collection(db, "jogadores")))
})

test("dono lê seus dados; terceiro não lê nem altera documento alheio", async () => {
  await assertSucceeds(getDoc(doc(asOwner(), "jogadores/alice")))
  await assertFails(getDoc(doc(asOther(), "jogadores/alice")))
  await assertFails(updateDoc(doc(asOther(), "perfisPublicos/alice"), { apelido: "Outro", updatedAt: serverTimestamp() }))
  await assertFails(deleteDoc(doc(asOther(), "jogadores/alice")))
  await assertFails(setDoc(doc(asOwner(), "jogadores/bob"), playerData(serverTimestamp())))
})

test("admin por claim lê os dados privados, mas não escreve dados de outro dono", async () => {
  const db = asAdmin()
  await assertSucceeds(getDoc(doc(db, "jogadores/alice")))
  await assertSucceeds(getDocs(collection(db, "jogadores")))
  await assertFails(updateDoc(doc(db, "perfisPublicos/alice"), { apelido: "Outro", updatedAt: serverTimestamp() }))
  await assertFails(updateDoc(doc(db, "jogadores/alice"), { termsAccepted: false, termsAcceptedAt: null }))
})

test("criação normal dos dois documentos zerados é permitida", async () => {
  const db = asOther()
  const batch = writeBatch(db)
  batch.set(doc(db, "jogadores/bob"), playerData(serverTimestamp()))
  batch.set(doc(db, "perfisPublicos/bob"), publicData(serverTimestamp()))
  await assertSucceeds(batch.commit())
})

test("não é possível criar perfil público ou estatísticas com placares não zerados", async () => {
  const db = asOther()
  await assertFails(setDoc(doc(db, "perfisPublicos/bob"), { ...publicData(serverTimestamp()), sequenciaAtual: 5 }))
  const player = playerData(serverTimestamp())
  player.stats.totalGames = 1
  player.stats.totalWins = 1
  await assertFails(setDoc(doc(db, "jogadores/bob"), player))
})

test("sequência não pode saltar de 5 para 50; incremento transacional válido passa", async () => {
  await env.withSecurityRulesDisabled(context => updateDoc(doc(context.firestore(), "perfisPublicos/alice"), { sequenciaAtual: 5 }))
  const db = asOwner()
  await assertFails(updateDoc(doc(db, "perfisPublicos/alice"), { sequenciaAtual: 50, updatedAt: serverTimestamp() }))
  await assertSucceeds(record(db))
  assert.equal((await getDoc(doc(db, "perfisPublicos/alice"))).data().sequenciaAtual, 6)
})

test("derrota e abandono incrementam perdas e jogos, preservando vitórias", async () => {
  const db = asOwner()
  await assertSucceeds(record(db, { won: false, attempts: 6 }))
  await assertSucceeds(record(db, { won: false, abandoned: true, attempts: 0, timeMs: 0 }, { id: "abandono" }))
  const stats = (await getDoc(doc(db, "jogadores/alice"))).data().stats
  assert.equal(stats.totalGames, 2)
  assert.equal(stats.totalLosses, 1)
  assert.equal(stats.abandonedGames, 1)
  assert.equal(stats.totalWins, 0)
  assert.equal((await getDoc(doc(db, "perfisPublicos/alice"))).data().sequenciasPerdidas, 2)
})

test("atualização isolada dos contadores e saltos nas estatísticas são negados", async () => {
  const db = asOwner()
  await assertFails(updateDoc(doc(db, "jogadores/alice"), { "stats.totalGames": 1 }))
  await assertFails(record(db, {}, { stats: { totalGames: 50, totalWins: 50 } }))
  assert.equal((await getDoc(doc(db, "jogadores/alice"))).data().stats.totalGames, 0)
})

test("recorde do Runner não diminui, não passa da duração e não altera stats", async () => {
  const db = asOwner()
  const ref = doc(db, "perfisPublicos/alice")
  await assertSucceeds(updateDoc(ref, { "runnerScores.10": 7, updatedAt: serverTimestamp() }))
  await assertFails(updateDoc(ref, { "runnerScores.10": 6, updatedAt: serverTimestamp() }))
  await assertFails(updateDoc(ref, { "runnerScores.10": 11, updatedAt: serverTimestamp() }))
  await assertFails(updateDoc(ref, { "runnerScores.90": 1, updatedAt: serverTimestamp() }))
  assert.equal((await getDoc(doc(db, "jogadores/alice"))).data().stats.totalGames, 0)
})

for (const change of [
  { apelido: "AB" }, { apelido: "A".repeat(21) }, { apelido: "Ana Maria" },
  { apelido: "João" }, { apelido: 123 }, { email: "dado-extra" },
  { admin: true }, { sequenciaAtual: -1 }, { runnerScores: { 10: 0 } },
  { updatedAt: past }
]) {
  test(`perfil público nega formato inválido: ${JSON.stringify(change)}`, async () => {
    await assertFails(updateDoc(doc(asOwner(), "perfisPublicos/alice"), { updatedAt: serverTimestamp(), ...change }))
  })
}

test("apelido válido pode mudar sem modificar placares", async () => {
  await assertSucceeds(updateDoc(doc(asOwner(), "perfisPublicos/alice"), { apelido: "Ana_9", updatedAt: serverTimestamp() }))
})

test("consentimento aceita timestamp do servidor; createdAt, countersFixedAt e campos extras são protegidos", async () => {
  const db = asOwner()
  const ref = doc(db, "jogadores/alice")
  await assertSucceeds(updateDoc(ref, { termsAccepted: true, termsAcceptedAt: serverTimestamp(), termsVersion: "2" }))
  await assertFails(updateDoc(ref, { termsAcceptedAt: Timestamp.fromMillis(0) }))
  await assertFails(updateDoc(ref, { createdAt: serverTimestamp() }))
  await assertFails(updateDoc(ref, { "stats.countersFixedAt": serverTimestamp() }))
  await assertFails(updateDoc(ref, { email: "dado-extra" }))
  await assertFails(updateDoc(ref, { admin: true }))
  await assertFails(updateDoc(ref, { stats: { totalGames: 0 } }))
})

test("partidas exigem transação coerente, palavra válida, timestamp atual e não aceitam update", async () => {
  const db = asOwner()
  await assertFails(setDoc(doc(db, "jogadores/alice/partidas/isolada"), {
    mode: "classico", won: true, attempts: 3, timeMs: 1000, abandoned: false, word: "CASAS", createdAt: serverTimestamp()
  }))
  await assertFails(record(db, {}, { match: { word: "CASA" } }))
  await assertFails(record(db, {}, { match: { createdAt: past } }))
  await assertFails(record(db, {}, { match: { extra: true } }))
  await assertSucceeds(record(db))
  const ref = doc(db, "jogadores/alice/partidas/partida-a")
  await assertFails(updateDoc(ref, { attempts: 1 }))
  await assertFails(record(db))
  await assertSucceeds(getDoc(doc(asAdmin(), "jogadores/alice/partidas/partida-a")))
  await assertFails(getDoc(doc(asOther(), "jogadores/alice/partidas/partida-a")))
})

test("tempo por partida e tentativas têm limites", async () => {
  await assertFails(record(asOwner(), { timeMs: 86400001 }))
  await assertFails(record(asOwner(), { attempts: 7 }))
  await assertFails(record(asOwner(), { timeMs: -1 }))
})

test("palavra cria e atualiza na transação; primeira ocorrência permanece imutável", async () => {
  const db = asOwner()
  await assertSucceeds(record(db, {}, { word: firstWordData() }))
  const next = { ...firstWordData(), vezesVista: 2, vitorias: 2, totalTentativas: 5,
    mediaTentativas: 2.5, melhorTentativas: 2, melhorTempoMs: 800,
    ultimaTentativas: 2, ultimaTempoMs: 800 }
  await assertFails(record(db, { attempts: 2, timeMs: 800 }, { id: "segunda", word: { ...next, primeiraTentativas: 2 } }))
  await assertFails(record(db, { attempts: 2, timeMs: 800 }, { id: "segunda", word: { ...next, vezesVista: 3 } }))
  await assertSucceeds(record(db, { attempts: 2, timeMs: 800 }, { id: "segunda", word: next }))
  await assertSucceeds(getDoc(doc(db, "jogadores/alice/palavras/CASAS")))
  await assertFails(getDoc(doc(asOther(), "jogadores/alice/palavras/CASAS")))
  await assertFails(getDoc(doc(asAdmin(), "jogadores/alice/palavras/CASAS")))
})

test("palavras rejeitam id, formato, média, tipo e campos extras inválidos", async () => {
  const db = asOwner()
  await assertFails(record(db, {}, { wordId: "CASA", word: firstWordData() }))
  for (const change of [{ extra: true }, { mediaTentativas: 7 }, { vezesVista: "1" }, { ultimaTempoMs: -1 }]) {
    await assertFails(record(db, {}, { word: { ...firstWordData(), ...change } }))
  }
  await assertFails(setDoc(doc(db, "jogadores/alice/palavras/CASAS"), firstWordData()))
})

test("helper real preserva a primeira palavra e o melhor tempo em novas ocorrências", async () => {
  const db = asOwner()
  for (const [index, result] of [
    { won: true, attempts: 3, timeMs: 1000 },
    { won: true, attempts: 3, timeMs: 800 },
    { won: true, attempts: 3, timeMs: 1200 },
    { won: false, attempts: 6, timeMs: 1000 }
  ].entries()) {
    await assertSucceeds(record(db, result, { id: `helper-${index}`, trackWord: true }))
  }
  const word = (await getDoc(doc(db, "jogadores/alice/palavras/CASAS"))).data()
  assert.equal(word.vezesVista, 4)
  assert.equal(word.primeiraTempoMs, 1000)
  assert.equal(word.melhorTempoMs, 800)
  assert.equal(word.ultimaTentativas, 7)
  assert.equal(word.totalTentativas, 16)
  assert.equal(word.mediaTentativas, 4)
})

test("derrota na primeira ocorrência usa 7; vitória posterior preserva a primeira", async () => {
  const db = asOwner()
  const first = { ...firstWordData(), vitorias: 0, totalTentativas: 7, mediaTentativas: 7,
    primeiraVenceu: false, primeiraTentativas: 7, melhorTentativas: 7,
    ultimaVenceu: false, ultimaTentativas: 7 }
  await assertSucceeds(record(db, { won: false, attempts: 6 }, { word: first }))
  const next = { ...first, vezesVista: 2, vitorias: 1, totalTentativas: 10, mediaTentativas: 5,
    melhorTentativas: 3, ultimaVenceu: true, ultimaTentativas: 3 }
  await assertSucceeds(record(db, {}, { id: "vitoria-posterior", word: next }))
})

test("exclusão do dono funciona em histórico, palavras e documentos principais", async () => {
  const db = asOwner()
  await record(db, {}, { word: firstWordData() })
  const batch = writeBatch(db)
  for (const path of ["jogadores/alice/partidas/partida-a", "jogadores/alice/palavras/CASAS", "jogadores/alice", "perfisPublicos/alice"]) {
    batch.delete(doc(db, path))
  }
  await assertSucceeds(batch.commit())
})

test("admin pode excluir; dono pode limpar subcoleções órfãs, mas não criar sem pai", async () => {
  await assertSucceeds(deleteDoc(doc(asAdmin(), "jogadores/alice")))
  await assertFails(setDoc(doc(asOwner(), "jogadores/alice/palavras/CASAS"), firstWordData()))
  await env.withSecurityRulesDisabled(context => setDoc(doc(context.firestore(), "jogadores/alice/palavras/CASAS"), firstWordData()))
  await assertSucceeds(deleteDoc(doc(asOwner(), "jogadores/alice/palavras/CASAS")))
})

test("coleções não utilizadas são negadas por padrão, inclusive ao admin", async () => {
  for (const name of ["dicionario", "config", "doacoes", "outraColecao"]) {
    await assertFails(getDocs(collection(asVisitor(), name)))
    await assertFails(setDoc(doc(asAdmin(), name, "fixture"), { value: true }))
  }
})

test("rankings e contagens cobrem 102 perfis, o limite de 100 e empates do Runner", async () => {
  await env.withSecurityRulesDisabled(async context => {
    const db = context.firestore()
    const batch = writeBatch(db)
    for (let index = 0; index < 102; index += 1) {
      batch.set(doc(db, "perfisPublicos", `rank-${String(index).padStart(3, "0")}`), {
        ...publicData(past), sequenciaAtual: index + 1, runnerScores: { 10: 1, 30: 2, 60: 3 }
      })
    }
    await batch.commit()
  })
  const profiles = collection(asVisitor(), "perfisPublicos")
  for (const [field, score] of [["sequenciaAtual", 1], ...[10, 30, 60].map((time, index) => [new FieldPath("runnerScores", String(time)), index + 1])]) {
    const ranked = query(profiles, where(field, ">", 0), orderBy(field, "desc"), orderBy(documentId(), "desc"))
    const top = await assertSucceeds(getDocs(query(ranked, limit(100))))
    assert.equal(top.size, 100)
    assert.equal(top.docs.some(document => document.id === "rank-000"), false)
    const ahead = await assertSucceeds(getCountFromServer(query(ranked, endBefore(score, "rank-000"))))
    assert.equal(ahead.data().count + 1, 102)
  }
})
