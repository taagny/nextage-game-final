import test from "node:test"
import assert from "node:assert/strict"
import {
  beginAccountDeletion,
  finishAccountDeletion,
  withPlayerWrite
} from "../../src/services/accountLifecycle.js"

test("exclusão bloqueia novas gravações e espera as que já estavam em andamento", async () => {
  const uid = "lifecycle-fixture-a"
  let release
  const gate = new Promise((resolve) => {
    release = resolve
  })
  const write = withPlayerWrite(uid, () => gate)
  const deletion = beginAccountDeletion(uid)
  let drained = false
  deletion.then(() => {
    drained = true
  })
  await Promise.resolve()
  assert.equal(drained, false)
  await assert.rejects(
    withPlayerWrite(uid, async () => assert.fail("não deveria gravar")),
    { code: "account/deleting" }
  )
  release()
  await write
  await deletion
  finishAccountDeletion(uid, true)
  assert.equal(await withPlayerWrite(uid, async () => "liberado"), "liberado")
})

test("falha parcial mantém o bloqueio, mas permite tentar concluir a exclusão", async () => {
  const uid = "lifecycle-fixture-b"
  await beginAccountDeletion(uid)
  finishAccountDeletion(uid, false)
  await assert.rejects(
    withPlayerWrite(uid, async () => "não gravar"),
    { code: "account/deleting" }
  )
  await beginAccountDeletion(uid)
  await assert.rejects(beginAccountDeletion(uid), { code: "account/deleting" })
  finishAccountDeletion(uid, true)
})
