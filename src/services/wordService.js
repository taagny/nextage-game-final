import { collection, getDocs, limit, orderBy, query } from "firebase/firestore"
import { db } from "./firebase"

export async function getHardestWords(uid, count = 10) {
  if (!Number.isInteger(count) || count < 1 || count > 10) {
    throw new Error("A consulta deve retornar de 1 a 10 palavras.")
  }
  const words = query(
    collection(db, "jogadores", uid, "palavras"),
    orderBy("mediaTentativas", "desc"), limit(count)
  )
  const snapshot = await getDocs(words)
  return snapshot.docs.map(word => ({ ...word.data(), word: word.id }))
}
