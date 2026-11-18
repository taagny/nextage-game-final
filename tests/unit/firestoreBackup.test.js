import test from "node:test"
import assert from "node:assert/strict"
import { Buffer } from "node:buffer"
import { createHash } from "node:crypto"
import { initializeApp, deleteApp } from "firebase-admin/app"
import { getFirestore, Timestamp, GeoPoint, FieldValue } from "firebase-admin/firestore"
import { encodeValue, decodeValue, captureFirestore, inspectBackup, restoreBackupToEmulator } from "../../scripts/lib/firestore-backup.mjs"

test("codec preserva tipos Firestore, precisão, mapas com nomes reservados e referências", async () => {
  const app = initializeApp({ projectId: "demo-backup-codec" }, "backup-codec")
  try {
    const db = getFirestore(app)
    const input = { text: "ação", null: null, flag: false,
      numbers: [0, -0, NaN, Infinity, -Infinity, 1.25], integer: 9223372036854775807n,
      time: new Timestamp(1700000000, 123456789), geo: new GeoPoint(-21.45, -43.55),
      bytes: Buffer.from([0, 255, 13]), ref: db.doc("jogadores/ficticio"),
      vector: FieldValue.vector([1.25, 2.5]), map: Object.fromEntries([["__proto__", "literal"], ["timestamp", ["map", "normal"]]]) }
    const encoded = JSON.parse(JSON.stringify(encodeValue(input, db)))
    const actual = decodeValue(encoded, db)
    assert.deepEqual(actual.numbers, input.numbers)
    assert.equal(actual.integer, input.integer)
    assert.ok(actual.time.isEqual(input.time))
    assert.ok(actual.geo.isEqual(input.geo))
    assert.deepEqual(actual.bytes, input.bytes)
    assert.ok(actual.ref.isEqual(input.ref))
    assert.deepEqual(actual.vector.toArray(), input.vector.toArray())
    assert.equal(Object.getPrototypeOf(actual.map), Object.prototype)
    assert.equal(Object.getOwnPropertyDescriptor(actual.map, "__proto__").value, "literal")
    assert.deepEqual(encodeValue(actual, db), encoded)
    assert.throws(() => encodeValue({ unsupported: new Date() }, db), /Tipo não suportado/)
    assert.throws(() => decodeValue(["unknown"], db), /inválido/)
  } finally { await deleteApp(app) }
})

test("captura inclui subcoleção de pai ausente sem fabricar o pai e não grava no banco", async () => {
  const child = { path: "jogadores/ausente/partidas/ficticia", listCollections: async () => [] }
  const parent = { path: "jogadores/ausente", listCollections: async () => [{ listDocuments: async () => [child] }] }
  const db = { listCollections: async () => [{ listDocuments: async () => [parent] }],
    getAll: async (...refs) => refs.map(ref => ({ ref, exists: ref === child, data: () => ({ word: "CASAS" }) })) }
  const backup = await captureFirestore(db, "demo-backup-capture")
  assert.equal(backup.payload.missingParents, 1)
  assert.equal(backup.payload.consistentSnapshot, false)
  assert.deepEqual(backup.payload.documents.map(row => row.path), [child.path])
  assert.equal(inspectBackup(backup, db).documents, 1)
  const damaged = structuredClone(backup)
  damaged.payload.documents[0].fields[1][0][1][1] = "ALTERADO"
  assert.throws(() => inspectBackup(damaged, db), /alterado/)
  const duplicate = structuredClone(backup)
  duplicate.payload.documents.push(duplicate.payload.documents[0])
  duplicate.sha256 = createHash("sha256").update(JSON.stringify(duplicate.payload)).digest("hex")
  assert.throws(() => inspectBackup(duplicate, db), /duplicado/)
})

test("restauração recusa produção, host remoto e destino com documentos existentes", async () => {
  const backup = await captureFirestore({ listCollections: async () => [] }, "nextage-d6d48")
  const noAccess = { get projectId() { throw Error("O banco não deve ser acessado") } }
  await assert.rejects(restoreBackupToEmulator(backup, noAccess, "nextage-d6d48", "127.0.0.1:8085"), /somente/)
  await assert.rejects(restoreBackupToEmulator(backup, noAccess, "demo-rehearsal", "remote:8085"), /somente/)
  const source = { listCollections: async () => [{ listDocuments: async () => [{ path: "a/b", listCollections: async () => [] }] }],
    getAll: async ref => [{ ref, exists: true, data: () => ({ active: true }) }] }
  const populated = await captureFirestore(source, "nextage-d6d48")
  await assert.rejects(restoreBackupToEmulator(populated, { projectId: "demo-rehearsal",
    doc: () => ({ get: async () => ({ exists: true }), create: () => { throw Error("Não sobrescrever") } })
  }, "demo-rehearsal", "127.0.0.1:8085"), /já contém/)
})

test("escopo de migração copia somente documentos principais e nunca lê as partidas", async () => {
  const requested = []
  const forbidden = () => { throw Error("O histórico não deve ser consultado") }
  const db = { listCollections: forbidden,
    collection: name => { requested.push(name); return { listDocuments: async () => [{ path: name + "/ficticio", listCollections: forbidden }] } },
    getAll: async (...refs) => refs.map(ref => ({ ref, exists: true, data: () => ({ value: "original" }) })) }
  const backup = await captureFirestore(db, "demo-backup-scoped", { migrationDocumentsOnly: true })
  assert.deepEqual(requested, ["jogadores", "perfisPublicos"])
  assert.equal(backup.payload.scope, "migration-documents-only")
  assert.equal(inspectBackup(backup, db).scope, "migration-documents-only")
  assert.equal(backup.payload.documents.length, 2)
  backup.payload.documents[0].path = "jogadores/ficticio/partidas/segredo"
  backup.sha256 = createHash("sha256").update(JSON.stringify(backup.payload)).digest("hex")
  assert.throws(() => inspectBackup(backup, db), /fora do escopo/)
})
