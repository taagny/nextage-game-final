import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts"

export default function ProfileEvolution({ recentMatches, recentAvgTime, improvement }) {
  const chartData = recentMatches.map((m, index) => ({
    partida: index + 1,
    attempts: m.attempts
  }))

  return (
    <div className="evolution-section">
      <h3>Evolução Recente (Últimas {recentMatches.length})</h3>

      {recentMatches.length > 0 && (
        <>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData} margin={{ top: 20, right: 20, left: 20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--input-border)" />
                <XAxis dataKey="partida" stroke="var(--muted)" tick={{ fill: "var(--muted)" }} />
                <YAxis
                  domain={[1, 6]}
                  stroke="var(--muted)"
                  tick={{ fill: "var(--muted)" }}
                  width={35}
                />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="attempts"
                  name="Tentativas"
                  stroke="var(--accent)"
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
              <strong
                style={{ color: improvement >= 0 ? "var(--positive-text)" : "var(--accent)" }}
              >
                {improvement.toFixed(1)}%
              </strong>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
