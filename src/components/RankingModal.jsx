import { useEffect, useState } from "react"
import { collection, query, orderBy, getDocs } from "firebase/firestore"
import { db } from "../services/firebase"
import Modal from "./Modal"
import { useAuth } from "../context/AuthContext"

function RankingModal({ isOpen, onClose }) {
  const [players, setPlayers] = useState([])
  const [userPosition, setUserPosition] = useState(null)

  const { user } = useAuth()

  useEffect(() => {
    async function loadRanking() {
      const q = query(
        collection(db, "jogadores"),
        orderBy("sequenciaAtual", "desc")
      )

      const snapshot = await getDocs(q)

      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      const top100 = list.slice(0, 100)

      setPlayers(top100)

      if (user) {
        const index = list.findIndex(p => p.id === user.uid)
        setUserPosition(index !== -1 ? index + 1 : null)
      }
    }

    if (isOpen) loadRanking()
  }, [isOpen, user])

  function getMedal(index) {
    if (index === 0) return "🏆 1"
    if (index === 1) return "🥈 2"
    if (index === 2) return "🥉 3"
    return `# ${index + 1}`
  }

  const premiumPlayers = players.filter(p => p.premium?.active)

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
          <span>TENTATIVAS</span>
          <span>SEQUENCIAS</span>
        </div>

        <div className="ranking-list-new">
          {players.map((player, index) => (
            <div
              key={player.id}
              className={`ranking-row-new ${user && player.id === user.uid ? "ranking-row-self" : ""
                }`}
            >
              <span className="ranking-top">
                {getMedal(index)}
              </span>

              <span className={`ranking-name-new ${player.premium?.active ? "premium-name" : ""}`}>
                {player.nome}
                {player.premium?.active && <span className="premium-badge">👑</span>}
              </span>

              <span className="ranking-stat-new">
                {(player.tentativas || 0).toLocaleString("pt-BR")}
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