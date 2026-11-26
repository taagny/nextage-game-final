import { defaultNickname } from "../../src/utils/nickname.js"
import { initialPlayerStats } from "../../src/utils/playerStats.js"
import { TERMS_VERSION } from "../../src/utils/constants.js"

export const LEGACY_FIELDS = [
  "email",
  "nome",
  "premium",
  "online",
  "lastActive",
  "jogoAberto",
  "jogos",
  "vitorias",
  "tentativas",
  "sequenciaAtual",
  "runnerScores"
]
const PRIVATE_FIELDS = [
  "schemaVersion",
  "termsAccepted",
  "termsAcceptedAt",
  "termsVersion",
  "createdAt",
  "stats",
  "researchConsent"
]

function onlyKnown(data, keys, label) {
  if (
    !data ||
    typeof data !== "object" ||
    Array.isArray(data) ||
    Object.keys(data).some((key) => !keys.includes(key))
  ) {
    throw new Error(`${label}: formato ou campos desconhecidos; revise antes de aplicar.`)
  }
}

function integer(value, maximum, label) {
  if (!Number.isSafeInteger(value) || value < 0 || value > maximum) {
    throw new Error(
      `${label}: valor inválido; o script não limita nem corrige placares silenciosamente.`
    )
  }
  return value
}

export function buildPublicProfile(legacy, updatedAt) {
  const scores = legacy.runnerScores ?? {}
  onlyKnown(scores, ["10", "30", "60"], "runnerScores")
  return {
    apelido: defaultNickname(legacy.nome),
    sequenciaAtual: integer(legacy.sequenciaAtual ?? 0, 1000000000, "sequenciaAtual"),
    sequenciasPerdidas: integer(legacy.tentativas ?? 0, 1000000000, "sequenciasPerdidas"),
    runnerScores: Object.fromEntries(
      [10, 30, 60].map((time) => [
        String(time),
        integer(scores[time] ?? 0, time, `runnerScores/${time}`)
      ])
    ),
    updatedAt
  }
}

export function buildPrivateDocument(legacy, { now, createdAt }) {
  onlyKnown(legacy, [...PRIVATE_FIELDS, ...LEGACY_FIELDS], "jogador")
  const originalStats = legacy.stats ?? {}
  const defaults = initialPlayerStats(now)
  onlyKnown(originalStats, [...Object.keys(defaults), "profile"], "stats")
  onlyKnown(
    originalStats.guessDistribution ?? {},
    ["1", "2", "3", "4", "5", "6"],
    "guessDistribution"
  )
  const stats = Object.fromEntries(
    Object.keys(defaults).map((key) => [key, originalStats[key] ?? defaults[key]])
  )
  stats.totalPlayTimeMs = originalStats.totalPlayTimeMs ?? stats.totalTimeMs
  stats.guessDistribution = { ...defaults.guessDistribution, ...originalStats.guessDistribution }
  // Nunca recalcular os contadores legados: a semântica anterior fica documentada.
  stats.countersFixedAt = legacy.schemaVersion === 2 ? (originalStats.countersFixedAt ?? now) : now
  for (const key of ["totalGames", "totalWins", "totalLosses", "abandonedGames", "bestStreak"]) {
    integer(stats[key], 1000000000, key)
  }
  for (const key of ["totalTimeMs", "totalPlayTimeMs", "totalAttempts"]) {
    integer(stats[key], Number.MAX_SAFE_INTEGER, key)
  }
  for (const value of Object.values(stats.guessDistribution))
    integer(value, 1000000000, "guessDistribution")
  if (
    stats.totalWins > stats.totalGames ||
    stats.totalPlayTimeMs < stats.totalTimeMs ||
    !Number.isFinite(stats.avgTimePerWord) ||
    stats.avgTimePerWord < 0 ||
    stats.avgTimePerWord > 86400000 ||
    !Number.isFinite(stats.avgAttemptsPerWord) ||
    stats.avgAttemptsPerWord < 0 ||
    stats.avgAttemptsPerWord > 6
  ) {
    throw new Error("Estatísticas legadas inconsistentes; revise antes de aplicar.")
  }
  const creation = legacy.createdAt ?? createdAt
  if (
    !creation ||
    typeof creation.toMillis !== "function" ||
    !Number.isFinite(creation.toMillis())
  ) {
    throw new Error("Data de criação ausente: é necessário obtê-la no Firebase Authentication.")
  }
  const resetTerms = legacy.schemaVersion !== 2 || legacy.termsVersion !== TERMS_VERSION
  const consent = legacy.researchConsent
  if (consent !== undefined) {
    onlyKnown(consent, ["accepted", "version", "updatedAt"], "researchConsent")
    if (
      typeof consent.accepted !== "boolean" ||
      consent.version !== "1" ||
      typeof consent.updatedAt?.toMillis !== "function" ||
      !Number.isFinite(consent.updatedAt.toMillis())
    ) {
      throw new Error("Autorização de pesquisa inválida; revise antes de aplicar.")
    }
  }
  if (
    typeof stats.countersFixedAt?.toMillis !== "function" ||
    !Number.isFinite(stats.countersFixedAt.toMillis()) ||
    (!resetTerms &&
      legacy.termsAccepted === true &&
      (typeof legacy.termsAcceptedAt?.toMillis !== "function" ||
        !Number.isFinite(legacy.termsAcceptedAt.toMillis())))
  ) {
    throw new Error(
      "Timestamp de consentimento ou dos contadores inválido; revise antes de aplicar."
    )
  }
  return {
    schemaVersion: 2,
    termsAccepted: resetTerms ? false : legacy.termsAccepted === true,
    termsAcceptedAt: resetTerms || legacy.termsAccepted !== true ? null : legacy.termsAcceptedAt,
    termsVersion: TERMS_VERSION,
    createdAt: creation,
    stats,
    ...(consent === undefined ? {} : { researchConsent: { ...consent } })
  }
}
