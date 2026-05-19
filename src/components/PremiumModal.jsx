import { useEffect, useState } from "react"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "../services/firebase"
import { useAuth } from "../context/AuthContext"
import Modal from "../components/Modal"

function PremiumModal({ isOpen, onClose }) {

  const { user } = useAuth()
  const [premiumUsers, setPremiumUsers] = useState([])
  const [isPremiumUser, setIsPremiumUser] = useState(false)

  const STRIPE_PAYMENT_LINK =
  window.location.hostname === "localhost"
    ? import.meta.env.VITE_STRIPE_PAYMENT_LINK_LOCAL
    : import.meta.env.VITE_STRIPE_PAYMENT_LINK_PROD

  useEffect(() => {
    async function loadPremium() {
      if (!isOpen) return

      const q = query(
        collection(db, "jogadores"),
        where("premium.active", "==", true)
      )

      const snapshot = await getDocs(q)

      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      setPremiumUsers(list)

      if (user) {
        const currentUser = list.find(p => p.id === user.uid)
        setIsPremiumUser(!!currentUser)
      }
    }

    loadPremium()
  }, [isOpen, user])

  return (
    <Modal isOpen={isOpen}>
      <div className="modal-card premium-modal">

        <h2 className="premium-title">
          👑 Apoiadores Premium
        </h2>

        <p className="premium-text">
          Usuários Premium possuem destaque especial no ranking
          e ajudam diretamente no crescimento do NEXTAGE.
        </p>

        <div className="premium-highlight">
          ✨ Nick dourado no ranking  
          ✨ Coroa exclusiva  
          ✨ Destaque especial  
          ✨ Assinatura anual
        </div>

        {!isPremiumUser && (
          <a
            href={STRIPE_PAYMENT_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="premium-buy-btn"
          >
            Tornar-se Premium (1 ano)
          </a>
        )}

        {isPremiumUser && (
          <div className="premium-active">
            ✅ Você é um apoiador Premium
          </div>
        )}

        {premiumUsers.length > 0 && (
          <div className="premium-list">
            {premiumUsers.map(user => (
              <div key={user.id} className="premium-user">
                👑 {user.nome}
              </div>
            ))}
          </div>
        )}

        <button className="premium-close-btn" onClick={onClose}>
          Fechar
        </button>

      </div>
    </Modal>
  )
}

export default PremiumModal