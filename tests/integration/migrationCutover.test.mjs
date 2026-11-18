import test from "node:test"
import assert from "node:assert/strict"
import process from "node:process"
import { readFile, writeFile, mkdir } from "node:fs/promises"
import { spawnSync } from "node:child_process"
import { initializeApp, deleteApp } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"
import { getFirestore, Timestamp } from "firebase-admin/firestore"
import { initializeTestEnvironment, assertFails } from "@firebase/rules-unit-testing"
import { doc, collection, getDoc, getDocs, setDoc, updateDoc, deleteDoc } from "firebase/firestore"
import { captureFirestore } from "../../scripts/lib/firestore-backup.mjs"
import {
  planMigrationRollback,
  applyMigrationRollback
} from "../../scripts/lib/migration-rollback.mjs"
import { buildPublicProfile } from "../../scripts/lib/migration-v2.mjs"

test(
  "manutenção bloqueia clientes; CLI migra e recuperação preserva histórico e perfis anteriores",
  { timeout: 120000 },
  async () => {
    const projectId = "demo-nextage-v2",
      host = process.env.FIRESTORE_EMULATOR_HOST
    assert.match(host ?? "", /^127\.0\.0\.1:\d+$/)
    assert.match(process.env.FIREBASE_AUTH_EMULATOR_HOST ?? "", /^127\.0\.0\.1:\d+$/)
    assert.equal(process.env.GOOGLE_APPLICATION_CREDENTIALS, undefined)
    const app = initializeApp({ projectId }, "cutover-test"),
      db = getFirestore(app),
      auth = getAuth(app)
    db.settings({ useBigInt: true })
    const ids = ["cutover-alice", "cutover-beto"],
      created = "2024-01-01T00:00:00.000Z"
    const rules = await readFile("firestore.maintenance.rules", "utf8")
    const environment = await initializeTestEnvironment({
      projectId,
      firestore: { host: "127.0.0.1", port: Number(host.split(":")[1]), rules }
    })
    function command(...args) {
      const env = { ...process.env }
      delete env.GOOGLE_APPLICATION_CREDENTIALS
      delete env.DEBUG
      const r = spawnSync(
        process.execPath,
        ["--import", "./tests/integration/register-admin-emulator.mjs", ...args],
        { encoding: "utf8", windowsHide: true, timeout: 45000, env }
      )
      assert.equal(r.status, 0, (r.stdout || "") + (r.stderr || ""))
      return r.stdout
    }
    try {
      const imported = await auth.importUsers(
        ids.map((uid) => ({ uid, metadata: { creationTime: created } }))
      )
      assert.equal(imported.failureCount, 0)
      const legacy = {
        nome: "Pessoa Ficticia",
        email: "ficticio@example.invalid",
        sequenciaAtual: 2,
        tentativas: 1,
        runnerScores: { 10: 2, 30: 3, 60: 4 },
        termsAccepted: true,
        stats: {
          totalGames: 2,
          totalWins: 2,
          totalTimeMs: 4000,
          totalAttempts: 6,
          avgTimePerWord: 2000,
          avgAttemptsPerWord: 3,
          profile: "iniciante"
        }
      }
      for (const uid of ids) await db.doc("jogadores/" + uid).set(legacy)
      const existing = {
        ...buildPublicProfile(legacy, Timestamp.fromMillis(1000)),
        apelido: "BetoManual"
      }
      await db.doc("perfisPublicos/" + ids[1]).set(existing)
      const history = db.doc("jogadores/" + ids[0] + "/partidas/protected")
      await history.set({ word: "CASAS", timeMs: 5000 })
      const historyBefore = (await history.get()).data()
      const backup = await captureFirestore(db, projectId, { migrationDocumentsOnly: true })
      const dates = {
        project: projectId,
        sourceBackupSHA256: backup.sha256,
        entries: Object.fromEntries(ids.map((uid) => [uid, created]))
      }
      let denied = 0
      for (const actor of [
        environment.unauthenticatedContext(),
        environment.authenticatedContext(ids[0]),
        environment.authenticatedContext("test-admin", { admin: true })
      ]) {
        const client = actor.firestore(),
          ref = doc(client, "jogadores", ids[0])
        for (const operation of [
          () => getDoc(ref),
          () => getDocs(collection(client, "jogadores")),
          () => getDoc(doc(client, "perfisPublicos", ids[1])),
          () => getDoc(doc(client, history.path)),
          () => setDoc(doc(client, "jogadores", "new-client"), { role: "admin" }),
          () => updateDoc(ref, { sequenciaAtual: 99 }),
          () => deleteDoc(ref)
        ]) {
          await assertFails(operation())
          denied++
        }
      }
      const beforePlan = await planMigrationRollback(db, backup, dates)
      assert.equal(beforePlan.operations.length, 0)
      const dryCopy = command("scripts/migrate-v2.mjs", "--project", projectId, "--copy")
      assert.match(dryCopy, /"written": 0/)
      assert.equal((await db.doc("perfisPublicos/" + ids[0]).get()).exists, false)
      command("scripts/migrate-v2.mjs", "--project", projectId, "--copy", "--apply")
      command("scripts/migrate-v2.mjs", "--project", projectId, "--cleanup")
      assert.equal((await db.doc("jogadores/" + ids[0]).get()).data().schemaVersion, undefined)
      command("scripts/migrate-v2.mjs", "--project", projectId, "--cleanup", "--apply")
      for (const uid of ids) {
        const player = (await db.doc("jogadores/" + uid).get()).data()
        assert.equal(player.schemaVersion, 2n)
        assert.equal(player.termsVersion, "3")
        assert.equal(player.termsAccepted, false)
        assert.equal(player.email, undefined)
        assert.equal(player.stats.totalWins, 2n)
        assert.equal(player.createdAt.toDate().toISOString(), created)
      }
      assert.equal((await db.doc("perfisPublicos/" + ids[1]).get()).data().apelido, "BetoManual")
      const migrated = (await db.doc("jogadores/" + ids[0]).get()).data()
      await db.doc("jogadores/" + ids[0]).update({ "stats.totalWins": 3 })
      await assert.rejects(
        planMigrationRollback(db, backup, dates),
        (error) => error.code === "UNEXPECTED_PLAYER_STATE"
      )
      assert.equal((await db.doc("perfisPublicos/" + ids[0]).get()).exists, true)
      await db.doc("jogadores/" + ids[0]).set(migrated)
      const migratedBeto = (await db.doc("jogadores/" + ids[1]).get()).data()
      const stalePlan = await planMigrationRollback(db, backup, dates)
      await db.doc("jogadores/" + ids[1]).update({ "stats.totalGames": 3 })
      await assert.rejects(
        applyMigrationRollback(db, stalePlan),
        (error) => error.code === "ROLLBACK_CONCURRENT_CHANGE"
      )
      await db.doc("jogadores/" + ids[1]).set(migratedBeto)
      const plan = await planMigrationRollback(db, backup, dates)
      assert.deepEqual(plan.summary, {
        restorePlayers: 2,
        removeCreatedProfiles: 1,
        historyWrites: 0
      })
      const fileRoot = ".firebase/cutover-fixtures"
      await mkdir(fileRoot, { recursive: true })
      await writeFile(fileRoot + "/backup.json", JSON.stringify(backup))
      await writeFile(fileRoot + "/dates.json", JSON.stringify(dates))
      const output = command(
        "scripts/rollback-v2.mjs",
        "--project",
        projectId,
        "--backup",
        fileRoot + "/backup.json",
        "--auth-dates",
        fileRoot + "/dates.json",
        "--apply",
        "--confirm-project",
        projectId
      )
      assert.match(output, /"completed":3/)
      const restored = await captureFirestore(db, projectId, { migrationDocumentsOnly: true })
      assert.deepEqual(restored.payload.documents, backup.payload.documents)
      assert.deepEqual((await history.get()).data(), historyBefore)
      assert.equal((await planMigrationRollback(db, backup, dates)).operations.length, 0)
      await writeFile(
        ".firebase/cutover-fixtures/result.json",
        JSON.stringify(
          {
            maintenanceDenials: denied,
            copyAndCleanupCLI: true,
            rollbackCLI: true,
            concurrentChangeRejected: true,
            unexpectedDataRejected: true,
            existingProfilePreserved: true,
            historyUnchanged: true,
            originalDocumentsRestored: true,
            rollbackIdempotent: true,
            productionAccess: false
          },
          null,
          2
        )
      )
    } finally {
      for (const uid of ids) {
        await db.recursiveDelete(db.doc("jogadores/" + uid))
        await db.doc("perfisPublicos/" + uid).delete()
        await auth.deleteUser(uid)
      }
      await environment.cleanup()
      await deleteApp(app)
    }
  }
)
