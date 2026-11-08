import { useEffect, useState } from "react"
import Modal from "./Modal"
import {
  getGlobalStats,
  exportSummaryCSV,
  exportMatchesCSV,
  exportFullBackup
} from "../services/adminService"

function DevModal({ isOpen, onClose }) {

  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function loadStats() {
      if (!isOpen) return
      setLoading(true)
      const data = await getGlobalStats()
      setStats(data)
      setLoading(false)
    }

    loadStats()
  }, [isOpen])

  return (
    <Modal isOpen={isOpen}>
      <div className="modal-card dev-panel">

        <button className="dev-close" onClick={onClose}>×</button>

        <h2 className="dev-title">Painel de Pesquisa</h2>

        {loading && <p>Carregando...</p>}

        {stats && (
          <div className="dev-grid">

            <div className="dev-card">
              <h3>Métricas Globais</h3>
              <div className="dev-metrics">
                <div>👥 {stats.totalPlayers} jogadores</div>
                <div>🎮 {stats.totalGames} partidas</div>
                <div>🏆 {stats.totalWins} vitórias</div>
                <div>⏱ {stats.avgGlobalTime.toFixed(2)}s média tempo</div>
                <div>🎯 {stats.avgGlobalAttempts.toFixed(2)} média tentativas</div>
              </div>
            </div>

            <div className="dev-card">
              <h3>Distribuição Global</h3>
              <div className="dev-distribution">
                {Object.keys(stats.globalDistribution).map(key => (
                  <div key={key} className="dev-dist-row">
                    <span>{key}</span>
                    <div className="dev-bar-wrapper">
                      <div
                        className="dev-bar"
                        style={{
                          width: `${stats.globalDistribution[key] * 5}px`
                        }}
                      />
                    </div>
                    <span>{stats.globalDistribution[key]}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="dev-card full-width">
              <h3>Top 10 Eficiência</h3>
              <div className="dev-ranking">
                {stats.top10.map((player, index) => (
                  <div key={index} className="dev-rank-row">
                    <span className="rank-pos">{index + 1}</span>
                    <span className="rank-name">{player.nome}</span>
                    <span className="rank-metric">
                      {player.avgAttempts.toFixed(2)} tent.
                    </span>
                    <span className="rank-time">
                      {player.avgTime.toFixed(2)}s
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="dev-card full-width export-section">
              <h3>Exportação TCC</h3>
              <div className="dev-actions">
                <button className="modal-btn green" onClick={exportSummaryCSV}>
                  Exportar Resumo CSV
                </button>
                <button className="modal-btn red" onClick={exportMatchesCSV}>
                  Exportar Histórico CSV
                </button>
                <button
                  className="modal-btn"
                  style={{ background: "#6366f1", color: "#fff" }}
                  onClick={exportFullBackup}
                >
                  Exportar Backup Completo (JSON)
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </Modal>
  )
}

export default DevModal
