import { useEffect, useState } from "react"
import Modal from "./Modal"
import { doc, getDoc, updateDoc, collection, query, orderBy, limit, getDocs } from "firebase/firestore"
import { db } from "../services/firebase"
import { getProfileLevel } from "../utils/profileLevel"
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

    const [activeTab, setActiveTab] = useState("profile")
    const [name, setName] = useState("")
    const [stats, setStats] = useState(null)
    const [recentMatches, setRecentMatches] = useState([])
    const [recentAvgTime, setRecentAvgTime] = useState(0)
    const [improvement, setImprovement] = useState(0)

    useEffect(() => {
        async function loadUser() {
            if (!user) return

            const ref = doc(db, "jogadores", user.uid)
            const snap = await getDoc(ref)

            if (snap.exists()) {
                const data = snap.data()
                setName(data.nome || "")
                setStats(data.stats || null)
            }

            const matchesRef = collection(db, "jogadores", user.uid, "partidas")
            const q = query(matchesRef, orderBy("createdAt", "desc"), limit(10))
            const querySnap = await getDocs(q)

            const matches = querySnap.docs
                .map(doc => doc.data())
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

        if (isOpen) loadUser()
    }, [isOpen, user])

    async function handleSave() {
        const ref = doc(db, "jogadores", user.uid)
        await updateDoc(ref, { nome: name })
        onClose()
    }

    const creationTime = user?.metadata?.creationTime
    const creationDate = creationTime ? new Date(creationTime) : null
    const formattedCreationDate = creationDate && !Number.isNaN(creationDate.getTime())
        ? new Intl.DateTimeFormat("pt-BR").format(creationDate)
        : null

    const chartData = recentMatches.map((m, index) => ({
        partida: index + 1,
        tentativas: m.attempts
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

                        <h2>{name}</h2>

                        {formattedCreationDate && (
                            <p className="profile-created-at">
                                Conta criada em: {formattedCreationDate}
                            </p>
                        )}

                        {stats && (
                            <>
                                <div className="profile-badge">
                                    Perfil: <strong>{PROFILE_LABELS[getProfileLevel(stats.totalWins)]}</strong>
                                </div>

                                <div className="profile-metrics">
                                    <div>🏆 Vitórias: {stats.totalWins}</div>
                                    <div>🎮 Jogos: {stats.totalGames}</div>
                                    <div>⌛ Tempo total jogado: {formatPlayTime(stats.totalPlayTimeMs ?? stats.totalTimeMs ?? 0)}</div>
                                    <div>⏱ Média Tempo: {(stats.avgTimePerWord / 1000).toFixed(1)}s</div>
                                    <div>🎯 Média Tentativas: {stats.avgAttemptsPerWord?.toFixed(2)}</div>
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
                                                dataKey="tentativas"
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
                        <label className="settings-label">
                            Mude seu nome de perfil:
                        </label>

                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="settings-input-modern"
                        />

                        <div className="settings-actions">
                            <button className="modal-btn green" onClick={handleSave}>
                                Salvar
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