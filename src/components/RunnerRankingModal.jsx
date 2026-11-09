import { useState, useEffect, useEffectEvent } from "react"
import { getRunnerRanking } from "../services/rankingService"
import { rankingErrorMessage, firebaseErrorCode } from "../utils/firebaseErrors.js"
import Modal from "./Modal"
import { useAuth } from "../context/useAuth"

function RunnerRankingModal({ isOpen, onClose, time }) {
  const [players, setPlayers] = useState([])
  const [userPosition, setUserPosition] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const { user, publicProfile } = useAuth()
  const uid = user?.uid
  const score = publicProfile?.runnerScores?.[time]
  const loadCurrentRanking = useEffectEvent(() => getRunnerRanking(time, uid, score))

  useEffect(() => {
    let active = true
    async function loadRanking() {
      setLoading(true)
      setError("")
      setPlayers([])
      setUserPosition(null)
      try {
        if (!time) return
        const ranking = await loadCurrentRanking()
        if (!active) return
        setPlayers(ranking.players)
        setUserPosition(ranking.userPosition)
      } catch (error) {
        console.error("Falha no ranking Runner:", firebaseErrorCode(error))
        if (active) setError(rankingErrorMessage(error))
      } finally {
        if (active) setLoading(false)
      }
    }

    if (isOpen) loadRanking()
    return () => { active = false }
  }, [isOpen, time, uid])

  function getMedal(index) {
    if (index === 0) return "🏆 1"
    if (index === 1) return "🥈 2"
    if (index === 2) return "🥉 3"
    return `# ${index + 1}`
  }

  return (
    <Modal isOpen={isOpen}>
      <div className="ranking-card-new ranking-card-runner">
        <button className="ranking-close" onClick={onClose}>×</button>

        <h1 className="ranking-title-new">
          RANKING RUNNER {time ? `${time}s` : ""}
        </h1>

        <div className="ranking-header-new">
          <span>TOP</span>
          <span>JOGADOR</span>
          <span>PONTOS</span>
        </div>

        <div className="ranking-list-new" aria-busy={loading}>
          {loading && <p role="status">Carregando ranking…</p>}
          {error && <p role="alert">{error}</p>}
          {!loading && !error && !time && <p>Escolha uma duração para consultar o ranking.</p>}
          {!loading && !error && time && players.length === 0 && (
            <p>Nenhum jogador com pontuação positiva nessa duração.</p>
          )}
          {players.map((player, index) => (
            <div
              key={player.id}
              className={`ranking-row-new ${
                user && player.id === user.uid ? "ranking-row-self" : ""
              }`}
            >
              <span className="ranking-top">
                {getMedal(index)}
              </span>

              <span
                className="ranking-name-new"
              >
                {player.apelido}
                
              </span>

              <span className="ranking-stat-new highlight-blue">
                {(player.runnerScores?.[time] || 0).toLocaleString("pt-BR")}
              </span>
            </div>
          ))}
        </div>

        {userPosition && userPosition > 100 && (
          <div className="ranking-user-position">
            Sua posição: #{userPosition}
          </div>
        )}
      </div>
    </Modal>
  )
}

export default RunnerRankingModal
