import { collection, getDocs } from "firebase/firestore"
import { db } from "./firebase"
import { getProfileLevel } from "../utils/profileLevel"

export async function getGlobalStats() {
  const snapshot = await getDocs(collection(db, "jogadores"))

  let totalPlayers = snapshot.size
  let totalGames = 0
  let totalWins = 0
  let totalTime = 0
  let totalAttempts = 0

  let globalDistribution = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0
  }

  const ranking = []

  snapshot.forEach(docSnap => {
    const data = docSnap.data()

    const stats = data.stats || {}

    totalGames += stats.totalGames || 0
    totalWins += stats.totalWins || 0
    totalTime += stats.totalTimeMs || 0
    totalAttempts += stats.totalAttempts || 0

    if (stats.guessDistribution) {
      Object.keys(globalDistribution).forEach(key => {
        globalDistribution[key] += stats.guessDistribution[key] || 0
      })
    }

    if (stats.avgAttemptsPerWord && stats.avgTimePerWord) {
      ranking.push({
        nome: data.nome || "Jogador",
        avgAttempts: stats.avgAttemptsPerWord,
        avgTime: stats.avgTimePerWord / 1000
      })
    }
  })

  ranking.sort((a, b) => {
    if (a.avgAttempts !== b.avgAttempts) {
      return a.avgAttempts - b.avgAttempts
    }
    return a.avgTime - b.avgTime
  })

  const top10 = ranking.slice(0, 10)

  return {
    totalPlayers,
    totalGames,
    totalWins,
    avgGlobalTime: totalWins ? totalTime / totalWins / 1000 : 0,
    avgGlobalAttempts: totalWins ? totalAttempts / totalWins : 0,
    globalDistribution,
    top10
  }
}

export async function exportSummaryCSV() {
  const snapshot = await getDocs(collection(db, "jogadores"))

  let csv = "participant_id;total_games;total_wins;avg_time_seconds;avg_attempts;profile\n"

  let counter = 1

  snapshot.forEach(docSnap => {
    const data = docSnap.data()
    const stats = data.stats || {}

    const participantId = `P${String(counter).padStart(3, "0")}`

    const totalGames = stats.totalGames || 0
    const totalWins = stats.totalWins || 0
    const avgTime = (stats.avgTimePerWord || 0) / 1000
    const avgAttempts = stats.avgAttemptsPerWord || 0
    const profile = getProfileLevel(totalWins)

    csv += `${participantId};${totalGames};${totalWins};${avgTime.toFixed(2)};${avgAttempts.toFixed(2)};${profile}\n`

    counter++
  })

  downloadCSV(csv, "nextage_dataset_resumo.csv")
}

export async function exportMatchesCSV() {
  const snapshot = await getDocs(collection(db, "jogadores"))

  let csv = "participant_id;attempts;time_seconds;won;match_date\n"

  let counter = 1

  for (const docSnap of snapshot.docs) {
    const participantId = `P${String(counter).padStart(3, "0")}`

    const matchesSnap = await getDocs(
      collection(db, "jogadores", docSnap.id, "partidas")
    )

    matchesSnap.forEach(matchDoc => {
      const m = matchDoc.data()

      const attempts = m.attempts || 0
      const timeSeconds = (m.timeMs || 0) / 1000
      const won = m.won || false
      const date = m.createdAt?.toDate?.().toISOString?.() || ""

      csv += `${participantId};${attempts};${timeSeconds.toFixed(2)};${won};${date}\n`
    })

    counter++
  }

  downloadCSV(csv, "nextage_dataset_partidas.csv")
}

function downloadCSV(content, fileName) {
  const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.setAttribute("download", fileName)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export async function exportFullBackup() {
  const snapshot = await getDocs(collection(db, "jogadores"))

  const backup = {}

  for (const docSnap of snapshot.docs) {
    const userData = docSnap.data()

    const matchesSnap = await getDocs(
      collection(db, "jogadores", docSnap.id, "partidas")
    )

    const partidas = matchesSnap.docs.map(matchDoc => ({
      id: matchDoc.id,
      ...matchDoc.data()
    }))

    backup[docSnap.id] = {
      ...userData,
      partidas
    }
  }

  const jsonString = JSON.stringify(backup, null, 2)

  downloadJSON(jsonString, "nextage_full_backup.json")
}

function downloadJSON(content, fileName) {
  const blob = new Blob([content], { type: "application/json;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.setAttribute("download", fileName)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
