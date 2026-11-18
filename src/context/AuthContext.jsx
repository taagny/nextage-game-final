import { useEffect, useState } from "react"
import {
  ensurePlayerExists,
  setTermsAccepted,
  setResearchConsent,
  subscribeToPlayer,
  subscribeToPublicProfile
} from "../services/playerService"
import { TERMS_VERSION } from "../utils/constants"
import { getAdminStatus, observeAuthState, logout } from "../services/authService"

import { AuthContext } from "./authContextValue"

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [gameInProgress, setGameInProgress] = useState(false)
  const [gameMatchId, setGameMatchId] = useState(null)
  const [mustAcceptTerms, setMustAcceptTerms] = useState(false)
  const [nickname, setNickname] = useState("")
  const [publicProfile, setPublicProfile] = useState(null)
  const [profileError, setProfileError] = useState("")
  const [researchPlayer, setResearchPlayer] = useState(null)

  useEffect(() => {
    let active = true
    let session = 0
    let unsubscribeProfile
    let unsubscribePlayer
    const unsubscribe = observeAuthState(async (currentUser) => {
      const currentSession = ++session
      unsubscribeProfile?.()
      unsubscribeProfile = undefined
      unsubscribePlayer?.()
      unsubscribePlayer = undefined
      setResearchPlayer(null)
      setLoading(true)
      setUser(null)
      setIsAdmin(false)
      setNickname("")
      setPublicProfile(null)
      setGameInProgress(false)
      setGameMatchId(null)
      setMustAcceptTerms(false)
      setProfileError("")
      try {
        if (!currentUser) return
        // As rotas só são liberadas após a criação dos dois documentos.
        const [{ player, publicProfile }, adminStatus] = await Promise.all([
          ensurePlayerExists(currentUser.uid, currentUser.displayName),
          getAdminStatus(currentUser)
        ])
        if (!active || currentSession !== session) return
        setNickname(publicProfile.apelido)
        setIsAdmin(adminStatus)
        setPublicProfile(publicProfile)
        setResearchPlayer(player)
        unsubscribePlayer = subscribeToPlayer(
          currentUser.uid,
          (nextPlayer) => {
            if (!active || currentSession !== session) return
            setResearchPlayer(nextPlayer)
            setMustAcceptTerms(
              !nextPlayer?.termsAccepted || nextPlayer.termsVersion !== TERMS_VERSION
            )
          },
          (error) => {
            console.error("Não foi possível acompanhar a participação na pesquisa.", error?.code)
            if (active && currentSession === session) setResearchPlayer(null)
          }
        )
        unsubscribeProfile = subscribeToPublicProfile(
          currentUser.uid,
          (profile) => {
            if (!active || currentSession !== session) return
            setPublicProfile(profile)
            setNickname(profile?.apelido ?? "")
          },
          (error) => {
            console.error("Não foi possível acompanhar o perfil público.", error)
            if (active && currentSession === session) setPublicProfile(null)
          }
        )
        setMustAcceptTerms(player.termsAccepted !== true || player.termsVersion !== TERMS_VERSION)
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
      unsubscribeProfile?.()
      unsubscribePlayer?.()
      unsubscribe()
    }
  }, [])

  async function acceptTerms(participateInResearch = false) {
    if (!user) return

    await setTermsAccepted(user.uid, participateInResearch)
    setMustAcceptTerms(false)
  }

  async function changeResearchConsent(accepted) {
    if (!user) throw new Error("Entre na conta para alterar a participação.")
    await setResearchConsent(user.uid, accepted)
  }

  async function rejectTerms() {
    await logout()
    setMustAcceptTerms(false)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        nickname,
        publicProfile,
        setNickname,
        loading,
        gameInProgress,
        setGameInProgress,
        gameMatchId,
        setGameMatchId,
        mustAcceptTerms,
        acceptTerms,
        rejectTerms,
        researchPlayer,
        changeResearchConsent
      }}
    >
      {!loading &&
        (profileError ? (
          <div role="alert">
            <p>{profileError}</p>
            <button onClick={() => window.location.reload()}>Tentar novamente</button>
          </div>
        ) : (
          children
        ))}
    </AuthContext.Provider>
  )
}
