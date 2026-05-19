import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
    apiKey: "AIzaSyDShR2cu3Bze7qbJ6XC68vCxuFs57o07rs",
    authDomain: "nextage-d6d48.firebaseapp.com",
    projectId: "nextage-d6d48",
    storageBucket: "nextage-d6d48.firebasestorage.app",
    messagingSenderId: "802996452996",
    appId: "1:802996452996:web:77c35300bda7397b33ccd1"
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)