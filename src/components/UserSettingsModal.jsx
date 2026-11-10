import { useEffect, useRef, useState } from "react"
import Modal from "./Modal"
import AccountDataSection from "./AccountDataSection"
import { useAuth } from "../context/useAuth"
import { getPlayer, getPublicProfile, getRecentMatches, updateNickname } from "../services/playerService"
import { getHardestWords } from "../services/wordService"
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
    iniciante: "Iniciante",
    medio: "Médio",
    avancado: "Avançado"
}

const PROFILE_TABS = [
    { id: "profile", label: "Perfil" },
    { id: "evolution", label: "Evolução" },
    { id: "words", label: "Palavras" },
    { id: "settings", label: "Configurações" }
]

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
    const [hardestWords, setHardestWords] = useState([])
    const [wordsLoading, setWordsLoading] = useState(false)
    const [wordsError, setWordsError] = useState("")
    const modalRef = useRef(null)

    useEffect(() => {
        if (!isOpen) return
        const previousFocus = document.activeElement
        modalRef.current?.querySelector(".profile-close")?.focus()
        return () => {
            if (previousFocus?.isConnected) previousFocus.focus()
        }
    }, [isOpen])

    useEffect(() => {
        if (!isOpen) return
        function handleKey(event) {
            if (event.key === "Escape" && !accountBusy) {
                event.preventDefault()
                onClose()
            }
            if (event.key !== "Tab") return
            const elements = [...modalRef.current.querySelectorAll(
                'button:not(:disabled), input:not(:disabled), [tabindex="0"]'
            )].filter(element => element.getClientRects().length)
            const first = elements[0], last = elements.at(-1)
            if (!first) return
            if (event.shiftKey && (document.activeElement === first || !modalRef.current.contains(document.activeElement))) {
                event.preventDefault()
                last.focus()
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault()
                first.focus()
            }
        }
        document.addEventListener("keydown", handleKey)
        return () => document.removeEventListener("keydown", handleKey)
    }, [isOpen, onClose, accountBusy])

    function handleTabKey(event) {
        const keys = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"]
        if (accountBusy || !keys.includes(event.key)) return
        event.preventDefault()
        const current = PROFILE_TABS.findIndex(tab => tab.id === activeTab)
        const next = event.key === "Home" ? 0 : event.key === "End" ? PROFILE_TABS.length - 1
            : (current + (["ArrowRight", "ArrowDown"].includes(event.key) ? 1 : -1) + PROFILE_TABS.length) % PROFILE_TABS.length
        setActiveTab(PROFILE_TABS[next].id)
        modalRef.current.querySelector(`#profile-tab-${PROFILE_TABS[next].id}`)?.focus()
    }

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

    useEffect(() => {
        if (!isOpen || activeTab !== "words" || !uid) return
        let active = true
        async function loadWords() {
            setWordsLoading(true)
            setWordsError("")
            setHardestWords([])
            try {
                const words = await getHardestWords(uid, 10)
                if (active) setHardestWords(words)
            } catch (error) {
                console.error("Não foi possível carregar o histórico por palavra.", error?.code ?? error?.name)
                if (active) setWordsError("Não foi possível carregar as palavras. Tente abrir esta aba novamente.")
            } finally {
                if (active) setWordsLoading(false)
            }
        }
        loadWords()
        return () => { active = false }
    }, [isOpen, activeTab, uid])

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
                <div className="profile-section-heading">
                    <h3>Distribuição de acertos</h3>
                    <span>Por número de tentativas</span>
                </div>

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
            <section className="modal-card profile-modal" ref={modalRef}
                role="dialog" aria-modal="true" aria-labelledby="profile-modal-title">
                <header className="profile-modal-header">
                    <div>
                        <span className="profile-brand">NEXTAGE</span>
                        <h2 id="profile-modal-title">Sua conta</h2>
                        <p>Um lugar para acompanhar seu jogo.</p>
                    </div>
                    <button
                        type="button"
                        className="profile-close"
                        aria-label="Fechar configurações do usuário"
                        onClick={onClose}
                        disabled={accountBusy}
                    >
                        ×
                    </button>
                </header>
                <div className="profile-modal-body">

                <div className="profile-tabs" role="tablist" aria-label="Seções da conta" onKeyDown={handleTabKey}>
                    {PROFILE_TABS.map(tab => (
                        <button key={tab.id} type="button" role="tab" id={`profile-tab-${tab.id}`}
                            aria-selected={activeTab === tab.id}
                            aria-controls={activeTab === tab.id ? `profile-panel-${tab.id}` : undefined}
                            tabIndex={activeTab === tab.id ? 0 : -1}
                            className={activeTab === tab.id ? "active" : ""}
                            disabled={accountBusy} onClick={() => setActiveTab(tab.id)}>
                            {tab.label}
                        </button>
                    ))}
                </div>
                <div className="profile-panel" role="tabpanel" id={`profile-panel-${activeTab}`}
                    aria-labelledby={`profile-tab-${activeTab}`} tabIndex={0}>
                {profileError && <p className="profile-notice" role="alert">{profileError}</p>}
                {profileLoading && <p className="profile-status" role="status">Carregando seu perfil…</p>}

                {activeTab === "profile" && (stats || formattedCreationDate) && (
                    <div className="profile-content">

                        <div className="profile-identity">
                            <span className="profile-kicker">Seu perfil</span>
                            <h3>{nickname}</h3>

                        {formattedCreationDate && (
                            <p className="profile-created-at">
                                Membro desde {formattedCreationDate}
                            </p>
                        )}
                        </div>

                        {stats && (
                            <>
                                <div className="profile-badge">
                                    <span className="profile-level-dot" aria-hidden="true" />
                                    Nível <strong>{PROFILE_LABELS[getProfileLevel(stats.totalWins)]}</strong>
                                </div>

                                <div className="profile-summary">
                                    <div className="profile-score">
                                        <span className="profile-kicker">Vitórias no Clássico</span>
                                        <strong>{(stats.totalWins ?? 0).toLocaleString("pt-BR")}</strong>
                                        <span>Uma palavra de cada vez.</span>
                                    </div>
                                    <dl className="profile-metrics">
                                        <div><dt>Partidas</dt><dd>{(stats.totalGames ?? 0).toLocaleString("pt-BR")}</dd></div>
                                        <div><dt>Tempo em jogo</dt><dd>{formatPlayTime(stats.totalPlayTimeMs ?? stats.totalTimeMs ?? 0)}</dd></div>
                                        <div><dt>Tempo médio por vitória</dt><dd>{(stats.avgTimePerWord / 1000).toFixed(1)} <small>s</small></dd></div>
                                        <div><dt>Média de tentativas</dt><dd>{stats.avgAttemptsPerWord?.toFixed(2)}</dd></div>
                                    </dl>
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

                        <div className="profile-section-intro">
                            <span className="profile-kicker">Seu desempenho</span>
                            <h3>Evolução recente</h3>
                            <p>Tentativas nas últimas {recentMatches.length} partidas concluídas do Clássico.</p>
                        </div>
                        {recentMatches.length === 0 && <p className="profile-empty">Conclua partidas do modo Clássico para acompanhar sua evolução.</p>}

                        {recentMatches.length > 0 && (
                            <>
                                <div className="chart-wrapper">
                                    <ResponsiveContainer width="100%" height={260}>
                                        <LineChart
                                            data={chartData}
                                            margin={{ top: 20, right: 14, left: 0, bottom: 10 }}
                                        >
                                            <CartesianGrid vertical={false} stroke="#323447" />
                                            <XAxis
                                                dataKey="partida"
                                                stroke="#55586e"
                                                tick={{ fill: "#b1b3c2", fontSize: 12 }}
                                                tickLine={false}
                                            />
                                            <YAxis
                                                domain={[1, 6]}
                                                ticks={[1, 2, 3, 4, 5, 6]}
                                                stroke="#55586e"
                                                tick={{ fill: "#b1b3c2", fontSize: 12 }}
                                                tickLine={false}
                                                axisLine={false}
                                                width={35}
                                            />
                                            <Tooltip contentStyle={{ background: "#11121f", border: "1px solid #55586e", borderRadius: 6, color: "#f4f4f8" }}
                                                labelFormatter={value => `Partida ${value}`} />
                                            <Line
                                                type="monotone"
                                                dataKey="attempts"
                                                name="Tentativas"
                                                stroke="#ff7881"
                                                strokeWidth={2}
                                                dot={{ r: 3, strokeWidth: 2, fill: "#181926" }}
                                                isAnimationActive={false}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>

                                <div className="evolution-stats">
                                    <div>Tempo médio recente: {recentAvgTime.toFixed(1)}s</div>
                                    <div>
                                        Melhoria:{" "}
                                        <strong>
                                            {improvement.toFixed(1)}%
                                        </strong>
                                    </div>
                                </div>
                            </>
                        )}

                    </div>
                )}

                {activeTab === "words" && (
                    <section className="word-history-pane" aria-labelledby="word-history-title" aria-busy={wordsLoading}>
                        <div className="profile-section-intro">
                            <span className="profile-kicker">Seu repertório</span>
                            <h3 id="word-history-title">Histórico de palavras</h3>
                        </div>
                        <p>Até 10 palavras das suas partidas concluídas no modo Clássico. Derrotas contam como 7 tentativas nesta média.</p>
                        {wordsLoading && <p role="status">Carregando palavras…</p>}
                        {wordsError && <p role="alert">{wordsError}</p>}
                        {!wordsLoading && !wordsError && hardestWords.length === 0 && (
                            <p>Conclua partidas do modo Clássico para começar seu histórico por palavra.</p>
                        )}
                        {hardestWords.length > 0 && (
                            <table className="word-history-table">
                                <thead>
                                    <tr><th scope="col">Palavra</th><th scope="col">Média</th><th scope="col">Partidas</th></tr>
                                </thead>
                                <tbody>
                                    {hardestWords.map(word => (
                                        <tr key={word.word}>
                                            <th scope="row">{word.word}</th>
                                            <td>{word.mediaTentativas.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            <td>{word.vezesVista.toLocaleString("pt-BR")}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                        <div className="profile-actions">
                            <button className="close-profile-btn" onClick={onClose}>Fechar</button>
                        </div>
                    </section>
                )}

                {activeTab === "settings" && (
                    <div className="settings-section">
                        <div className="profile-section-intro">
                            <span className="profile-kicker">Preferências</span>
                            <h3>Identidade pública</h3>
                            <p>Escolha como você aparece para os outros jogadores.</p>
                        </div>
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
                            disabled={profileLoading || savingNickname || accountBusy}
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
                                disabled={profileLoading || savingNickname || accountBusy || Boolean(nicknameError) || nicknameDraft === nickname}
                            >
                                {savingNickname ? "Salvando…" : "Salvar apelido"}
                            </button>

                            <button className="modal-btn" onClick={onClose} disabled={accountBusy}>
                                Cancelar
                            </button>
                        </div>
                        <AccountDataSection user={user} onBusyChange={setAccountBusy} disabled={savingNickname || profileLoading} />
                    </div>
                )}

                </div>
                </div>
            </section>
        </Modal>
    )
}

export default UserSettingsModal
