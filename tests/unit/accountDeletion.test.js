import test from "node:test"
import assert from "node:assert/strict"
import {
  deleteAccountInOrder,
  deleteInBatches,
  reauthenticationMethod
} from "../../src/utils/accountDeletion.js"

function steps(events) {
  return Object.fromEntries(
    ["reauthenticate", "begin", "removeMatches", "removeWords", "removeProfiles", "removeAuth"]
      .map((name) => [
        name,
        async () => {
          events.push(name)
        }
      ])
      .concat([
        [
          "finish",
          (complete) => {
            events.push(`finish:${complete}`)
          }
        ]
      ])
  )
}

test("exclusão reautentica primeiro e só apaga Authentication depois dos dados", async () => {
  const events = []
  await deleteAccountInOrder(steps(events))
  assert.deepEqual(events, [
    "reauthenticate",
    "begin",
    "removeMatches",
    "removeWords",
    "removeProfiles",
    "removeAuth",
    "finish:true"
  ])
})

test("falha na reautenticação não começa a exclusão", async () => {
  const events = []
  const failure = new Error("credencial recusada")
  await assert.rejects(
    deleteAccountInOrder({
      ...steps(events),
      reauthenticate: async () => {
        throw failure
      }
    }),
    (error) => error === failure
  )
  assert.deepEqual(events, [])
})

test("falha ao apagar palavras não apaga perfis nem Authentication e preserva a causa", async () => {
  const events = []
  const failure = new Error("conexão interrompida")
  await assert.rejects(
    deleteAccountInOrder({
      ...steps(events),
      removeWords: async () => {
        throw failure
      }
    }),
    (error) => {
      assert.equal(error.code, "account/deletion-incomplete")
      assert.equal(error.cause, failure)
      return true
    }
  )
  assert.deepEqual(events, ["reauthenticate", "begin", "removeMatches", "finish:false"])
})

test("falha no Authentication depois da limpeza também é sinalizada como parcial", async () => {
  const events = []
  await assert.rejects(
    deleteAccountInOrder({
      ...steps(events),
      removeAuth: async () => {
        throw new Error("falha final")
      }
    }),
    { code: "account/deletion-incomplete" }
  )
  assert.equal(events.at(-1), "finish:false")
  assert.ok(events.includes("removeProfiles"))
})

test("exclusão usa lotes de no máximo 400 e continua até esvaziar a coleção", async () => {
  const documents = Array.from({ length: 805 }, (_, index) => index)
  const sizes = []
  await deleteInBatches(
    async (size) => documents.slice(0, size),
    async (batch) => {
      sizes.push(batch.length)
      documents.splice(0, batch.length)
    }
  )
  assert.deepEqual(sizes, [400, 400, 5])
  assert.equal(documents.length, 0)
  await assert.rejects(
    deleteInBatches(
      async () => Array(401).fill(0),
      async () => assert.fail("lote inválido não deve ser enviado")
    ),
    /400/
  )
})

test("reauth usa Google ou senha conforme os provedores da conta", () => {
  const user = (ids) => ({ providerData: ids.map((providerId) => ({ providerId })) })
  assert.equal(reauthenticationMethod(user(["google.com"])), "google")
  assert.equal(reauthenticationMethod(user(["password"])), "password")
  assert.equal(reauthenticationMethod(user(["password", "google.com"])), "google")
  assert.equal(reauthenticationMethod(user([])), null)
})
