import { LOSS_ATTEMPTS } from "./constants.js"

export function compareWithFirst(first, current) {
  if (!first) return null
  const firstAttempts = first.won ? first.attempts : LOSS_ATTEMPTS
  const currentAttempts = current.won ? current.attempts : LOSS_ATTEMPTS
  if (currentAttempts < firstAttempts) return "melhor"
  if (currentAttempts > firstAttempts) return "pior"
  if (first.won && current.won) {
    if (current.timeMs < first.timeMs) return "melhor"
    if (current.timeMs > first.timeMs) return "pior"
  }
  return "igual"
}

export function buildWordFeedback(wordDoc) {
  if (!wordDoc || wordDoc.vezesVista < 2) return null
  const comparison = compareWithFirst(
    {
      won: wordDoc.primeiraVenceu,
      attempts: wordDoc.primeiraTentativas,
      timeMs: wordDoc.primeiraTempoMs
    },
    {
      won: wordDoc.ultimaVenceu,
      attempts: wordDoc.ultimaTentativas,
      timeMs: wordDoc.ultimaTempoMs
    }
  )
  const messages = {
    melhor: "Seu desempenho foi melhor que na primeira vez.",
    pior: "Seu desempenho foi pior que na primeira vez.",
    igual: "Seu desempenho foi igual ao da primeira vez."
  }
  return {
    comparison,
    occurrences: wordDoc.vezesVista,
    message: `${messages[comparison]} Esta palavra apareceu ${wordDoc.vezesVista.toLocaleString("pt-BR")} vezes em suas partidas concluídas.`
  }
}
