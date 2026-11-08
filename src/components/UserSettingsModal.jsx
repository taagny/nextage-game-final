import { useEffect, useState } from "react"
import Modal from "./Modal"
import { useAuth } from "../context/AuthContext"
import { getPlayer, getPublicProfile, getRecentMatches, updateNickname } from "../services/playerService"
import { getProfileLevel } from "../utils/profileLevel"
import { validateNickname } from "../utils/nickname"
import { NICKNAME_MIN, NICKNAME_MAX } from "../utils/constants"
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from "recharts"

const PROFILE_LABELS = {
    iniciante: "INICIANTE",
    medio: "MÉDIO",
    avancado: "AVANÇADO"
}

function formatPlayTime(timeMs) {
    const totalSeconds = Math.floor(timeMs / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    if (hours > 0) return `${hours}h ${minutes}min ${seconds}s`
    if (minutes > 0) return `${minutes}min ${seconds}s`
    return `${seconds}s`
}

function UserSettingsModal({ isOpen, onClose, user }) {

    const { nickname, setNickname } = useAuth()
    const [activeTab, setActiveTab] = useState("profile")
    const [nicknameDraft, setNicknameDraft] = useState("")
    const [profileError, setProfileError] = useState("")
    const [profileLoading, setProfileLoading] = useState(false)
    const [savingNickname, setSavingNickname] = useState(false)
    const [nicknameTouched, setNicknameTouched] = useState(false)
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
                getPlayer(user.uid), getPublicProfile(user.uid), getRecentMatches(user.uid)
            ])
            if (!active) return
            setNicknameDraft(profile?.apelido || "")
            setStats(player?.stats || null)
            const matches = recent
                .filter(m => m.mode === "classico" && !m.abandoned)
                .reverse()

            setRecentMatches(matches)

            if (matches.length > 0) {
                const avgTime =
                    matches.reduce((acc, m) => acc + (m.timeMs || 0), 0) / matches.length

                setRecentAvgTime(avgTime / 1000)

                if (matches.length >= 6) {
                    const firstHalf = matches.slice(0, Math.floor(matches.length / 2))
                    const secondHalf = matches.slice(Math.floor(matches.length / 2))

                    const avgFirst =
                        firstHalf.reduce((acc, m) => acc + m.attempts, 0) / firstHalf.length

                    const avgSecond =
                        secondHalf.reduce((acc, m) => acc + m.attempts, 0) / secondHalf.length

                    const improvementPercent =
                        ((avgFirst - avgSecond) / avgFirst) * 100

                    setImprovement(improvementPercent)
                }
            }
        }

        if (isOpen) loadUser().catch(error => {
            console.error("Não foi possível carregar o perfil.", error)
            if (active) setProfileError("Não foi possível carregar os dados do perfil.")
        }).finally(() => {
            if (active) setProfileLoading(false)
        })
        return () => { active = false }
    }, [isOpen, user])

    async function handleSave() {
        if (savingNickname || profileLoading) return
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
    const formattedCreationDate = creationDate && !Number.isNaN(creationDate.getTime())
        ? new Intl.DateTimeFormat("pt-BR").format(creationDate)
        : null

    const chartData = recentMatches.map((m, index) => ({
        partida: index + 1,
        attempts: m.attempts
    }))

    function renderDistribution() {
        if (!stats?.guessDistribution) return null

        const distribution = stats.guessDistribution
        const values = Object.values(distribution)
        const maxValue = Math.max(...values, 1)

        return (
            <div className="guess-distribution">
                <h3>Histórico de Acertos</h3>

                {Object.keys(distribution)
                    .sort((a, b) => Number(a) - Number(b))
                    .map((attempt) => {
                        const value = distribution[attempt] || 0
                        const percentage = (value / maxValue) * 100

                        return (
                            <div key={attempt} className="guess-row">
                                <span className="guess-attempt">{attempt}</span>
                                <div className="guess-bar-wrapper">
                                    <div
                                        className="guess-bar"
                                        style={{ width: `${percentage}%` }}
                                    >
                                        {value > 0 && (
                                            <span className="guess-count">
                                                {value}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
            </div>
        )
    }

    return (
        <Modal isOpen={isOpen}>
            <div className="modal-card profile-modal">
                {profileError && <p role="alert">{profileError}</p>}

                <div className="profile-tabs">
                    <button
                        className={activeTab === "profile" ? "active" : ""}
                        onClick={() => setActiveTab("profile")}
                    >
                        Perfil
                    </button>

                    <button
                        className={activeTab === "evolution" ? "active" : ""}
                        onClick={() => setActiveTab("evolution")}
                    >
                        Evolução
                    </button>

                    <button
                        className={activeTab === "settings" ? "active" : ""}
                        onClick={() => setActiveTab("settings")}
                    >
                        Configurações
                    </button>
                </div>

                {activeTab === "profile" && (stats || formattedCreationDate) && (
                    <div className="profile-content">

                        <h2>{nickname}</h2>

                        {formattedCreationDate && (
                            <p className="profile-created-at">
                                Conta criada em: {formattedCreationDate}
                            </p>
                        )}

                        {stats && (
                            <>
                                <div className="profile-badge">
                                    Nível de experiência: <strong>{PROFILE_LABELS[getProfileLevel(stats.totalWins)]}</strong>
                                </div>

                                <div className="profile-metrics">
                                    <div className="profile-metric">
                                        <svg className="profile-metric-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 21h8m-4-4v4m-5-17h10v5a5 5 0 0 1-10 0V4Zm0 2H4v2a4 4 0 0 0 4 4m8-6h4v2a4 4 0 0 1-4 4" /></svg>
                                        <span className="profile-metric-copy"><span className="profile-metric-label">Vitórias</span><strong className="profile-metric-value">{stats.totalWins}</strong></span>
                                    </div>
                                    <div className="profile-metric">
                                        <svg className="profile-metric-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="4" width="17" height="16" rx="2" /><path d="M8 4v16m8-16v16M3.5 9h4.5m8 0h4.5m-17 6h4.5m8 0h4.5" /></svg>
                                        <span className="profile-metric-copy"><span className="profile-metric-label">Partidas</span><strong className="profile-metric-value">{stats.totalGames}</strong></span>
                                    </div>
                                    <div className="profile-metric profile-metric-total-time">
                                        <svg className="profile-metric-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></svg>
                                        <span className="profile-metric-copy"><span className="profile-metric-label">Tempo total em jogo</span><strong className="profile-metric-value">{formatPlayTime(stats.totalPlayTimeMs ?? stats.totalTimeMs ?? 0)}</strong></span>
                                    </div>
                                    <div className="profile-metric">
                                        <svg className="profile-metric-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l-3 2m3-2 4 2" /></svg>
                                        <span className="profile-metric-copy"><span className="profile-metric-label">Tempo médio</span><strong className="profile-metric-value">{(stats.avgTimePerWord / 1000).toFixed(1)}<small> s</small></strong></span>
                                    </div>
                                    <div className="profile-metric">
                                        <svg className="profile-metric-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></svg>
                                        <span className="profile-metric-copy"><span className="profile-metric-label">Média de tentativas</span><strong className="profile-metric-value">{stats.avgAttemptsPerWord?.toFixed(2)}</strong></span>
                                    </div>
                                </div>

                                {renderDistribution()}
                            </>
                        )}

                        <div className="profile-actions">
                            <button className="close-profile-btn" onClick={onClose}>
                                Fechar
                            </button>
                        </div>

                    </div>
                )}

                {activeTab === "evolution" && (
                    <div className="evolution-section">

                        <h3>Evolução Recente (Últimas {recentMatches.length})</h3>

                        {recentMatches.length > 0 && (
                            <>
                                <div className="chart-wrapper">
                                    <ResponsiveContainer width="100%" height={260}>
                                        <LineChart
                                            data={chartData}
                                            margin={{ top: 20, right: 20, left: 20, bottom: 10 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3c" />
                                            <XAxis
                                                dataKey="partida"
                                                stroke="#ccc"
                                                tick={{ fill: "#ccc" }}
                                            />
                                            <YAxis
                                                domain={[1, 6]}
                                                stroke="#ccc"
                                                tick={{ fill: "#ccc" }}
                                                width={35}
                                            />
                                            <Tooltip />
                                            <Line
                                                type="monotone"
                                                dataKey="attempts"
                                                name="Tentativas"
                                                stroke="#ff3b3b"
                                                strokeWidth={3}
                                                dot={{ r: 5 }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>

                                <div className="evolution-stats">
                                    <div>Tempo médio recente: {recentAvgTime.toFixed(1)}s</div>
                                    <div>
                                        Melhoria:{" "}
                                        <strong style={{ color: improvement >= 0 ? "#4CAF50" : "#ff3b3b" }}>
                                            {improvement.toFixed(1)}%
                                        </strong>
                                    </div>
                                </div>
                            </>
                        )}

                    </div>
                )}

                {activeTab === "settings" && (
                    <div className="settings-section">
                        <label className="settings-label" htmlFor="nickname-input">
                            Apelido público:
                        </label>

                        <input
                            id="nickname-input"
                            type="text"
                            value={nicknameDraft}
                            onChange={(e) => {
                                setNicknameDraft(e.target.value)
                                setNicknameTouched(true)
                            }}
                            minLength={NICKNAME_MIN}
                            maxLength={NICKNAME_MAX}
                            pattern="[A-Za-z0-9_-]+"
                            required
                            disabled={profileLoading || savingNickname}
                            aria-invalid={nicknameTouched && Boolean(nicknameError)}
                            aria-describedby="nickname-help nickname-error"
                            className="settings-input-modern"
                        />
                        <p id="nickname-help">
                            De {NICKNAME_MIN} a {NICKNAME_MAX} caracteres: letras sem acento, números, _ e -.
                            Seu apelido aparece nos rankings públicos.
                        </p>
                        <p id="nickname-error" role="alert">
                            {nicknameTouched ? nicknameError : ""}
                        </p>

                        <div className="settings-actions">
                            <button
                                className="modal-btn green"
                                onClick={handleSave}
                                disabled={profileLoading || savingNickname || Boolean(nicknameError) || nicknameDraft === nickname}
                            >
                                {savingNickname ? "Salvando…" : "Salvar"}
                            </button>

                            <button className="modal-btn red" onClick={onClose}>
                                Cancelar
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </Modal>
    )
}

export default UserSettingsModal
