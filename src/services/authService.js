import {
  createUserWithEmailAndPassword, getIdTokenResult, GoogleAuthProvider,
  onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword,
  signInWithPopup, signOut
} from "firebase/auth"
import { auth } from "./firebase"

export const observeAuthState = callback => onAuthStateChanged(auth, callback)
export const logout = () => signOut(auth)
export const loginWithPassword = (email, password) => signInWithEmailAndPassword(auth, email, password)
export const registerWithPassword = (email, password) => createUserWithEmailAndPassword(auth, email, password)
export const loginWithGoogle = () => signInWithPopup(auth, new GoogleAuthProvider())
export const requestPasswordReset = email => sendPasswordResetEmail(auth, email)

export async function getAdminStatus(user) {
  const token = await getIdTokenResult(user)
  return token.claims.admin === true
}
