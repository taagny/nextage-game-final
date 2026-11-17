import test from "node:test"
import assert from "node:assert/strict"
import process from "node:process"
import { Buffer } from "node:buffer"
import { initializeApp, deleteApp } from "firebase-admin/app"
import { getFirestore, Timestamp, GeoPoint, FieldValue } from "firebase-admin/firestore"
import { captureFirestore, inspectBackup, restoreBackupToEmulator } from "../../scripts/lib/firestore-backup.mjs"

test("backup restaura documentos e subcoleções fictícias com tipos preservados no emulador", async () => {
  const host = process.env.FIRESTORE_EMULATOR_HOST
  assert.match(host ?? "", /^127\.0\.0\.1:\d+$/)
  const projectId = "demo-nextage-v2"
  const app = initializeApp({ projectId }, "backup-rehearsal")
  const db = getFirestore(app); db.settings({ useBigInt: true })
  const roots = ["backupFixture", "backupOrphans"]
  try {
    const record = db.doc("backupFixture/jogador")
    await record.create({ name: "Jogador fictício", consent: false, timestamp: new Timestamp(1700000000, 123456789),
      bytes: Buffer.from([0, 255]), location: new GeoPoint(-21.45, -43.55),
      ref: db.doc("backupOrphans/ausente/filhos/item"), integers: [9223372036854775807n, -9223372036854775808n],
      numbers: [NaN, Infinity, -Infinity, 1.25], vector: FieldValue.vector([1.25, 2.5]),
      nested: { "campo.com.ponto": [true, null, "ação"] } })
    await record.collection("partidas").doc("resultado").create({ word: "CASAS", attempts: 4 })
    await record.collection("partidas").doc("resultado").collection("detalhes").doc("um").create({ active: true })
    await db.doc("backupOrphans/ausente/filhos/item").create({ preserved: true })
    // Firestore stores microsecond precision: preserve the value read from the
    // database, rather than nanoseconds already rounded during the first write.
    const storedTime = (await record.get()).data().timestamp
    const backup = JSON.parse(JSON.stringify(await captureFirestore(db, projectId)))
    assert.equal(inspectBackup(backup, db).documents, 4)
    assert.equal(backup.payload.missingParents, 1)
    for (const root of roots) await db.recursiveDelete(db.collection(root))
    const summary = await restoreBackupToEmulator(backup, db, projectId, host)
    assert.equal(summary.documents, 4)
    assert.equal((await db.doc("backupOrphans/ausente").get()).exists, false)
    assert.equal((await db.doc("backupOrphans/ausente/filhos/item").get()).data().preserved, true)
    const restored = (await record.get()).data()
    assert.ok(restored.timestamp.isEqual(storedTime))
    assert.equal(restored.integers[0], 9223372036854775807n)
    assert.ok(restored.ref.isEqual(db.doc("backupOrphans/ausente/filhos/item")))
    assert.deepEqual(restored.vector.toArray(), [1.25, 2.5])
    await assert.rejects(restoreBackupToEmulator(backup, db, projectId, host), /já contém/)
  } finally {
    for (const root of roots) await db.recursiveDelete(db.collection(root))
    await deleteApp(app)
  }
})
