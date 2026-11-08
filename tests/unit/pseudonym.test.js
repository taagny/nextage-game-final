import test from "node:test"
import assert from "node:assert/strict"
import { pseudonymizeUid } from "../../src/utils/pseudonym.js"

test("código usa prefixo fixo e os oito primeiros caracteres do SHA-256", async () => {
  assert.equal(await pseudonymizeUid("abc"), "P_ba7816bf")
})

test("código é estável e diferencia os participantes de teste", async () => {
  const first = await pseudonymizeUid("participante-a")
  assert.equal(await pseudonymizeUid("participante-a"), first)
  assert.notEqual(await pseudonymizeUid("participante-b"), first)
  assert.match(first, /^P_[a-f0-9]{8}$/)
})

test("não gera código para UID ausente ou inválido", async () => {
  for (const uid of [undefined, null, "", 123]) {
    await assert.rejects(pseudonymizeUid(uid), TypeError)
  }
})
