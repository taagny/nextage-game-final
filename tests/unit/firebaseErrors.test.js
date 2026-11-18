import { test } from "node:test"
import assert from "node:assert/strict"
import {
  authErrorMessage,
  rankingErrorMessage,
  firebaseErrorCode
} from "../../src/utils/firebaseErrors.js"

test("login distingue credenciais, rede, domínio e configuração sem expor resposta bruta", () => {
  assert.equal(
    authErrorMessage({ code: "auth/invalid-credential" }),
    authErrorMessage({ code: "auth/user-not-found" })
  )
  assert.match(authErrorMessage({ code: "auth/network-request-failed" }), /conexão/)
  assert.match(authErrorMessage({ code: "auth/unauthorized-domain" }), /endereço/)
  assert.match(authErrorMessage({ code: "auth/invalid-api-key" }), /ambiente/)
  assert.match(authErrorMessage({ code: "auth/internal-error" }), /ambiente/)
  assert.equal(
    authErrorMessage({
      code: "auth/internal-error",
      message: "token-ficticio-nao-exibir"
    }).includes("token-ficticio-nao-exibir"),
    false
  )
})
test("ranking distingue indisponibilidade e conexão; diagnóstico contém somente código reconhecível", () => {
  assert.match(rankingErrorMessage({ code: "permission-denied" }), /ambiente/)
  assert.match(rankingErrorMessage({ code: "unavailable" }), /conexão/)
  assert.equal(firebaseErrorCode({ code: "permission-denied" }), "permission-denied")
  assert.equal(firebaseErrorCode({ code: "auth/internal-error" }), "auth/internal-error")
  assert.equal(firebaseErrorCode({ code: "valor com dados pessoais" }), "unknown")
  assert.equal(firebaseErrorCode(null), "unknown")
})
