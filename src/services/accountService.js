import {
  deleteUser,
  EmailAuthProvider,
  GoogleAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup
} from "firebase/auth"
import { collection, doc, getDoc, getDocs, limit, query, writeBatch } from "firebase/firestore"
import { auth, db } from "./firebase"
import { beginAccountDeletion, finishAccountDeletion } from "./accountLifecycle"
import {
  deleteAccountInOrder,
  deleteInBatches,
  reauthenticationMethod
} from "../utils/accountDeletion.js"
import { personalMatchesCSV, serializeTimestamps } from "../utils/dataExport.js"
import { clearClassicSession } from "./classicSessionService.js"

function requireCurrentUser(uid) {
  if (!auth.currentUser || auth.currentUser.uid !== uid) {
    const error = new Error("Entre novamente na conta para acessar seus dados.")
    error.code = "auth/user-mismatch"
    throw error
  }
}

async function myCollection(uid, name) {
  const snapshot = await getDocs(collection(db, "jogadores", uid, name))
  return snapshot.docs.map((document) => ({ ...document.data(), id: document.id }))
}

export async function exportMyDataJSON(uid) {
  requireCurrentUser(uid)
  const [profile, player, matches, words] = await Promise.all([
    getDoc(doc(db, "perfisPublicos", uid)),
    getDoc(doc(db, "jogadores", uid)),
    myCollection(uid, "partidas"),
    myCollection(uid, "palavras")
  ])
  requireCurrentUser(uid)
  // Exportação pessoal completa do Firestore, acessível somente à própria conta.
  // O apelido faz parte do perfil público; dados do Authentication não são copiados.
  return serializeTimestamps({
    exportedAt: new Date(),
    publicProfile: profile.exists() ? profile.data() : null,
    player: player.exists() ? player.data() : null,
    matches,
    words
  })
}

export async function exportMyMatchesCSV(uid) {
  requireCurrentUser(uid)
  const [player, matches] = await Promise.all([
    getDoc(doc(db, "jogadores", uid)),
    myCollection(uid, "partidas")
  ])
  requireCurrentUser(uid)
  return personalMatchesCSV(matches, player.data()?.stats?.countersFixedAt)
}

async function reauthenticateAccount(user, password) {
  requireCurrentUser(user.uid)
  const method = reauthenticationMethod(user)
  if (method === "google") {
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: "select_account" })
    await reauthenticateWithPopup(user, provider)
  } else if (method === "password") {
    if (!password || !user.email) {
      const error = new Error("Informe sua senha para confirmar a exclusão.")
      error.code = "account/password-required"
      throw error
    }
    await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password))
  } else {
    throw new Error(
      "Não foi possível identificar uma forma de reautenticação compatível. Entre novamente."
    )
  }
  requireCurrentUser(user.uid)
}

async function removeCollection(uid, name) {
  const ref = collection(db, "jogadores", uid, name)
  await deleteInBatches(
    async (size) => {
      requireCurrentUser(uid)
      const snapshot = await getDocs(query(ref, limit(size)))
      return snapshot.docs
    },
    async (documents) => {
      requireCurrentUser(uid)
      const batch = writeBatch(db)
      documents.forEach((document) => batch.delete(document.ref))
      await batch.commit()
    }
  )
}

export async function deleteMyAccount(user, { password } = {}) {
  requireCurrentUser(user?.uid)
  const uid = user.uid
  await deleteAccountInOrder({
    reauthenticate: () => reauthenticateAccount(user, password),
    begin: () => beginAccountDeletion(uid),
    removeMatches: () => removeCollection(uid, "partidas"),
    removeWords: () => removeCollection(uid, "palavras"),
    removeProfiles: async () => {
      requireCurrentUser(uid)
      const batch = writeBatch(db)
      batch.delete(doc(db, "jogadores", uid))
      batch.delete(doc(db, "perfisPublicos", uid))
      await batch.commit()
    },
    removeAuth: () => {
      requireCurrentUser(uid)
      try {
        clearClassicSession(uid)
      } catch {
        console.warn("Não foi possível limpar a partida local desta conta.")
      }
      return deleteUser(user)
    },
    finish: (complete) => finishAccountDeletion(uid, complete)
  })
}
