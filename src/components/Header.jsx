import { lazy, useRef, useState } from "react"
import DeferredContent from "./DeferredContent"
import { NavLink, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../context/useAuth"
import { logout } from "../services/authService"
import { registerAbandon } from "../services/playerService"
import { clearClassicSession } from "../services/classicSessionService.js"
const AuthModal = lazy(() => import("./AuthModal"))
const UserSettingsModal = lazy(() => import("./UserSettingsModal"))
const RankingModal = lazy(() => import("./RankingModal"))
const InfoModal = lazy(() => import("./InfoModal"))
const DevModal = lazy(() => import("./DevModal"))
const TermsModal = lazy(() => import("./TermsModal"))

function Header() {
  const {
    user,
    isAdmin,
    nickname,
    gameInProgress,
    gameMatchId,
    mustAcceptTerms,
    acceptTerms,
    rejectTerms
  } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const [openAuth, setOpenAuth] = useState(false)
  const [openMenu, setOpenMenu] = useState(false)
  const [openSettings, setOpenSettings] = useState(false)
  const [openRanking, setOpenRanking] = useState(false)
  const [openInfo, setOpenInfo] = useState(false)
  const [openDev, setOpenDev] = useState(false)
  const logoutInProgress = useRef(false)

  async function handleLogout() {
    if (logoutInProgress.current) return
    if (gameInProgress && user) {
      const confirmExit = window.confirm(
        "Você está com um jogo em andamento.\n\nSe sair agora sua sequência será zerada e a partida será registrada como abandono.\n\nDeseja continuar?"
      )

      if (!confirmExit) return
    }

    logoutInProgress.current = true
    try {
      if (gameInProgress && user) {
        try {
          await registerAbandon(user.uid, { matchId: gameMatchId })
          clearClassicSession(user.uid)
        } catch (error) {
          console.error("Não foi possível registrar o abandono.", error)
        }
      }
      await logout()
      setOpenMenu(false)
    } finally {
      logoutInProgress.current = false
    }
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

          {isAdmin && (
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
              <button className="user-btn" onClick={() => setOpenMenu((prev) => !prev)}>
                <span className="user-avatar">{nickname.charAt(0).toUpperCase() || "?"}</span>
                <span className="user-name">{nickname || "Jogador"}</span>
              </button>

              {openMenu && (
                <div className="user-dropdown">
                  <button
                    onClick={() => {
                      setOpenSettings(true)
                      setOpenMenu(false)
                    }}
                  >
                    Configurações
                  </button>

                  <button onClick={handleLogout}>Sair da Conta</button>
                </div>
              )}
            </div>
          )}
        </nav>
      </header>

      <DeferredContent modal>
        {openAuth && <AuthModal isOpen onClose={() => setOpenAuth(false)} />}

        {user && openSettings && (
          <UserSettingsModal
            isOpen={openSettings}
            onClose={() => setOpenSettings(false)}
            user={user}
          />
        )}

        {openRanking && <RankingModal isOpen onClose={() => setOpenRanking(false)} />}
        {openInfo && <InfoModal isOpen onClose={() => setOpenInfo(false)} />}
        {isAdmin && openDev && <DevModal isOpen onClose={() => setOpenDev(false)} />}

        {user && mustAcceptTerms && (
          <TermsModal isOpen={true} onAccept={acceptTerms} onReject={rejectTerms} />
        )}
      </DeferredContent>
    </>
  )
}

export default Header
