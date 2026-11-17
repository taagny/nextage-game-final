import { collection, doc, getDoc, getDocs } from "firebase/firestore"
import { auth, db } from "./firebase"
import { getAdminStatus } from "./authService"
import { EXCLUDED_FROM_RESEARCH_UIDS } from "../utils/constants.js"
import { pseudonymizeUid } from "../utils/pseudonym.js"
import { downloadFile } from "../utils/download.js"
import { toCSV } from "../utils/dataExport.js"
import { hasResearchConsent } from "../utils/researchConsent.js"
import {
  excludeResearchAccounts, MATCH_COLUMNS, researchMatch, researchRunnerScores,
  researchSummary, SUMMARY_COLUMNS
} from "../utils/researchExport.js"

async function participants(key) {
  const user = auth.currentUser
  if (!user || !await getAdminStatus(user)) {
    throw new Error("Acesso restrito ao administrador.")
  }
  if (!key) throw new Error("Abra sua chave de pesquisa antes de consultar ou exportar.")
  await pseudonymizeUid("key-validation", key)
  if (EXCLUDED_FROM_RESEARCH_UIDS.length === 0) {
    throw new Error("A lista de contas excluídas da pesquisa não foi configurada.")
  }
  const snapshot = await getDocs(collection(db, "jogadores"))
  const eligible = excludeResearchAccounts(
    snapshot.docs.map(document => ({ uid: document.id, data: document.data() })),
    EXCLUDED_FROM_RESEARCH_UIDS
  )
  const records = await Promise.all(eligible.map(async player => {
    const code = await pseudonymizeUid(player.uid, key)
    return { ...player, code, summary: { ...researchSummary(code, player.data), key_id: key.id } }
  }))
  // Mesmo usando os 256 bits, não produzir silenciosamente linhas ambíguas.
  if (new Set(records.map(record => record.code)).size !== records.length) {
    throw new Error("Dois participantes receberam o mesmo código. A exportação foi interrompida para revisão.")
  }
  return records
}

async function verifyResearchParticipation(records) {
  // Revalidar depois das consultas longas: uma revogação durante a coleta
  // interrompe o arquivo, em vez de reutilizar a autorização da primeira leitura.
  const current = await Promise.all(records.map(record => getDoc(doc(db, "jogadores", record.uid))))
  if (current.some((snapshot, index) => !hasResearchConsent(snapshot.data()) ||
    !snapshot.data().researchConsent.updatedAt.isEqual(records[index].data.researchConsent.updatedAt))) {
    throw new Error("Uma participação mudou durante a consulta. Gere novamente os dados da pesquisa.")
  }
}

export async function getGlobalStats(key) {
  const records = await participants(key)
  const result = {
    totalPlayers: records.length, totalGames: 0, totalWins: 0, totalLosses: 0,
    abandonedGames: 0, avgGlobalTime: 0, avgGlobalAttempts: 0,
    globalDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
    top10: []
  }
  let totalTime = 0
  let totalAttempts = 0
  const ranking = []
  for (const { summary } of records) {
    result.totalGames += summary.total_games
    result.totalWins += summary.total_wins
    result.totalLosses += summary.total_losses
    result.abandonedGames += summary.abandoned_games
    totalTime += summary.total_time_ms
    totalAttempts += summary.total_attempts
    for (const key of Object.keys(result.globalDistribution)) {
      result.globalDistribution[key] += summary.guess_distribution[key]
    }
    if (summary.total_wins > 0) {
      ranking.push({
        code: summary.participant_id, avgAttempts: summary.avg_attempts,
        avgTime: summary.avg_time_seconds
      })
    }
  }
  ranking.sort((a, b) => a.avgAttempts - b.avgAttempts || a.avgTime - b.avgTime || a.code.localeCompare(b.code))
  result.top10 = ranking.slice(0, 10)
  result.avgGlobalTime = result.totalWins ? totalTime / result.totalWins / 1000 : 0
  result.avgGlobalAttempts = result.totalWins ? totalAttempts / result.totalWins : 0
  await verifyResearchParticipation(records)
  return result
}

export async function exportSummaryCSV(key) {
  const records = await participants(key)
  await verifyResearchParticipation(records)
  downloadFile(
    toCSV(SUMMARY_COLUMNS, records.map(record => record.summary)),
    "nextage_pesquisa_resumo.csv", "text/csv;charset=utf-8"
  )
}

export async function exportMatchesCSV(key) {
  const records = await participants(key)
  const rows = []
  for (const record of records) {
    const snapshot = await getDocs(collection(db, "jogadores", record.uid, "partidas"))
    rows.push(...snapshot.docs.map(document =>
      ({ ...researchMatch(record.code, document.data(), record.data.stats?.countersFixedAt), key_id: key.id })
    ))
  }
  await verifyResearchParticipation(records)
  downloadFile(toCSV(MATCH_COLUMNS, rows), "nextage_pesquisa_partidas.csv", "text/csv;charset=utf-8")
}

export async function exportResearchJSON(key) {
  const records = await participants(key)
  const dataset = []
  for (const record of records) {
    const [profile, matches] = await Promise.all([
      getDoc(doc(db, "perfisPublicos", record.uid)),
      getDocs(collection(db, "jogadores", record.uid, "partidas"))
    ])
    // Somente campos explicitamente permitidos; nunca espalhar dados brutos.
    dataset.push({
      ...record.summary,
      runner_scores: researchRunnerScores(profile.data()),
      matches: matches.docs.map(document =>
        researchMatch(record.code, document.data(), record.data.stats?.countersFixedAt)
      )
    })
  }
  await verifyResearchParticipation(records)
  downloadFile(JSON.stringify({
    schemaVersion: 3, exportedAt: new Date().toISOString(),
    pseudonymization: { algorithm: "HMAC-SHA-256", version: 1, keyId: key.id }, participants: dataset
  }, null, 2), "nextage_pesquisa.json", "application/json;charset=utf-8")
}
