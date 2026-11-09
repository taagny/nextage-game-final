import { initializeApp } from "firebase/app"
import { connectAuthEmulator, getAuth } from "firebase/auth"
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore"

// O modo explícito evita reutilizar a sessão e os dados do projeto real.
// Builds de produção sempre usam a configuração real, mesmo com --mode emulators.
const useEmulators = import.meta.env.DEV && import.meta.env.MODE === "emulators"

const firebaseConfig = {
    apiKey: "AIzaSyDShR2cu3Bze7qbJ6XC68vCxuFs57o07rs",
    authDomain: "nextage-d6d48.firebaseapp.com",
    projectId: "nextage-d6d48",
    storageBucket: "nextage-d6d48.firebasestorage.app",
    messagingSenderId: "802996452996",
    appId: "1:802996452996:web:77c35300bda7397b33ccd1"
}

const app = initializeApp(useEmulators ? {
    projectId: "demo-nextage-v2",
    apiKey: "fake-api-key",
    authDomain: "localhost"
} : firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)

if (useEmulators) {
    connectAuthEmulator(auth, "http://127.0.0.1:9099")
    connectFirestoreEmulator(db, "127.0.0.1", 8080)
    console.info("NEXTAGE local: Authentication e Firestore emulados; projeto demo-nextage-v2.")
}
