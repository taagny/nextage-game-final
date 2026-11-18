import { after, afterEach, before, test } from "node:test"
import assert from "node:assert/strict"
import { deleteApp, initializeApp } from "firebase/app"
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  deleteUser,
  EmailAuthProvider,
  getAuth,
  reauthenticateWithCredential,
  signInWithEmailAndPassword
} from "firebase/auth"
import { deleteAccountInOrder } from "../../src/utils/accountDeletion.js"

// Integração somente com Authentication local. As etapas do Firestore são
// simuladas; isto não é um teste completo da exclusão no banco nem do popup Google.
const host = process.env.FIREBASE_AUTH_EMULATOR_HOST
if (!host || !/^(127\.0\.0\.1|localhost):\d+$/.test(host)) {
  throw new Error("Execute com npm run test:auth: este teste exige o emulador local.")
}
let app
let auth
const password = "senha-ficticia-para-testes-123"

before(async () => {
  app = initializeApp(
    { projectId: "demo-nextage-v2", apiKey: "fake-api-key", authDomain: "localhost" },
    "account-auth-test"
  )
  auth = getAuth(app)
  connectAuthEmulator(auth, `http://${host}`, { disableWarnings: true })
  await auth.authStateReady()
})
afterEach(async () => {
  if (auth.currentUser) await deleteUser(auth.currentUser)
})
after(async () => {
  if (app) await deleteApp(app)
})

function steps(user, email, suppliedPassword, events) {
  return {
    reauthenticate: async () => {
      const credential = EmailAuthProvider.credential(email, suppliedPassword)
      const result = await reauthenticateWithCredential(user, credential)
      assert.equal(result.user.uid, user.uid)
      events.push("reauthenticate")
    },
    begin: async () => {
      events.push("begin")
    },
    removeMatches: async () => {
      events.push("matches")
    },
    removeWords: async () => {
      events.push("words")
    },
    removeProfiles: async () => {
      assert.equal(auth.currentUser.uid, user.uid)
      events.push("profiles")
    },
    removeAuth: async () => {
      await deleteUser(user)
      events.push("auth")
    },
    finish: (complete) => {
      events.push(`finish:${complete}`)
    }
  }
}

test("senha válida reautentica e exclui a conta fictícia depois das etapas de dados", async () => {
  const email = "exclusao-fixture@example.invalid"
  const { user } = await createUserWithEmailAndPassword(auth, email, password)
  const events = []
  await deleteAccountInOrder(steps(user, email, password, events))
  assert.deepEqual(events, [
    "reauthenticate",
    "begin",
    "matches",
    "words",
    "profiles",
    "auth",
    "finish:true"
  ])
  assert.equal(auth.currentUser, null)
  await assert.rejects(signInWithEmailAndPassword(auth, email, password), (error) =>
    ["auth/user-not-found", "auth/invalid-credential"].includes(error.code)
  )
})

test("senha incorreta impede iniciar a limpeza e mantém a conta fictícia", async () => {
  const email = "senha-incorreta-fixture@example.invalid"
  const { user } = await createUserWithEmailAndPassword(auth, email, password)
  const events = []
  await assert.rejects(
    deleteAccountInOrder(steps(user, email, "senha-ficticia-incorreta", events)),
    (error) => ["auth/wrong-password", "auth/invalid-credential"].includes(error.code)
  )
  assert.deepEqual(events, [])
  assert.equal(auth.currentUser.uid, user.uid)
  assert.equal((await signInWithEmailAndPassword(auth, email, password)).user.uid, user.uid)
})

test("falha simulada nos dados preserva Authentication após reautenticar", async () => {
  const email = "falha-parcial-fixture@example.invalid"
  const { user } = await createUserWithEmailAndPassword(auth, email, password)
  const events = []
  await assert.rejects(
    deleteAccountInOrder({
      ...steps(user, email, password, events),
      removeWords: async () => {
        throw new Error("falha fictícia no banco")
      }
    }),
    { code: "account/deletion-incomplete" }
  )
  assert.deepEqual(events, ["reauthenticate", "begin", "matches", "finish:false"])
  assert.equal(auth.currentUser.uid, user.uid)
})
