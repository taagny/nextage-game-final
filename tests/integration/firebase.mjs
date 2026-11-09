import { initializeApp } from "firebase/app"
import { connectAuthEmulator, getAuth } from "firebase/auth"
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore"

const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST
const firestoreHost = process.env.FIRESTORE_EMULATOR_HOST
for (const host of [authHost, firestoreHost]) {
  if (!host || !/^127\.0\.0\.1:\d+$/.test(host)) {
    throw new Error("Integração exige ambos os emuladores locais. Use npm run test:integration.")
  }
}
export const app = initializeApp({ projectId: "demo-nextage-v2", apiKey: "fake-api-key", authDomain: "localhost" })
export const auth = getAuth(app)
export const db = getFirestore(app)
connectAuthEmulator(auth, `http://${authHost}`, { disableWarnings: true })
const [host, port] = firestoreHost.split(":")
connectFirestoreEmulator(db, host, Number(port))
