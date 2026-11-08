import { useEffect, useState } from "react"
import Modal from "./Modal"
import {
  getGlobalStats,
  exportSummaryCSV,
  exportMatchesCSV,
  exportResearchJSON
} from "../services/adminService"

function DevModal({ isOpen, onClose }) {

  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true
    async function loadStats() {
      if (!isOpen) return
      setLoading(true)
      setError("")
      setStats(null)
      try {
        const data = await getGlobalStats()
        if (active) setStats(data)
      } catch (error) {
        console.error("Não foi possível carregar os dados de pesquisa.", error?.code ?? error?.name)
        if (active) setError(error.code ? "Não foi possível carregar os dados. Entre novamente e tente outra vez." : error.message)
      } finally {
        if (active) setLoading(false)
      }
    }

    loadStats()
    return () => { active = false }
  }, [isOpen])

  async function handleExport(exporter) {
    if (exporting) return
    setExporting(true)
    setError("")
    try {
      await exporter()
    } catch (error) {
      console.error("Não foi possível exportar a pesquisa.", error?.code ?? error?.name)
      setError(error.code ? "Não foi possível exportar os dados. Entre novamente e tente outra vez." : error.message)
    } finally {
      setExporting(false)
    }
  }

  return (
    <Modal isOpen={isOpen}>
      <div className="modal-card dev-panel">

        <button className="dev-close" onClick={onClose} disabled={exporting}>×</button>

        <h2 className="dev-title">Painel de Pesquisa</h2>

        {loading && <p>Carregando...</p>}
        {error && <p role="alert">{error}</p>}
        {exporting && <p role="status">Gerando exportação…</p>}

        {stats && (
          <div className="dev-grid">

            <div className="dev-card">
              <h3>Métricas Globais</h3>
              <div className="dev-metrics">
                <div>👥 {stats.totalPlayers} participantes da pesquisa</div>
                <div>🎮 {stats.totalGames} partidas</div>
                <div>🏆 {stats.totalWins} vitórias</div>
                <div>Derrotas: {stats.totalLosses}</div>
                <div>Abandonos: {stats.abandonedGames}</div>
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
                  <div key={player.code} className="dev-rank-row">
                    <span className="rank-pos">{index + 1}</span>
                    <span className="rank-name">{player.code}</span>
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
              <p>As contas excluídas da pesquisa não entram nestes totais ou arquivos. Dados legados mantêm a semântica anterior dos contadores.</p>
              <div className="dev-actions">
                <button className="modal-btn green" disabled={exporting} onClick={() => handleExport(exportSummaryCSV)}>
                  Exportar Resumo CSV
                </button>
                <button className="modal-btn red" disabled={exporting} onClick={() => handleExport(exportMatchesCSV)}>
                  Exportar Histórico CSV
                </button>
                <button
                  className="modal-btn"
                  style={{ background: "#6366f1", color: "#fff" }}
                  disabled={exporting}
                  onClick={() => handleExport(exportResearchJSON)}
                >
                  Exportar Pesquisa (JSON)
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
