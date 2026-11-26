import test from "node:test"
import assert from "node:assert/strict"
import { Timestamp } from "firebase-admin/firestore"
import {
  buildPrivateDocument,
  buildPublicProfile,
  LEGACY_FIELDS
} from "../../scripts/lib/migration-v2.mjs"

const createdAt = Timestamp.fromMillis(1000)
const now = Timestamp.fromMillis(2000)

test("copy extrai somente o perfil público e saneia o primeiro nome", () => {
  const profile = buildPublicProfile(
    {
      nome: "João Silva",
      email: "dado-legado",
      sequenciaAtual: 5,
      tentativas: 3,
      runnerScores: { 10: 2, 30: 3, 60: 4 },
      premium: { active: true }
    },
    now
  )
  assert.deepEqual(profile, {
    apelido: "Joao",
    sequenciaAtual: 5,
    sequenciasPerdidas: 3,
    runnerScores: { 10: 2, 30: 3, 60: 4 },
    updatedAt: now
  })
})

test("copy fornece os padrões especificados, sem truncar placares inválidos", () => {
  assert.equal(buildPublicProfile({}, now).apelido, "Jogador")
  assert.throws(() => buildPublicProfile({ runnerScores: { 10: 11 } }, now), /inválido/)
  assert.throws(() => buildPublicProfile({ sequenciaAtual: -1 }, now), /inválido/)
  assert.throws(() => buildPublicProfile({ runnerScores: { 90: 5 } }, now), /desconhecidos/)
})

test("cleanup remove os campos legados e marca a semântica nova sem recalcular o passado", () => {
  const legacy = Object.fromEntries(LEGACY_FIELDS.map((field) => [field, "legado"]))
  legacy.termsAccepted = true
  legacy.termsAcceptedAt = createdAt
  legacy.stats = {
    totalGames: 7,
    totalWins: 7,
    totalTimeMs: 14000,
    totalAttempts: 21,
    avgTimePerWord: 2000,
    avgAttemptsPerWord: 3,
    profile: "iniciante",
    abandonedGames: 2
  }
  const cleaned = buildPrivateDocument(legacy, { now, createdAt })
  for (const field of LEGACY_FIELDS) assert.equal(Object.hasOwn(cleaned, field), false)
  assert.equal(Object.hasOwn(cleaned.stats, "profile"), false)
  assert.equal(cleaned.stats.totalGames, 7)
  assert.equal(cleaned.stats.totalWins, 7)
  assert.equal(cleaned.stats.abandonedGames, 2)
  assert.equal(cleaned.stats.totalLosses, 0)
  assert.equal(cleaned.stats.totalPlayTimeMs, 14000)
  assert.equal(cleaned.stats.countersFixedAt, now)
  assert.equal(cleaned.createdAt, createdAt)
  assert.equal(cleaned.termsAccepted, false)
  assert.equal(cleaned.termsAcceptedAt, null)
  assert.equal(cleaned.schemaVersion, 2)
  assert.equal(cleaned.termsVersion, "3")
})

test("cleanup repetido é idempotente e preserva um novo aceite válido", () => {
  const cleaned = buildPrivateDocument({}, { now, createdAt })
  cleaned.termsAccepted = true
  cleaned.termsAcceptedAt = now
  const repeated = buildPrivateDocument(cleaned, { now: Timestamp.fromMillis(3000), createdAt })
  assert.deepEqual(repeated, cleaned)
})

test("cleanup recusa campos desconhecidos, datas ausentes e totais inconsistentes", () => {
  assert.throws(() => buildPrivateDocument({ role: "admin" }, { now, createdAt }), /desconhecidos/)
  assert.throws(() => buildPrivateDocument({}, { now }), /Data de criação/)
  assert.throws(
    () => buildPrivateDocument({ stats: { totalGames: 1, totalWins: 2 } }, { now, createdAt }),
    /inconsistentes/
  )
  assert.throws(
    () => buildPrivateDocument({ stats: { totalTimeMs: -1 } }, { now, createdAt }),
    /inválido/
  )
  for (const bestStreak of [-1, 1.5, "10", 1000000001]) {
    assert.throws(
      () => buildPrivateDocument({ stats: { bestStreak } }, { now, createdAt }),
      /inválido/
    )
  }
  assert.equal(
    buildPrivateDocument({ stats: { bestStreak: 10 } }, { now, createdAt }).stats.bestStreak,
    10
  )
})

test("cleanup preserva autorização ou revogação explícita e não cria participação para contas antigas", () => {
  const cleaned = buildPrivateDocument({}, { now, createdAt })
  assert.equal(Object.hasOwn(cleaned, "researchConsent"), false)
  for (const accepted of [true, false]) {
    cleaned.researchConsent = { accepted, version: "1", updatedAt: now }
    assert.deepEqual(
      buildPrivateDocument(cleaned, { now, createdAt }).researchConsent,
      cleaned.researchConsent
    )
  }
  cleaned.researchConsent.accepted = "sim"
  assert.throws(() => buildPrivateDocument(cleaned, { now, createdAt }), /pesquisa inválida/)
})
