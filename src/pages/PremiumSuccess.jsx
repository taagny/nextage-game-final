import { useEffect } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "../services/firebase"
import { useAuth } from "../context/AuthContext"

function PremiumSuccess() {

  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  useEffect(() => {
    async function activatePremium() {
      const sessionId = searchParams.get("session_id")

      if (!user || !sessionId) {
        navigate("/")
        return
      }

      const ref = doc(db, "jogadores", user.uid)

      const expires = new Date()
      expires.setFullYear(expires.getFullYear() + 1)

      await updateDoc(ref, {
        premium: {
          active: true,
          tier: "gold",
          expiresAt: expires
        }
      })
    }

    activatePremium()
  }, [user])

  return (
    <div style={{ padding: "40px", textAlign: "center" }}>
      <h1>✅ Premium Ativado!!</h1>
      <p>Obrigado por apoiar o NEXTAGE 👑</p>
    </div>
  )
}

export default PremiumSuccess