import test from "node:test"
import assert from "node:assert/strict"
import { Timestamp } from "firebase/firestore"
import { toCSV } from "../../src/utils/dataExport.js"
import {
  excludeResearchAccounts,
  MATCH_COLUMNS,
  researchMatch,
  researchRunnerScores,
  researchSummary,
  SUMMARY_COLUMNS
} from "../../src/utils/researchExport.js"

const code = "P_" + "ab".repeat(32)
const timestamp = Timestamp.fromMillis(1000)

test("pesquisa usa campos permitidos e exclui identificadores, inclusive legados e aninhados", () => {
  const identity = {
    uid: "uid-fixture-privado",
    nome: "NomeFixture",
    email: "fixture@example.invalid",
    apelido: "ApelidoFixture"
  }
  const summary = researchSummary(code, {
    ...identity,
    stats: {
      ...identity,
      totalGames: 503,
      totalWins: 500,
      totalLosses: 2,
      abandonedGames: 1,
      totalTimeMs: 1000000,
      totalPlayTimeMs: 1003000,
      totalAttempts: 1500,
      avgTimePerWord: 2000,
      avgAttemptsPerWord: 3,
      countersFixedAt: timestamp,
      guessDistribution: { 3: 500, ...identity },
      profile: identity.apelido
    }
  })
  const match = researchMatch(
    code,
    {
      ...identity,
      id: "id-fixture-privado",
      mode: "classico",
      word: "CASAS",
      won: true,
      abandoned: false,
      attempts: 3,
      timeMs: 2000,
      createdAt: timestamp
    },
    timestamp
  )
  const runner = researchRunnerScores({
    ...identity,
    runnerScores: { 10: 1, 30: 2, 60: 3, ...identity }
  })
  for (const exported of [
    JSON.stringify({ ...summary, runner_scores: runner, matches: [match] }),
    toCSV(SUMMARY_COLUMNS, [summary]),
    toCSV(MATCH_COLUMNS, [match])
  ]) {
    for (const value of [...Object.values(identity), "id-fixture-privado"])
      assert.equal(exported.includes(value), false)
  }
  assert.equal(summary.participant_id, code)
  assert.equal(summary.level, "avancado")
  assert.equal(summary.total_losses, 2)
  assert.equal(summary.abandoned_games, 1)
  assert.equal(summary.counters_valid_since, "1970-01-01T00:00:01.000Z")
  assert.deepEqual(runner, { 10: 1, 30: 2, 60: 3 })
})

test("exclusão da pesquisa remove desenvolvedor e teste antes de montar o conjunto", () => {
  const players = ["dev-fixture", "test-fixture", "participante-fixture"].map((uid) => ({
    uid,
    data: {
      termsAccepted: true,
      termsVersion: "3",
      researchConsent: { accepted: true, version: "1", updatedAt: timestamp }
    }
  }))
  assert.deepEqual(
    excludeResearchAccounts(players, ["dev-fixture", "test-fixture"]).map((player) => player.uid),
    ["participante-fixture"]
  )
  assert.equal(players.length, 3)
})

test("exportação exclui contas antigas, recusas, revogações e versões antigas", () => {
  const active = {
    termsAccepted: true,
    termsVersion: "3",
    researchConsent: { accepted: true, version: "1", updatedAt: timestamp }
  }
  const data = [
    active,
    {},
    { ...active, termsVersion: "2" },
    { ...active, termsAccepted: false },
    { ...active, researchConsent: { accepted: false, version: "1", updatedAt: timestamp } },
    { ...active, researchConsent: { accepted: true, version: "0", updatedAt: timestamp } },
    { ...active, researchConsent: { accepted: true, version: "1" } }
  ]
  assert.deepEqual(
    excludeResearchAccounts(
      data.map((data, uid) => ({ uid, data })),
      []
    ).map((p) => p.uid),
    [0]
  )
})

test("pesquisa mantém contadores legados e data vazia quando não há marca de correção", () => {
  const summary = researchSummary(code, {
    stats: { totalGames: 7, totalWins: 7, abandonedGames: 2 }
  })
  assert.equal(summary.total_games, 7)
  assert.equal(summary.abandoned_games, 2)
  assert.equal(summary.total_losses, 0)
  assert.equal(summary.counters_valid_since, "")
})

test("pesquisa recusa UID no lugar do código e métricas inválidas", () => {
  assert.throws(() => researchSummary("uid-bruto-fixture", {}), /Código/)
  assert.throws(() => researchSummary(code, { stats: { totalWins: "500" } }), /contador/)
  assert.throws(() => researchSummary(code, { stats: { totalGames: -1 } }), /métrica/)
  assert.throws(() => researchMatch(code, { won: "NomeFixture" }), /desfecho/)
})
