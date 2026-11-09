import { useEffect, useEffectEvent, useState } from "react"
import { getClassicRanking } from "../services/rankingService"
import Modal from "./Modal"
import { useAuth } from "../context/useAuth"

function RankingModal({ isOpen, onClose }) {
  const [players, setPlayers] = useState([])
  const [userPosition, setUserPosition] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const { user, publicProfile } = useAuth()
  const uid = user?.uid
  const score = publicProfile?.sequenciaAtual
  // Captura o placar atual ao abrir, sem consultar de novo a cada atualização do perfil.
  const loadCurrentRanking = useEffectEvent(() => getClassicRanking(uid, score))

  useEffect(() => {
    let active = true
    async function loadRanking() {
      setLoading(true)
      setError("")
      setPlayers([])
      setUserPosition(null)
      try {
        const ranking = await loadCurrentRanking()
        if (!active) return
        setPlayers(ranking.players)
        setUserPosition(ranking.userPosition)
      } catch (error) {
        console.error("Não foi possível carregar o ranking Clássico.", error)
        if (active) setError("Não foi possível carregar o ranking. Tente novamente.")
      } finally {
        if (active) setLoading(false)
      }
    }

    if (isOpen) loadRanking()
    return () => { active = false }
  }, [isOpen, uid])

  function getMedal(index) {
    if (index === 0) return "🏆 1"
    if (index === 1) return "🥈 2"
    if (index === 2) return "🥉 3"
    return `# ${index + 1}`
  }

  return (
    <Modal isOpen={isOpen}>
      <div className="ranking-card-new">
        <button className="ranking-close" onClick={onClose}>×</button>

        <h1 className="ranking-title-new">
          RANKING NEXTAGE
        </h1>

        <div className="ranking-header-new">
          <span>TOP</span>
          <span>JOGADOR</span>
          <span title="Sequências perdidas">PERDIDAS</span>
          <span>SEQUENCIAS</span>
        </div>

        <div className="ranking-list-new" aria-busy={loading}>
          {loading && <p role="status">Carregando ranking…</p>}
          {error && <p role="alert">{error}</p>}
          {!loading && !error && players.length === 0 && (
            <p>Nenhum jogador com sequência positiva no momento.</p>
          )}
          {players.map((player, index) => (
            <div
              key={player.id}
              className={`ranking-row-new ${user && player.id === user.uid ? "ranking-row-self" : ""
                }`}
            >
              <span className="ranking-top">
                {getMedal(index)}
              </span>

              <span className="ranking-name-new">
                {player.apelido}
              </span>

              <span className="ranking-stat-new">
                {(player.sequenciasPerdidas || 0).toLocaleString("pt-BR")}
              </span>

              <span className="ranking-stat-new highlight-blue">
                {(player.sequenciaAtual || 0).toLocaleString("pt-BR")}
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

export default RankingModal
