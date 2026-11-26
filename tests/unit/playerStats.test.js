import test from "node:test"
import assert from "node:assert/strict"
import { getBestStreak, initialPlayerStats, nextPlayerStats } from "../../src/utils/playerStats.js"

const fixedAt = "2026-11-08T00:00:00Z"

test("vitória, derrota e abandono contam como três partidas", () => {
  const initial = initialPlayerStats(fixedAt)
  const win = nextPlayerStats(
    initial,
    { won: true, abandoned: false, attempts: 3, timeMs: 12000 },
    fixedAt
  )
  const loss = nextPlayerStats(
    win,
    { won: false, abandoned: false, attempts: 6, timeMs: 18000 },
    fixedAt
  )
  const abandoned = nextPlayerStats(
    loss,
    { won: false, abandoned: true, attempts: 0, timeMs: 1000 },
    fixedAt
  )
  assert.equal(abandoned.totalGames, 3)
  assert.equal(abandoned.totalWins, 1)
  assert.equal(abandoned.totalLosses, 1)
  assert.equal(abandoned.abandonedGames, 1)
  assert.equal(abandoned.totalPlayTimeMs, 31000)
  assert.equal(abandoned.totalTimeMs, 12000)
  assert.equal(abandoned.totalAttempts, 3)
  assert.equal(abandoned.avgTimePerWord, 12000)
  assert.equal(abandoned.avgAttemptsPerWord, 3)
  assert.equal(abandoned.guessDistribution[3], 1)
  assert.equal(abandoned.guessDistribution[6], 0)
  assert.equal(abandoned.countersFixedAt, fixedAt)
  assert.equal(initial.totalGames, 0)
  assert.equal(initial.guessDistribution[3], 0)
})

test("derrota sem vitórias mantém médias zeradas", () => {
  const stats = nextPlayerStats(
    initialPlayerStats(fixedAt),
    {
      won: false,
      abandoned: false,
      attempts: 6,
      timeMs: 20000
    },
    fixedAt
  )
  assert.equal(stats.totalGames, 1)
  assert.equal(stats.totalLosses, 1)
  assert.equal(stats.avgAttemptsPerWord, 0)
  assert.equal(stats.avgTimePerWord, 0)
})

test("preserva a marca dos contadores e os totais anteriores, sem gravar profile", () => {
  const previous = {
    totalGames: 2,
    totalWins: 2,
    totalTimeMs: 10000,
    totalAttempts: 5,
    guessDistribution: { 2: 1, 3: 1 },
    countersFixedAt: fixedAt,
    profile: "iniciante"
  }
  const stats = nextPlayerStats(
    previous,
    { won: true, abandoned: false, attempts: 1, timeMs: 2000 },
    "depois"
  )
  assert.equal(stats.totalGames, 3)
  assert.equal(stats.totalPlayTimeMs, 12000)
  assert.equal(stats.avgTimePerWord, 4000)
  assert.equal(stats.avgAttemptsPerWord, 2)
  assert.equal(stats.countersFixedAt, fixedAt)
  assert.deepEqual(stats.guessDistribution, { 1: 1, 2: 1, 3: 1, 4: 0, 5: 0, 6: 0 })
  assert.equal(Object.hasOwn(stats, "profile"), false)
})

test("maior sequência mantém o recorde após derrota, nova vitória e abandono", () => {
  let stats = initialPlayerStats(fixedAt)
  let streak = 0
  for (const [won, abandoned] of [
    [true, false],
    [true, false],
    [false, false],
    [true, false],
    [false, true]
  ]) {
    stats = nextPlayerStats(
      stats,
      { won, abandoned, attempts: won ? 3 : abandoned ? 0 : 6, timeMs: 1000 },
      fixedAt,
      streak
    )
    streak = won ? streak + 1 : 0
  }
  assert.equal(stats.bestStreak, 2)
  assert.equal(stats.totalWins, 3)
  assert.equal(stats.totalGames, 5)
  for (let i = 0; i < 3; i++) {
    stats = nextPlayerStats(
      stats,
      { won: true, abandoned: false, attempts: 3, timeMs: 1000 },
      fixedAt,
      streak
    )
    streak++
  }
  assert.equal(stats.bestStreak, 3)
  assert.equal(stats.totalWins, 6)
})

test("conta antiga usa a sequência atual, sem confundir recorde com vitórias acumuladas", () => {
  const old = { ...initialPlayerStats(fixedAt), totalGames: 100, totalWins: 100 }
  delete old.bestStreak
  assert.equal(getBestStreak(old, 7), 7)
  assert.equal(getBestStreak(undefined), 0)
  const lost = nextPlayerStats(
    old,
    { won: false, abandoned: false, attempts: 6, timeMs: 1000 },
    fixedAt,
    7
  )
  assert.equal(lost.bestStreak, 7)
  assert.equal(lost.totalWins, 100)
  assert.equal(getBestStreak(lost, 1), 7)
  assert.equal(old.bestStreak, undefined)
})

test("recorde inclui vitória e abandono da sequência legada, mesmo acima dos totais novos", () => {
  const old = initialPlayerStats(fixedAt)
  assert.equal(
    nextPlayerStats(old, { won: true, abandoned: false, attempts: 3, timeMs: 1000 }, fixedAt, 20)
      .bestStreak,
    21
  )
  assert.equal(
    nextPlayerStats(old, { won: false, abandoned: true, attempts: 0, timeMs: 0 }, fixedAt, 20)
      .bestStreak,
    20
  )
  assert.equal(getBestStreak({ bestStreak: 5 }, 20), 20)
})
