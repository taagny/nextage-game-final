export function initialPlayerStats(countersFixedAt) {
  return {
    totalGames: 0,
    totalWins: 0,
    bestStreak: 0,
    totalLosses: 0,
    abandonedGames: 0,
    totalTimeMs: 0,
    totalPlayTimeMs: 0,
    totalAttempts: 0,
    avgTimePerWord: 0,
    avgAttemptsPerWord: 0,
    guessDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
    countersFixedAt
  }
}

export function getBestStreak(stats, currentStreak = 0) {
  return Math.max(stats?.bestStreak ?? 0, currentStreak)
}

export function nextPlayerStats(previous, result, countersFixedAt, currentStreak = 0) {
  const stats = { ...initialPlayerStats(countersFixedAt), ...previous }
  const { won, abandoned, timeMs, attempts } = result
  const totalWins = stats.totalWins + Number(won)
  // As médias de tempo e tentativas continuam considerando apenas vitórias.
  const totalTimeMs = stats.totalTimeMs + (won ? timeMs : 0)
  const totalAttempts = stats.totalAttempts + (won ? attempts : 0)
  const guessDistribution = {
    ...initialPlayerStats(countersFixedAt).guessDistribution,
    ...stats.guessDistribution
  }
  if (won) guessDistribution[attempts] += 1

  return {
    totalGames: stats.totalGames + 1,
    totalWins,
    bestStreak: Math.max(getBestStreak(previous, currentStreak), won ? currentStreak + 1 : 0),
    totalLosses: stats.totalLosses + Number(!won && !abandoned),
    abandonedGames: stats.abandonedGames + Number(abandoned),
    totalTimeMs,
    totalPlayTimeMs: (previous?.totalPlayTimeMs ?? stats.totalTimeMs) + timeMs,
    totalAttempts,
    avgTimePerWord: totalWins ? totalTimeMs / totalWins : 0,
    avgAttemptsPerWord: totalWins ? totalAttempts / totalWins : 0,
    guessDistribution,
    countersFixedAt: stats.countersFixedAt ?? countersFixedAt
  }
}
