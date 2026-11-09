import { test } from "node:test"
import assert from "node:assert/strict"
import { resolveFirebaseConfig } from "../../src/utils/firebaseConfig.js"

const fallback = { apiKey: "fixture-original", projectId: "fixture-original", storageBucket: "original.invalid" }
test("configuração vazia mantém o projeto original sem alterar o objeto de entrada", () => {
  assert.deepEqual(resolveFirebaseConfig({}, fallback), fallback)
  assert.notEqual(resolveFirebaseConfig({}, fallback), fallback)
})
test("preview completo substitui o projeto sem herdar bucket ou remetente da produção", () => {
  const config = resolveFirebaseConfig({ VITE_FIREBASE_API_KEY: " fixture-preview ",
    VITE_FIREBASE_AUTH_DOMAIN: "preview.invalid", VITE_FIREBASE_PROJECT_ID: "preview-fixture",
    VITE_FIREBASE_APP_ID: "fixture-app" }, fallback)
  assert.deepEqual(config, { apiKey: "fixture-preview", authDomain: "preview.invalid", projectId: "preview-fixture", appId: "fixture-app" })
})
test("configuração parcial é recusada sem expor valores nos erros", () => {
  assert.throws(() => resolveFirebaseConfig({ VITE_FIREBASE_API_KEY: "valor-ficticio-nao-exibir" }, fallback), error =>
    error.message.includes("VITE_FIREBASE_PROJECT_ID") && !error.message.includes("valor-ficticio-nao-exibir"))
  assert.throws(() => resolveFirebaseConfig({ VITE_FIREBASE_STORAGE_BUCKET: "fixture.invalid" }, fallback))
})
