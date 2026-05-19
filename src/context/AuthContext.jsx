import { createContext, useContext, useEffect, useState } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore"
import { auth } from "../services/firebase"
import { db } from "../services/firebase"

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [gameInProgress, setGameInProgress] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      setLoading(false)

      if (!currentUser) return

      const ref = doc(db, "jogadores", currentUser.uid)

      try {
        await updateDoc(ref, {
          online: true,
          lastActive: serverTimestamp()
        })
      } catch (err) {}

      try {
        const snap = await getDoc(ref)

        if (snap.exists()) {
          const data = snap.data()

          if (data.premium?.active) {
            const now = new Date()
            const expiresAt = data.premium.expiresAt?.toDate?.()

            if (expiresAt && now > expiresAt) {
              await updateDoc(ref, {
                "premium.active": false
              })
            }
          }
        }
      } catch (err) {}

      const handleOffline = async () => {
        try {
          await updateDoc(ref, {
            online: false,
            lastActive: serverTimestamp()
          })
        } catch (err) {}
      }

      window.addEventListener("beforeunload", handleOffline)

      document.addEventListener("visibilitychange", async () => {
        try {
          if (document.visibilityState === "hidden") {
            await updateDoc(ref, {
              online: false,
              lastActive: serverTimestamp()
            })
          } else {
            await updateDoc(ref, {
              online: true,
              lastActive: serverTimestamp()
            })
          }
        } catch (err) {}
      })
    })

    return () => unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, gameInProgress, setGameInProgress }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}