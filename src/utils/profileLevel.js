export function getProfileLevel(totalWins = 0) {
  const wins = Number(totalWins)

  if (!Number.isFinite(wins) || wins < 0) return "iniciante"
  if (wins > 500) return "avancado"
  if (wins >= 100) return "medio"

  return "iniciante"
}
