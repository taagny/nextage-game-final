import { useState, useEffect } from "react"
import { NavLink, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { signOut } from "firebase/auth"
import { auth } from "../services/firebase"
import { doc, getDoc, updateDoc, serverTimestamp, increment } from "firebase/firestore"
import { db } from "../services/firebase"
import { saveMatchHistory } from "../services/playerService"
import PremiumModal from "./PremiumModal"
import AuthModal from "./AuthModal"
import UserSettingsModal from "./UserSettingsModal"
import RankingModal from "./RankingModal"
import InfoModal from "./InfoModal"
import DevModal from "./DevModal"
import TermsModal from "./TermsModal"

function Header() {

  const { user, gameInProgress } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const DEV_UID = "Pfi5xF95YCTi3KB52l2zEwFpQ6d2"
  const isDev = user?.uid === DEV_UID

  const [openAuth, setOpenAuth] = useState(false)
  const [openMenu, setOpenMenu] = useState(false)
  const [openSettings, setOpenSettings] = useState(false)
  const [openRanking, setOpenRanking] = useState(false)
  const [openInfo, setOpenInfo] = useState(false)
  const [openDev, setOpenDev] = useState(false)
  const [openTerms, setOpenTerms] = useState(false)
  const [userName, setUserName] = useState("")
  const [openPremium, setOpenPremium] = useState(false)

  useEffect(() => {
    if (!user) {
      setUserName("")
      return
    }

    const checkUserData = async () => {
      const ref = doc(db, "jogadores", user.uid)
      const snap = await getDoc(ref)

      if (!snap.exists()) return

      const data = snap.data()
      setUserName(data.nome || "")

      if (data.termsAccepted !== true) {
        setOpenTerms(true)
      }
    }

    checkUserData()
  }, [user])

  async function handleAcceptTerms() {
    if (!user) return

    const ref = doc(db, "jogadores", user.uid)

    await updateDoc(ref, {
      termsAccepted: true,
      termsAcceptedAt: serverTimestamp()
    })

    setOpenTerms(false)
  }

  async function handleRejectTerms() {
    await signOut(auth)
  }

  async function handleLogout() {
    if (gameInProgress && user) {
      const confirmExit = window.confirm(
        "Você está com um jogo em andamento.\n\nSe sair agora sua sequência será zerada e a partida será registrada como abandono.\n\nDeseja continuar?"
      )

      if (!confirmExit) return

      try {
        const ref = doc(db, "jogadores", user.uid)

        await updateDoc(ref, {
          sequenciaAtual: 0,
          "stats.abandonedGames": increment(1)
        })

        await saveMatchHistory(user.uid, {
          mode: "classico",
          won: false,
          attempts: 0,
          timeMs: 0,
          abandoned: true
        })
      } catch (err) {}
    }

    await signOut(auth)
    setOpenMenu(false)
  }

  function handleTrophyClick() {
    if (location.pathname === "/runner") {
      window.dispatchEvent(new Event("openRunnerRanking"))
    } else {
      setOpenRanking(true)
    }
  }

  function handleRunnerClick(e) {
    if (location.pathname === "/runner") {
      e.preventDefault()
      window.dispatchEvent(new Event("openRunnerMode"))
    } else {
      navigate("/runner")
    }
  }

  return (
    <>
      <header className="header">
        <div className="header-left">
          <button className="icon-btn" onClick={handleTrophyClick}>
            <span className="trophy-emoji">🏆</span>
          </button>

          <button className="icon-btn premium-icon" onClick={() => setOpenPremium(true)}>
            👑
          </button>
        </div>

        <h1 className="logo">NEXTAGE</h1>

        <nav className="nav">
          <button className="info-btn" onClick={() => setOpenInfo(true)}>
            <svg viewBox="0 0 24 24" className="info-svg">
              <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" fill="none" />
              <line x1="12" y1="10" x2="12" y2="16" stroke="white" strokeWidth="2" />
              <circle cx="12" cy="7" r="1.2" fill="white" />
            </svg>
          </button>

          <NavLink to="/runner" className="nav-btn" onClick={handleRunnerClick}>
            Runner
          </NavLink>

          {isDev && (
            <button className="dev-btn" onClick={() => setOpenDev(true)}>
              ⚙️
            </button>
          )}

          {!user && (
            <button className="nav-btn" onClick={() => setOpenAuth(true)}>
              Login
            </button>
          )}

          {user && (
            <div className="user-menu-wrapper">
              <button className="user-btn" onClick={() => setOpenMenu(prev => !prev)}>
                <span className="user-avatar">
  {userName?.charAt?.(0)?.toUpperCase?.() || "?"}
</span>
                <span className="user-name">{userName}</span>
              </button>

              {openMenu && (
                <div className="user-dropdown">
                  <button onClick={() => {
                    setOpenSettings(true)
                    setOpenMenu(false)
                  }}>
                    Configurações
                  </button>

                  <button onClick={handleLogout}>
                    Sair da Conta
                  </button>
                </div>
              )}
            </div>
          )}
        </nav>
      </header>

      <AuthModal isOpen={openAuth} onClose={() => setOpenAuth(false)} />

      {user && (
        <UserSettingsModal
          isOpen={openSettings}
          onClose={() => setOpenSettings(false)}
          user={user}
        />
      )}

      <RankingModal isOpen={openRanking} onClose={() => setOpenRanking(false)} />
      <InfoModal isOpen={openInfo} onClose={() => setOpenInfo(false)} />
      <DevModal isOpen={openDev} onClose={() => setOpenDev(false)} />

      <TermsModal
        isOpen={openTerms}
        onAccept={handleAcceptTerms}
        onReject={handleRejectTerms}
      />

      <PremiumModal isOpen={openPremium} onClose={() => setOpenPremium(false)} />
    </>
  )
}

export default Header
