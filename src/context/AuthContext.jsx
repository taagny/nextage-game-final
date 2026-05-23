import { createContext, useContext, useEffect, useState } from "react"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore"
import { auth, db } from "../services/firebase"

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [gameInProgress, setGameInProgress] = useState(false)
  const [mustAcceptTerms, setMustAcceptTerms] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)

      if (!currentUser) {
        setMustAcceptTerms(false)
        setLoading(false)
        return
      }

      const ref = doc(db, "jogadores", currentUser.uid)
      const snap = await getDoc(ref)

      if (snap.exists()) {
        const data = snap.data()

        if (data.termsAccepted !== true) {
          setMustAcceptTerms(true)
        } else {
          setMustAcceptTerms(false)
        }
      } else {
        setMustAcceptTerms(true)
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  async function acceptTerms() {
    if (!user) return

    const ref = doc(db, "jogadores", user.uid)

    await updateDoc(ref, {
      termsAccepted: true,
      termsAcceptedAt: serverTimestamp()
    })

    setMustAcceptTerms(false)
  }

  async function rejectTerms() {
    await signOut(auth)
    setMustAcceptTerms(false)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        gameInProgress,
        setGameInProgress,
        mustAcceptTerms,
        acceptTerms,
        rejectTerms
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}