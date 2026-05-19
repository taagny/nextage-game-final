import { doc, getDoc, setDoc, updateDoc, increment, collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "./firebase"

export async function ensurePlayerExists(uid, nome, email) {
  const ref = doc(db, "jogadores", uid)
  const snap = await getDoc(ref)

  if (!snap.exists()) {
    await setDoc(ref, {
      nome: nome || "Jogador",
      email: email || "",
      sequenciaAtual: 0,
      vitorias: 0,
      tentativas: 0,
      jogos: 0,
      online: false,
      lastActive: null,
      termsAccepted: false,
      termsAcceptedAt: null,
      runnerScores: {
        "10": 0,
        "30": 0,
        "60": 0
      },
      stats: {
        totalGames: 0,
        totalWins: 0,
        totalTimeMs: 0,
        totalAttempts: 0,
        avgTimePerWord: 0,
        avgAttemptsPerWord: 0,
        profile: "iniciante",
        abandonedGames: 0,
        guessDistribution: {
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0,
          6: 0
        }
      }
    })
  }
}

export async function getPlayer(uid) {
  const ref = doc(db, "jogadores", uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return snap.data()
}

export async function incrementStreak(uid) {
  const ref = doc(db, "jogadores", uid)
  await updateDoc(ref, {
    sequenciaAtual: increment(1),
    vitorias: increment(1)
  })
}

export async function resetStreak(uid) {
  const ref = doc(db, "jogadores", uid)
  await updateDoc(ref, {
    sequenciaAtual: 0,
    tentativas: increment(1)
  })
}

export async function saveRunnerRecord(uid, time, score) {
  const ref = doc(db, "jogadores", uid)
  const snap = await getDoc(ref)

  if (!snap.exists()) return

  const data = snap.data()
  const runnerScores = data.runnerScores || {
    "10": 0,
    "30": 0,
    "60": 0
  }

  const currentBest = runnerScores[time] || 0

  if (score > currentBest) {
    await updateDoc(ref, {
      runnerScores: {
        ...runnerScores,
        [time]: score
      }
    })
  }
}

export async function updatePlayerStats(uid, timeMs, attempts) {
  const ref = doc(db, "jogadores", uid)
  const snap = await getDoc(ref)

  if (!snap.exists()) return

  const data = snap.data()
  const stats = data.stats || {}

  const totalGames = (stats.totalGames || 0) + 1
  const totalWins = (stats.totalWins || 0) + 1
  const totalTimeMs = (stats.totalTimeMs || 0) + timeMs
  const totalAttempts = (stats.totalAttempts || 0) + attempts
  const abandonedGames = stats.abandonedGames || 0

  const currentDistribution = stats.guessDistribution || {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0
  }

  const updatedDistribution = {
    ...currentDistribution,
    [attempts]: (currentDistribution[attempts] || 0) + 1
  }

  const avgTime = totalTimeMs / totalWins
  const avgAttempts = totalAttempts / totalWins

  const wordsPerMinute =
    totalTimeMs > 0
      ? totalWins / (totalTimeMs / 60000)
      : 0

  let profile = "iniciante"

  if (wordsPerMinute >= 20) {
    profile = "avancado"
  } else if (wordsPerMinute >= 10) {
    profile = "medio"
  }

  await updateDoc(ref, {
    stats: {
      totalGames,
      totalWins,
      totalTimeMs,
      totalAttempts,
      avgTimePerWord: avgTime,
      avgAttemptsPerWord: avgAttempts,
      profile,
      abandonedGames,
      guessDistribution: updatedDistribution
    }
  })
}

export async function saveMatchHistory(uid, data) {
  const ref = collection(db, "jogadores", uid, "partidas")

  await addDoc(ref, {
    ...data,
    createdAt: serverTimestamp()
  })
}