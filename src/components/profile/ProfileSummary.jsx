import { getProfileLevel } from "../../utils/profileLevel"

const PROFILE_LABELS = {
  iniciante: "INICIANTE",
  medio: "MÉDIO",
  avancado: "AVANÇADO"
}

function formatPlayTime(timeMs) {
  const totalSeconds = Math.floor(timeMs / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) return `${hours}h ${minutes}min ${seconds}s`
  if (minutes > 0) return `${minutes}min ${seconds}s`
  return `${seconds}s`
}

export default function ProfileSummary({ stats, nickname, formattedCreationDate, onClose }) {
  if (!stats && !formattedCreationDate) return null
  function renderDistribution() {
    if (!stats?.guessDistribution) return null

    const distribution = stats.guessDistribution
    const values = Object.values(distribution)
    const maxValue = Math.max(...values, 1)

    return (
      <div className="guess-distribution">
        <h3>Histórico de Acertos</h3>

        {Object.keys(distribution)
          .sort((a, b) => Number(a) - Number(b))
          .map((attempt) => {
            const value = distribution[attempt] || 0
            const percentage = (value / maxValue) * 100

            return (
              <div key={attempt} className="guess-row">
                <span className="guess-attempt">{attempt}</span>
                <div className="guess-bar-wrapper">
                  <div className="guess-bar" style={{ width: `${percentage}%` }}>
                    {value > 0 && <span className="guess-count">{value}</span>}
                  </div>
                </div>
              </div>
            )
          })}
      </div>
    )
  }

  return (
    <div className="profile-content">
      <h2>{nickname}</h2>

      {formattedCreationDate && (
        <p className="profile-created-at">Conta criada em: {formattedCreationDate}</p>
      )}

      {stats && (
        <>
          <div className="profile-badge">
            Nível de experiência:{" "}
            <strong>{PROFILE_LABELS[getProfileLevel(stats.totalWins)]}</strong>
          </div>

          <div className="profile-metrics">
            <div className="profile-metric">
              <svg className="profile-metric-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8 21h8m-4-4v4m-5-17h10v5a5 5 0 0 1-10 0V4Zm0 2H4v2a4 4 0 0 0 4 4m8-6h4v2a4 4 0 0 1-4 4" />
              </svg>
              <span className="profile-metric-copy">
                <span className="profile-metric-label">Maior sequência</span>
                <strong className="profile-metric-value">
                  {stats.bestStreak.toLocaleString("pt-BR")}
                </strong>
              </span>
            </div>
            <div className="profile-metric">
              <svg className="profile-metric-icon" viewBox="0 0 24 24" aria-hidden="true">
                <rect x="3.5" y="4" width="17" height="16" rx="2" />
                <path d="M8 4v16m8-16v16M3.5 9h4.5m8 0h4.5m-17 6h4.5m8 0h4.5" />
              </svg>
              <span className="profile-metric-copy">
                <span className="profile-metric-label">Partidas</span>
                <strong className="profile-metric-value">{stats.totalGames}</strong>
              </span>
            </div>
            <div className="profile-metric profile-metric-total-time">
              <svg className="profile-metric-icon" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3.5 2" />
              </svg>
              <span className="profile-metric-copy">
                <span className="profile-metric-label">Tempo total em jogo</span>
                <strong className="profile-metric-value">
                  {formatPlayTime(stats.totalPlayTimeMs ?? stats.totalTimeMs ?? 0)}
                </strong>
              </span>
            </div>
            <div className="profile-metric">
              <svg className="profile-metric-icon" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l-3 2m3-2 4 2" />
              </svg>
              <span className="profile-metric-copy">
                <span className="profile-metric-label">Tempo médio</span>
                <strong className="profile-metric-value">
                  {(stats.avgTimePerWord / 1000).toFixed(1)}
                  <small> s</small>
                </strong>
              </span>
            </div>
            <div className="profile-metric">
              <svg className="profile-metric-icon" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <circle cx="12" cy="12" r="5" />
                <circle cx="12" cy="12" r="1" />
              </svg>
              <span className="profile-metric-copy">
                <span className="profile-metric-label">Média de tentativas</span>
                <strong className="profile-metric-value">
                  {stats.avgAttemptsPerWord?.toFixed(2)}
                </strong>
              </span>
            </div>
          </div>

          {renderDistribution()}
        </>
      )}

      <div className="profile-actions">
        <button className="close-profile-btn" onClick={onClose}>
          Fechar
        </button>
      </div>
    </div>
  )
}
