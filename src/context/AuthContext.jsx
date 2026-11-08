import { createContext, useContext, useEffect, useState } from "react"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { auth } from "../services/firebase"
import { ensurePlayerExists, setTermsAccepted } from "../services/playerService"
import { TERMS_VERSION } from "../utils/constants"

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [gameInProgress, setGameInProgress] = useState(false)
  const [gameMatchId, setGameMatchId] = useState(null)
  const [mustAcceptTerms, setMustAcceptTerms] = useState(false)
  const [nickname, setNickname] = useState("")
  const [profileError, setProfileError] = useState("")

  useEffect(() => {
    let active = true
    let session = 0
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      const currentSession = ++session
      setLoading(true)
      setUser(null)
      setNickname("")
      setGameInProgress(false)
      setGameMatchId(null)
      setMustAcceptTerms(false)
      setProfileError("")
      try {
        if (!currentUser) return
        // As rotas só são liberadas após a criação dos dois documentos.
        const { player, publicProfile } = await ensurePlayerExists(
          currentUser.uid, currentUser.displayName
        )
        if (!active || currentSession !== session) return
        setNickname(publicProfile.apelido)
        setMustAcceptTerms(
          player.termsAccepted !== true || player.termsVersion !== TERMS_VERSION
        )
        setUser(currentUser)
      } catch (error) {
        console.error("Não foi possível preparar o perfil.", error)
        if (active && currentSession === session) {
          setProfileError("Não foi possível carregar seu perfil. Tente novamente.")
        }
      } finally {
        if (active && currentSession === session) setLoading(false)
      }
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  async function acceptTerms() {
    if (!user) return

    await setTermsAccepted(user.uid)
    setMustAcceptTerms(false)
  }

  async function rejectTerms() {
    await signOut(auth)
    setMustAcceptTerms(false)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        nickname,
        setNickname,
        loading,
        gameInProgress,
        setGameInProgress,
        gameMatchId,
        setGameMatchId,
        mustAcceptTerms,
        acceptTerms,
        rejectTerms
      }}
    >
      {!loading && (profileError ? (
        <div role="alert">
          <p>{profileError}</p>
          <button onClick={() => window.location.reload()}>Tentar novamente</button>
        </div>
      ) : children)}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
