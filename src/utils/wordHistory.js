import { LOSS_ATTEMPTS } from "./constants.js"

export function nextWordDoc(previous, result, updatedAt) {
  const { won, timeMs } = result
  if (result.abandoned || typeof won !== "boolean" ||
      !Number.isSafeInteger(timeMs) || timeMs < 0 || timeMs > 86400000 ||
      (won && (!Number.isInteger(result.attempts) || result.attempts < 1 || result.attempts > 6))) {
    throw new Error("Resultado inválido para o histórico por palavra.")
  }
  const attempts = won ? result.attempts : LOSS_ATTEMPTS
  const vezesVista = (previous?.vezesVista ?? 0) + 1
  const totalTentativas = (previous?.totalTentativas ?? 0) + attempts
  const better = !previous || attempts < previous.melhorTentativas
  const faster = previous && won && attempts === previous.melhorTentativas && timeMs < previous.melhorTempoMs
  return {
    vezesVista,
    vitorias: (previous?.vitorias ?? 0) + Number(won),
    totalTentativas,
    mediaTentativas: totalTentativas / vezesVista,
    primeiraVenceu: previous?.primeiraVenceu ?? won,
    primeiraTentativas: previous?.primeiraTentativas ?? attempts,
    primeiraTempoMs: previous?.primeiraTempoMs ?? timeMs,
    melhorTentativas: better ? attempts : previous.melhorTentativas,
    melhorTempoMs: better || faster ? timeMs : previous.melhorTempoMs,
    ultimaVenceu: won,
    ultimaTentativas: attempts,
    ultimaTempoMs: timeMs,
    atualizadoEm: updatedAt
  }
}
