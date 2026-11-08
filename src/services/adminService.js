import { collection, getDocs } from "firebase/firestore"
import { db } from "./firebase"
import { getProfileLevel } from "../utils/profileLevel"

export async function getGlobalStats() {
  const [snapshot, profilesSnapshot] = await Promise.all([
    getDocs(collection(db, "jogadores")),
    getDocs(collection(db, "perfisPublicos"))
  ])
  const profiles = new Map(profilesSnapshot.docs.map(profile => [profile.id, profile.data()]))

  let totalPlayers = snapshot.size
  let totalGames = 0
  let totalWins = 0
  let totalLosses = 0
  let abandonedGames = 0
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
    totalLosses += stats.totalLosses || 0
    abandonedGames += stats.abandonedGames || 0
    totalTime += stats.totalTimeMs || 0
    totalAttempts += stats.totalAttempts || 0

    if (stats.guessDistribution) {
      Object.keys(globalDistribution).forEach(key => {
        globalDistribution[key] += stats.guessDistribution[key] || 0
      })
    }

    if (stats.avgAttemptsPerWord && stats.avgTimePerWord) {
      ranking.push({
        apelido: profiles.get(docSnap.id)?.apelido || "Jogador",
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
    totalLosses,
    abandonedGames,
    avgGlobalTime: totalWins ? totalTime / totalWins / 1000 : 0,
    avgGlobalAttempts: totalWins ? totalAttempts / totalWins : 0,
    globalDistribution,
    top10
  }
}

export async function exportSummaryCSV() {
  const snapshot = await getDocs(collection(db, "jogadores"))

  let csv = "participant_id;total_games;total_wins;total_losses;abandoned_games;avg_time_seconds;avg_attempts;level;counters_valid_since\n"

  let counter = 1

  snapshot.forEach(docSnap => {
    const data = docSnap.data()
    const stats = data.stats || {}

    const participantId = `P${String(counter).padStart(3, "0")}`

    const totalGames = stats.totalGames || 0
    const totalWins = stats.totalWins || 0
    const totalLosses = stats.totalLosses || 0
    const abandonedGames = stats.abandonedGames || 0
    const avgTime = (stats.avgTimePerWord || 0) / 1000
    const avgAttempts = stats.avgAttemptsPerWord || 0
    const profile = getProfileLevel(totalWins)
    const countersValidSince = stats.countersFixedAt?.toDate?.().toISOString?.() || ""

    csv += `${participantId};${totalGames};${totalWins};${totalLosses};${abandonedGames};${avgTime.toFixed(2)};${avgAttempts.toFixed(2)};${profile};${countersValidSince}\n`

    counter++
  })

  downloadCSV(csv, "nextage_dataset_resumo.csv")
}

export async function exportMatchesCSV() {
  const snapshot = await getDocs(collection(db, "jogadores"))

  let csv = "participant_id;attempts;time_seconds;won;abandoned;word;match_date;counters_valid_since\n"

  let counter = 1

  for (const docSnap of snapshot.docs) {
    const participantId = `P${String(counter).padStart(3, "0")}`
    const countersValidSince = docSnap.data().stats?.countersFixedAt?.toDate?.().toISOString?.() || ""

    const matchesSnap = await getDocs(
      collection(db, "jogadores", docSnap.id, "partidas")
    )

    matchesSnap.forEach(matchDoc => {
      const m = matchDoc.data()

      const attempts = m.attempts || 0
      const timeSeconds = (m.timeMs || 0) / 1000
      const won = m.won || false
      const date = m.createdAt?.toDate?.().toISOString?.() || ""

      csv += `${participantId};${attempts};${timeSeconds.toFixed(2)};${won};${m.abandoned === true};${m.word || ""};${date};${countersValidSince}\n`
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
