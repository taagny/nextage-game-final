import ProfileSummary from "./profile/ProfileSummary"
import ProfileEvolution from "./profile/ProfileEvolution"
import ProfileWords from "./profile/ProfileWords"
import ProfileSettings from "./profile/ProfileSettings"
import { useEffect, useState } from "react"
import Modal from "./Modal"
import { useAuth } from "../context/useAuth"
import {
  getPlayer,
  getPublicProfile,
  getRecentMatches,
  updateNickname
} from "../services/playerService"
import { getBestStreak } from "../utils/playerStats"
import { validateNickname } from "../utils/nickname"

function UserSettingsModal({ isOpen, onClose, user }) {
  const { nickname, setNickname } = useAuth()
  const uid = user?.uid
  const [activeTab, setActiveTab] = useState("profile")
  const [nicknameDraft, setNicknameDraft] = useState("")
  const [profileError, setProfileError] = useState("")
  const [profileLoading, setProfileLoading] = useState(false)
  const [savingNickname, setSavingNickname] = useState(false)
  const [nicknameTouched, setNicknameTouched] = useState(false)
  const [accountBusy, setAccountBusy] = useState(false)
  const [stats, setStats] = useState(null)
  const [recentMatches, setRecentMatches] = useState([])
  const [recentAvgTime, setRecentAvgTime] = useState(0)
  const [improvement, setImprovement] = useState(0)

  useEffect(() => {
    let active = true
    async function loadUser() {
      if (!user) return
      setProfileError("")
      setProfileLoading(true)
      setNicknameTouched(false)
      const [player, profile, recent] = await Promise.all([
        getPlayer(user.uid),
        getPublicProfile(user.uid),
        getRecentMatches(user.uid)
      ])
      if (!active) return
      setNicknameDraft(profile?.apelido || "")
      setStats(
        player?.stats
          ? { ...player.stats, bestStreak: getBestStreak(player.stats, profile?.sequenciaAtual) }
          : null
      )
      const matches = recent.filter((m) => m.mode === "classico" && !m.abandoned).reverse()

      setRecentMatches(matches)

      if (matches.length > 0) {
        const avgTime = matches.reduce((acc, m) => acc + (m.timeMs || 0), 0) / matches.length

        setRecentAvgTime(avgTime / 1000)

        if (matches.length >= 6) {
          const firstHalf = matches.slice(0, Math.floor(matches.length / 2))
          const secondHalf = matches.slice(Math.floor(matches.length / 2))

          const avgFirst = firstHalf.reduce((acc, m) => acc + m.attempts, 0) / firstHalf.length

          const avgSecond = secondHalf.reduce((acc, m) => acc + m.attempts, 0) / secondHalf.length

          const improvementPercent = ((avgFirst - avgSecond) / avgFirst) * 100

          setImprovement(improvementPercent)
        }
      }
    }

    if (isOpen)
      loadUser()
        .catch((error) => {
          console.error("Não foi possível carregar o perfil.", error)
          if (active) setProfileError("Não foi possível carregar os dados do perfil.")
        })
        .finally(() => {
          if (active) setProfileLoading(false)
        })
    return () => {
      active = false
    }
  }, [isOpen, user])

  async function handleSave() {
    if (savingNickname || profileLoading || accountBusy) return
    setNicknameTouched(true)
    setProfileError("")
    if (validateNickname(nicknameDraft)) return
    setSavingNickname(true)
    try {
      await updateNickname(user.uid, nicknameDraft)
      setNickname(nicknameDraft)
      onClose()
    } catch (error) {
      console.error("Não foi possível salvar o apelido.", error)
      setProfileError("Não foi possível salvar o apelido. Tente novamente.")
    } finally {
      setSavingNickname(false)
    }
  }

  const nicknameError = validateNickname(nicknameDraft)

  const creationTime = user?.metadata?.creationTime
  const creationDate = creationTime ? new Date(creationTime) : null
  const formattedCreationDate =
    creationDate && !Number.isNaN(creationDate.getTime())
      ? new Intl.DateTimeFormat("pt-BR").format(creationDate)
      : null

  return (
    <Modal isOpen={isOpen} onClose={onClose} closeDisabled={accountBusy}>
      <div className="modal-card profile-modal">
        <div className="profile-modal-header">
          <button
            type="button"
            className="profile-close"
            aria-label="Fechar configurações do usuário"
            onClick={onClose}
            disabled={accountBusy}
          >
            ×
          </button>
        </div>
        {profileError && <p role="alert">{profileError}</p>}

        <div className="profile-tabs">
          <button
            className={activeTab === "profile" ? "active" : ""}
            disabled={accountBusy}
            onClick={() => setActiveTab("profile")}
          >
            Perfil
          </button>

          <button
            className={activeTab === "evolution" ? "active" : ""}
            disabled={accountBusy}
            onClick={() => setActiveTab("evolution")}
          >
            Evolução
          </button>

          <button
            className={activeTab === "words" ? "active" : ""}
            disabled={accountBusy}
            onClick={() => setActiveTab("words")}
          >
            Palavras
          </button>

          <button
            className={activeTab === "settings" ? "active" : ""}
            disabled={accountBusy}
            onClick={() => setActiveTab("settings")}
          >
            Configurações
          </button>
        </div>

        {activeTab === "profile" && (
          <ProfileSummary
            stats={stats}
            nickname={nickname}
            formattedCreationDate={formattedCreationDate}
            onClose={onClose}
          />
        )}

        {activeTab === "evolution" && (
          <ProfileEvolution
            recentMatches={recentMatches}
            recentAvgTime={recentAvgTime}
            improvement={improvement}
          />
        )}

        {activeTab === "words" && <ProfileWords uid={uid} onClose={onClose} />}

        {activeTab === "settings" && (
          <ProfileSettings
            user={user}
            nickname={nickname}
            nicknameDraft={nicknameDraft}
            setNicknameDraft={setNicknameDraft}
            setNicknameTouched={setNicknameTouched}
            nicknameTouched={nicknameTouched}
            nicknameError={nicknameError}
            profileLoading={profileLoading}
            savingNickname={savingNickname}
            accountBusy={accountBusy}
            setAccountBusy={setAccountBusy}
            handleSave={handleSave}
            onClose={onClose}
          />
        )}
      </div>
    </Modal>
  )
}

export default UserSettingsModal
