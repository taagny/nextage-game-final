import test from "node:test"
import assert from "node:assert/strict"
import { createHmac, createHash } from "node:crypto"
import { Buffer } from "node:buffer"
import {
  createResearchKeyFile,
  openResearchKeyFile,
  pseudonymizeUid
} from "../../src/utils/pseudonym.js"

const fixture = (secret) => JSON.stringify({ format: "nextage-research-key", version: 1, secret })
const secretA = "01".repeat(32),
  secretB = "02".repeat(32)

test("HMAC-SHA-256 usa chave de 256 bits e domínio explícito, conferido por implementação independente", async () => {
  const key = await openResearchKeyFile(fixture(secretA))
  const expected = createHmac("sha256", Buffer.from(secretA, "hex"))
    .update("NEXTAGE:research:v1:abc")
    .digest("hex")
  assert.equal(await pseudonymizeUid("abc", key), `P_${expected}`)
  assert.equal(key.cryptoKey.extractable, false)
  await assert.rejects(crypto.subtle.exportKey("raw", key.cryptoKey))
})

test("reabrir a mesma chave preserva códigos; outra chave altera códigos e identificador", async () => {
  const a = await openResearchKeyFile(fixture(secretA)),
    again = await openResearchKeyFile(fixture(secretA)),
    b = await openResearchKeyFile(fixture(secretB))
  assert.equal(
    await pseudonymizeUid("participante", a),
    await pseudonymizeUid("participante", again)
  )
  assert.notEqual(
    await pseudonymizeUid("participante", a),
    await pseudonymizeUid("participante", b)
  )
  assert.equal(a.id, again.id)
  assert.notEqual(a.id, b.id)
  assert.match(await pseudonymizeUid("participante", a), /^P_[a-f0-9]{64}$/)
})

test("candidatos públicos e chave incorreta não reproduzem os três pseudônimos da amostra", async () => {
  const key = await openResearchKeyFile(fixture(secretA)),
    wrong = await openResearchKeyFile(fixture(secretB))
  const uids = ["ficticio-a", "ficticio-b", "ficticio-c"]
  const codes = new Set(await Promise.all(uids.map((uid) => pseudonymizeUid(uid, key))))
  const publicHashes = uids.map((uid) => `P_${createHash("sha256").update(uid).digest("hex")}`)
  assert.equal(publicHashes.filter((code) => codes.has(code)).length, 0)
  assert.equal(
    (await Promise.all(uids.map((uid) => pseudonymizeUid(uid, wrong)))).filter((code) =>
      codes.has(code)
    ).length,
    0
  )
  await assert.rejects(pseudonymizeUid(uids[0]), /chave/)
})

test("formato de chave é estrito e não aceita arquivo incompleto, curto ou com campos extras", async () => {
  for (const text of [
    "",
    "{}",
    "null",
    "[]",
    "x".repeat(5000),
    fixture("01"),
    JSON.stringify({ format: "nextage-research-key", version: 1, secret: secretA, extra: true })
  ]) {
    await assert.rejects(openResearchKeyFile(text))
  }
  const generated = createResearchKeyFile()
  assert.match(generated.secret, /^[a-f0-9]{64}$/)
  assert.notEqual(createResearchKeyFile().secret, generated.secret)
  const key = await openResearchKeyFile(JSON.stringify(generated))
  for (const uid of [undefined, null, "", 123])
    await assert.rejects(pseudonymizeUid(uid, key), TypeError)
  assert.equal(JSON.stringify(key).includes(generated.secret), false)
})
