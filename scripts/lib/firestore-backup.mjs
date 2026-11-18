import { createHash } from "node:crypto"
import { Buffer } from "node:buffer"
import { Timestamp, GeoPoint, DocumentReference, FieldValue } from "firebase-admin/firestore"

const Vector = FieldValue.vector([]).constructor
const MIGRATION_COLLECTIONS = ["jogadores", "perfisPublicos"]
const sha = (value) => createHash("sha256").update(JSON.stringify(value)).digest("hex")
const validPath = (value) =>
  typeof value === "string" &&
  value.split("/").length % 2 === 0 &&
  value.split("/").every((part) => part && part !== "." && part !== "..")

// Every value has an explicit tag, so user maps cannot collide with type markers.
export function encodeValue(value, db) {
  if (value === null) return ["null"]
  if (typeof value === "string" || typeof value === "boolean") return [typeof value, value]
  if (typeof value === "number") return ["number", Object.is(value, -0) ? "-0" : String(value)]
  if (typeof value === "bigint") return ["integer", value.toString()]
  if (value instanceof Timestamp) return ["timestamp", value.seconds, value.nanoseconds]
  if (value instanceof GeoPoint) return ["geopoint", value.latitude, value.longitude]
  if (Buffer.isBuffer(value)) return ["bytes", value.toString("base64")]
  if (value instanceof DocumentReference) {
    if (value.firestore !== db)
      throw new Error("Referência de outro banco: backup interrompido, sem conversão silenciosa.")
    return ["reference", value.path]
  }
  if (value instanceof Vector) return ["vector", value.toArray()]
  if (Array.isArray(value)) return ["array", value.map((item) => encodeValue(item, db))]
  if (
    value &&
    (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null)
  ) {
    return ["map", Object.entries(value).map(([key, item]) => [key, encodeValue(item, db)])]
  }
  throw new Error("Tipo não suportado: backup interrompido, sem omitir campos.")
}

export function decodeValue(encoded, db) {
  if (!Array.isArray(encoded)) throw new Error("Valor de backup inválido.")
  const [type, a, b] = encoded
  switch (type) {
    case "null":
      return null
    case "string":
    case "boolean":
      return a
    case "number":
      return Number(a)
    case "integer":
      return BigInt(a)
    case "timestamp":
      return new Timestamp(a, b)
    case "geopoint":
      return new GeoPoint(a, b)
    case "bytes":
      return Buffer.from(a, "base64")
    case "reference":
      if (validPath(a)) return db.doc(a)
      break
    case "vector":
      return FieldValue.vector(a)
    case "array":
      return a.map((item) => decodeValue(item, db))
    case "map":
      return Object.fromEntries(a.map(([key, item]) => [key, decodeValue(item, db)]))
  }
  throw new Error("Tipo de backup inválido.")
}

export async function captureFirestore(db, projectId, { migrationDocumentsOnly = false } = {}) {
  const documents = []
  let missingParents = 0
  async function visit(collection) {
    // listDocuments includes missing parents which still have subcollections.
    const refs = await collection.listDocuments()
    for (let offset = 0; offset < refs.length; offset += 100) {
      const page = refs.slice(offset, offset + 100)
      const snapshots = await db.getAll(...page)
      for (const snapshot of snapshots) {
        if (snapshot.exists)
          documents.push({ path: snapshot.ref.path, fields: encodeValue(snapshot.data(), db) })
        else missingParents++
        if (!migrationDocumentsOnly) {
          for (const child of await snapshot.ref.listCollections()) await visit(child)
        }
      }
    }
  }
  const collections = migrationDocumentsOnly
    ? MIGRATION_COLLECTIONS.map((name) => db.collection(name))
    : await db.listCollections()
  for (const collection of collections) await visit(collection)
  documents.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0))
  const payload = {
    format: "nextage-firestore-logical-backup",
    version: 1,
    projectId,
    databaseId: "(default)",
    capturedAt: new Date().toISOString(),
    consistentSnapshot: false,
    scope: migrationDocumentsOnly ? "migration-documents-only" : "all-documents",
    documents,
    missingParents
  }
  return { payload, sha256: sha(payload) }
}

export function inspectBackup(backup, db) {
  const p = backup?.payload
  if (
    p?.format !== "nextage-firestore-logical-backup" ||
    p.version !== 1 ||
    p.databaseId !== "(default)" ||
    !Array.isArray(p.documents) ||
    sha(p) !== backup.sha256
  ) {
    throw new Error("Backup incompleto, alterado ou de formato desconhecido.")
  }
  const paths = new Set()
  if (p.scope !== undefined && !["all-documents", "migration-documents-only"].includes(p.scope))
    throw new Error("Escopo de backup desconhecido.")
  for (const row of p.documents) {
    if (!validPath(row.path) || paths.has(row.path) || row.fields?.[0] !== "map")
      throw new Error("Documento de backup inválido ou duplicado.")
    if (
      p.scope === "migration-documents-only" &&
      (row.path.split("/").length !== 2 || !MIGRATION_COLLECTIONS.includes(row.path.split("/")[0]))
    ) {
      throw new Error("Documento fora do escopo declarado da cópia de migração.")
    }
    paths.add(row.path)
    decodeValue(row.fields, db)
  }
  return {
    projectId: p.projectId,
    documents: paths.size,
    sha256: backup.sha256,
    scope: p.scope ?? "all-documents"
  }
}

// Safe rehearsal only. There is intentionally no production-write option here.
export async function restoreBackupToEmulator(backup, db, projectId, emulatorHost) {
  if (
    !/^demo-[a-z0-9-]+$/.test(projectId) ||
    !/^127\.0\.0\.1:\d+$/.test(emulatorHost ?? "") ||
    db.projectId !== projectId
  ) {
    throw new Error("Restauração permitida somente em projeto demo e emulador local.")
  }
  const summary = inspectBackup(backup, db)
  // Refuse to overwrite even one existing document. Check before creating any.
  for (const row of backup.payload.documents) {
    if ((await db.doc(row.path).get()).exists)
      throw new Error("O destino do ensaio já contém documentos do backup.")
  }
  for (const row of backup.payload.documents)
    await db.doc(row.path).create(decodeValue(row.fields, db))
  for (const row of backup.payload.documents) {
    const restored = await db.doc(row.path).get()
    if (
      !restored.exists ||
      JSON.stringify(encodeValue(restored.data(), db)) !== JSON.stringify(row.fields)
    ) {
      // Firestore may reorder maps; compare canonical key ordering recursively below.
      if (!restored.exists || canonical(encodeValue(restored.data(), db)) !== canonical(row.fields))
        throw new Error("A conferência de restauração encontrou divergência.")
    }
  }
  return summary
}

function canonical(value) {
  if (!Array.isArray(value)) return JSON.stringify(value)
  if (value[0] === "map")
    return JSON.stringify([
      "map",
      [...value[1]]
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .map(([k, v]) => [k, canonical(v)])
    ])
  return JSON.stringify(value.map(canonical))
}
