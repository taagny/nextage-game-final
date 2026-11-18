import { auth } from "./firebase"
import { classicSessionKey, restoreClassicRound } from "../utils/classicSession.js"

export const classicScope = (uid) => classicSessionKey(auth.app.options.projectId, uid)
const clearedScopes = new Set()

export function loadClassicSession(uid) {
  clearedScopes.delete(classicScope(uid))
  try {
    const raw = localStorage.getItem(classicScope(uid))
    return {
      round: raw && raw.length < 10000 ? restoreClassicRound(JSON.parse(raw)) : null,
      error: ""
    }
  } catch {
    return {
      round: null,
      error:
        "Não foi possível acessar o armazenamento deste navegador. A partida não poderá ser retomada após recarregar."
    }
  }
}
export async function saveClassicSession(uid, round) {
  // Escrita síncrona antes de devolver a Promise: a última renderização já fica
  // salva antes de outra interação/recarga; erros de IO chegam ao consumidor.
  if (!clearedScopes.has(classicScope(uid)))
    localStorage.setItem(classicScope(uid), JSON.stringify(round))
}
export function clearClassicSession(uid) {
  clearedScopes.add(classicScope(uid))
  localStorage.removeItem(classicScope(uid))
}
