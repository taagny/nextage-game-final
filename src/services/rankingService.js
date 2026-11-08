import {
  collection, documentId, endBefore, FieldPath, getCountFromServer,
  getDocs, limit, orderBy, query, where
} from "firebase/firestore"
import { db } from "./firebase"

const RANKING_LIMIT = 100

async function getRanking(field, uid, score) {
  const profiles = collection(db, "perfisPublicos")
  // O desempate explícito mantém a ordem padrão de __name__ do índice descendente.
  const ranked = query(
    profiles,
    where(field, ">", 0),
    orderBy(field, "desc"),
    orderBy(documentId(), "desc")
  )
  const snapshot = await getDocs(query(ranked, limit(RANKING_LIMIT)))
  const players = snapshot.docs.map(profile => ({ ...profile.data(), id: profile.id }))
  const userIndex = uid ? players.findIndex(player => player.id === uid) : -1
  if (userIndex !== -1) return { players, userPosition: userIndex + 1 }
  if (!uid || !Number.isFinite(score) || score <= 0) {
    return { players, userPosition: null }
  }

  // O perfil próprio vem do contexto: nenhuma leitura extra de documento aqui.
  // O cursor inclui o ID para contar também os empates anteriores ao usuário.
  const ahead = query(ranked, endBefore(score, uid))
  const count = await getCountFromServer(ahead)
  return { players, userPosition: count.data().count + 1 }
}

export function getClassicRanking(uid, score) {
  return getRanking("sequenciaAtual", uid, score)
}

export function getRunnerRanking(time, uid, score) {
  const duration = String(time)
  if (!["10", "30", "60"].includes(duration)) {
    throw new Error("Selecione uma duração válida para consultar o ranking.")
  }
  return getRanking(new FieldPath("runnerScores", duration), uid, score)
}
