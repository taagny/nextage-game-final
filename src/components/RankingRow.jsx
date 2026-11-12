function RankingRow({ player, position, isSelf = false, time }) {
  const classic = time === undefined
  const medal = position === 1 ? "🏆 1" : position === 2 ? "🥈 2" : position === 3 ? "🥉 3" : position ? `# ${position.toLocaleString("pt-BR")}` : "—"

  return (
    <div className={`ranking-row-new ${isSelf ? "ranking-row-self" : ""}`} aria-label={isSelf ? "Seu desempenho" : undefined}>
      <span className="ranking-top" aria-label={position ? `Posição ${position}` : "Sem classificação"}>{medal}</span>
      <span className="ranking-name-new">{player.apelido}</span>
      {classic && (
        <span className="ranking-stat-new">{(player.sequenciasPerdidas || 0).toLocaleString("pt-BR")}</span>
      )}
      <span className="ranking-stat-new highlight-blue">
        {(classic ? player.sequenciaAtual || 0 : player.runnerScores?.[time] || 0).toLocaleString("pt-BR")}
      </span>
    </div>
  )
}

export default RankingRow
