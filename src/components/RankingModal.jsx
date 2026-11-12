import { useEffect, useEffectEvent, useState } from "react"
import { getClassicRanking } from "../services/rankingService"
import { rankingErrorMessage, firebaseErrorCode } from "../utils/firebaseErrors.js"
import Modal from "./Modal"
import RankingRow from "./RankingRow"
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
        console.error("Falha no ranking Clássico:", firebaseErrorCode(error))
        if (active) setError(rankingErrorMessage(error))
      } finally {
        if (active) setLoading(false)
      }
    }

    if (isOpen) loadRanking()
    return () => { active = false }
  }, [isOpen, uid])

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
          <span title="Derrotas no modo Clássico">DERROTAS</span>
          <span>SEQUENCIAS</span>
        </div>

        <div className="ranking-list-new" aria-busy={loading}>
          {loading && <p role="status">Carregando ranking…</p>}
          {error && <p role="alert">{error}</p>}
          {!loading && !error && players.length === 0 && (
            <p>Nenhum jogador com sequência positiva no momento.</p>
          )}
          {players.map((player, index) => (
            <RankingRow key={player.id} player={player} position={index + 1} isSelf={player.id === uid} />
          ))}
        </div>

        {!loading && !error && user && publicProfile && !players.some(player => player.id === uid) && (
          <div className="ranking-user-summary">
            <p className="ranking-user-caption">Seu desempenho{(score || 0) <= 0 ? " · Ainda não classificado" : ""}</p>
            <RankingRow player={publicProfile} position={userPosition} isSelf />
          </div>
        )}
      </div>
    </Modal>
  )
}

export default RankingModal
