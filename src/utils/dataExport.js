export function serializeTimestamps(value) {
  if (value == null) return value
  if (value instanceof Date) return value.toISOString()
  if (typeof value.toDate === "function") return value.toDate().toISOString()
  if (Array.isArray(value)) return value.map(serializeTimestamps)
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, serializeTimestamps(item)])
    )
  }
  return value
}

export function timestampISO(value) {
  if (value == null || value === "") return ""
  const serialized = serializeTimestamps(value)
  const date = new Date(serialized)
  if (Number.isNaN(date.getTime())) throw new Error("Timestamp inválido nos dados exportados.")
  return date.toISOString()
}

function csvCell(value) {
  let text = value == null ? "" : String(value)
  // Aspas sozinhas não impedem fórmulas em planilhas.
  if (typeof value === "string" && (/^[=+\-@]/.test(text.trimStart()) || /^[\t\r\n]/.test(text))) {
    text = `'${text}`
  }
  return `"${text.replaceAll('"', '""')}"`
}

export function toCSV(columns, rows) {
  return (
    [columns, ...rows.map((row) => columns.map((column) => row[column]))]
      .map((row) => row.map(csvCell).join(";"))
      .join("\r\n") + "\r\n"
  )
}

export function personalMatchesCSV(matches, countersFixedAt) {
  const columns = [
    "match_id",
    "mode",
    "won",
    "attempts",
    "time_ms",
    "abandoned",
    "word",
    "created_at",
    "counters_valid_since"
  ]
  return toCSV(
    columns,
    matches.map((match) => ({
      match_id: match.id,
      mode: match.mode,
      won: match.won,
      attempts: match.attempts,
      time_ms: match.timeMs,
      abandoned: match.abandoned,
      word: match.word,
      created_at: timestampISO(match.createdAt),
      counters_valid_since: timestampISO(countersFixedAt)
    }))
  )
}
