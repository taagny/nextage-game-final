import { Timestamp } from "firebase-admin/firestore"
import { encodeValue, decodeValue, inspectBackup } from "./firestore-backup.mjs"
import { buildPrivateDocument, buildPublicProfile } from "./migration-v2.mjs"

function fail(code) {
  throw Object.assign(new Error(code), { code })
}
function sorted(value) {
  if (value[0] === "map")
    return [
      "map",
      [...value[1]]
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .map(([key, item]) => [key, sorted(item)])
    ]
  if (value[0] === "array") return ["array", value[1].map(sorted)]
  return value
}
const equal = (a, b) => JSON.stringify(sorted(a)) === JSON.stringify(sorted(b))

// Match the SDK's integer serialization when predicting an upcoming set().
function asWrite(value) {
  if (value[0] === "number") {
    const number = Number(value[1])
    if (Number.isSafeInteger(number) && !Object.is(number, -0)) return ["integer", String(number)]
  }
  if (value[0] === "map") return ["map", value[1].map(([key, item]) => [key, asWrite(item)])]
  if (value[0] === "array") return ["array", value[1].map(asWrite)]
  return value
}
function numbers(value) {
  if (typeof value === "bigint") {
    if (value > BigInt(Number.MAX_SAFE_INTEGER) || value < BigInt(Number.MIN_SAFE_INTEGER))
      fail("UNSAFE_INTEGER")
    return Number(value)
  }
  if (Array.isArray(value)) return value.map(numbers)
  if (value && Object.getPrototypeOf(value) === Object.prototype)
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, numbers(item)]))
  return value
}

export async function planMigrationRollback(db, backup, authDates) {
  inspectBackup(backup, db)
  if (backup.payload.scope !== "migration-documents-only") fail("LIMITED_BACKUP_REQUIRED")
  if (
    authDates.project !== backup.payload.projectId ||
    authDates.sourceBackupSHA256 !== backup.sha256
  )
    fail("AUTH_DATES_MISMATCH")
  const original = new Map(backup.payload.documents.map((row) => [row.path, row.fields]))
  const players = backup.payload.documents.filter((row) => row.path.startsWith("jogadores/"))
  const paths = new Set(original.keys())
  for (const row of players) paths.add("perfisPublicos/" + row.path.split("/")[1])
  const snapshots = new Map(),
    allPaths = [...paths]
  for (let i = 0; i < allPaths.length; i += 100) {
    for (const doc of await db.getAll(...allPaths.slice(i, i + 100).map((p) => db.doc(p))))
      snapshots.set(doc.ref.path, doc)
  }
  const operations = []
  for (const row of players) {
    const uid = row.path.split("/")[1],
      current = snapshots.get(row.path)
    if (!current?.exists) fail("PLAYER_MISSING")
    const stored = encodeValue(current.data(), db),
      old = decodeValue(row.fields, db)
    if (!equal(stored, row.fields)) {
      // Refuse source types which cannot be written back without a type change.
      if (!equal(asWrite(encodeValue(old, db)), row.fields)) fail("LOSSLESS_RESTORE_UNSUPPORTED")
      const metadataDate = authDates.entries[uid],
        creation =
          old.createdAt ?? (metadataDate ? Timestamp.fromDate(new Date(metadataDate)) : null)
      if (!creation) fail("AUTH_CREATION_DATE_MISSING")
      const now = current.data().stats?.countersFixedAt
      if (!(now instanceof Timestamp)) fail("UNEXPECTED_PLAYER_STATE")
      const expected = buildPrivateDocument(numbers(old), { now, createdAt: creation })
      if (!equal(asWrite(encodeValue(expected, db)), stored)) fail("UNEXPECTED_PLAYER_STATE")
      operations.push({
        kind: "restore-player",
        path: row.path,
        fields: row.fields,
        updateTime: current.updateTime
      })
    }
    const publicPath = "perfisPublicos/" + uid,
      profile = snapshots.get(publicPath)
    if (!original.has(publicPath) && profile?.exists) {
      const expected = buildPublicProfile(numbers(old), profile.data().updatedAt)
      if (
        !(profile.data().updatedAt instanceof Timestamp) ||
        !equal(asWrite(encodeValue(expected, db)), encodeValue(profile.data(), db))
      )
        fail("UNEXPECTED_PUBLIC_PROFILE")
      operations.push({
        kind: "remove-created-profile",
        path: publicPath,
        updateTime: profile.updateTime
      })
    }
  }
  // Profiles present before the migration must stay exactly unchanged.
  for (const [p, fields] of original)
    if (p.startsWith("perfisPublicos/")) {
      const current = snapshots.get(p)
      if (!current?.exists || !equal(encodeValue(current.data(), db), fields))
        fail("EXISTING_PUBLIC_PROFILE_CHANGED")
    }
  return {
    targetProjectId: db.projectId,
    sourceBackupSHA256: backup.sha256,
    operations,
    summary: {
      restorePlayers: operations.filter((x) => x.kind === "restore-player").length,
      removeCreatedProfiles: operations.filter((x) => x.kind === "remove-created-profile").length,
      historyWrites: 0
    }
  }
}

export async function applyMigrationRollback(db, plan, onProgress = () => {}) {
  if (db.projectId !== plan.targetProjectId) fail("ROLLBACK_TARGET_MISMATCH")
  // Validate all paths before the first write; never accept history operations.
  for (const op of plan.operations) {
    const collection =
      op.kind === "restore-player"
        ? "jogadores"
        : op.kind === "remove-created-profile"
          ? "perfisPublicos"
          : null
    if (!collection || op.path.split("/").length !== 2 || !op.path.startsWith(collection + "/"))
      fail("ROLLBACK_SCOPE_INVALID")
  }
  let completed = 0
  for (let i = 0; i < plan.operations.length; i += 8) {
    const chunk = plan.operations.slice(i, i + 8)
    await db.runTransaction(async (tx) => {
      const current = await tx.getAll(...chunk.map((op) => db.doc(op.path)))
      for (let j = 0; j < chunk.length; j++) {
        if (!current[j].exists || !current[j].updateTime?.isEqual(chunk[j].updateTime))
          fail("ROLLBACK_CONCURRENT_CHANGE")
      }
      for (const op of chunk) {
        if (op.kind === "restore-player") tx.set(db.doc(op.path), decodeValue(op.fields, db))
        else tx.delete(db.doc(op.path))
      }
    })
    completed += chunk.length
    onProgress({ completed, total: plan.operations.length })
  }
  return { ...plan.summary, completed }
}
