import { getProfileLevel } from "./profileLevel.js"
import { timestampISO } from "./dataExport.js"
import { hasResearchConsent } from "./researchConsent.js"

export const SUMMARY_COLUMNS = [
  "participant_id",
  "key_id",
  "total_games",
  "total_wins",
  "total_losses",
  "abandoned_games",
  "total_time_ms",
  "total_play_time_ms",
  "total_attempts",
  "avg_time_seconds",
  "avg_attempts",
  "level",
  "counters_valid_since"
]
export const MATCH_COLUMNS = [
  "participant_id",
  "key_id",
  "mode",
  "attempts",
  "time_seconds",
  "won",
  "abandoned",
  "word",
  "match_date",
  "counters_valid_since"
]

function numeric(value = 0) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new Error("Há uma métrica inválida nos dados de pesquisa; revise os registros.")
  }
  return value
}
function count(value = 0) {
  if (!Number.isSafeInteger(value))
    throw new Error("Há um contador inválido nos dados de pesquisa.")
  return numeric(value)
}
function flag(value = false) {
  if (typeof value !== "boolean") throw new Error("Há um desfecho inválido nos dados de pesquisa.")
  return value
}
function participant(code) {
  if (!/^P_[a-f0-9]{64}$/.test(code)) throw new Error("Código de pesquisa inválido.")
  return code
}

export function excludeResearchAccounts(players, excludedUIDs) {
  const excluded = new Set(excludedUIDs)
  return players.filter((player) => !excluded.has(player.uid) && hasResearchConsent(player.data))
}

export function researchSummary(code, player) {
  const stats = player.stats ?? {}
  const wins = count(stats.totalWins)
  return {
    participant_id: participant(code),
    total_games: count(stats.totalGames),
    total_wins: wins,
    total_losses: count(stats.totalLosses),
    abandoned_games: count(stats.abandonedGames),
    total_time_ms: count(stats.totalTimeMs),
    total_play_time_ms: count(stats.totalPlayTimeMs ?? stats.totalTimeMs),
    total_attempts: count(stats.totalAttempts),
    avg_time_seconds: numeric(stats.avgTimePerWord) / 1000,
    avg_attempts: numeric(stats.avgAttemptsPerWord),
    level: getProfileLevel(wins),
    counters_valid_since: timestampISO(stats.countersFixedAt),
    guess_distribution: Object.fromEntries(
      [1, 2, 3, 4, 5, 6].map((attempt) => [
        String(attempt),
        count(stats.guessDistribution?.[attempt])
      ])
    )
  }
}

export function researchMatch(code, match, countersFixedAt) {
  return {
    participant_id: participant(code),
    mode: match.mode === "classico" ? "classico" : "",
    attempts: count(match.attempts),
    time_seconds: count(match.timeMs) / 1000,
    won: flag(match.won),
    abandoned: flag(match.abandoned),
    word: typeof match.word === "string" && /^[A-Z]{5}$/.test(match.word) ? match.word : "",
    match_date: timestampISO(match.createdAt),
    counters_valid_since: timestampISO(countersFixedAt)
  }
}

export function researchRunnerScores(profile) {
  return Object.fromEntries(
    [10, 30, 60].map((duration) => [String(duration), count(profile?.runnerScores?.[duration])])
  )
}
