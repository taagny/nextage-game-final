import { parseArgs } from "node:util"
import { readFile } from "node:fs/promises"
import process from "node:process"
import { deleteApp } from "firebase-admin/app"
import { getSecurityRules } from "firebase-admin/security-rules"
import { adminClients } from "./lib/admin.mjs"
import { planMigrationRollback, applyMigrationRollback } from "./lib/migration-rollback.mjs"

async function main() {
  const { values } = parseArgs({
    options: {
      project: { type: "string" },
      backup: { type: "string" },
      "auth-dates": { type: "string" },
      apply: { type: "boolean", default: false },
      "confirm-project": { type: "string" }
    }
  })
  if (!values.project || !values.backup || !values["auth-dates"]) throw Error("OPTIONS_REQUIRED")
  if (values.apply && values["confirm-project"] !== values.project)
    throw Error("PROJECT_CONFIRMATION_REQUIRED")
  const host = process.env.FIRESTORE_EMULATOR_HOST
  const emulated = /^demo-[a-z0-9-]+$/.test(values.project) && /^127\.0\.0\.1:\d+$/.test(host ?? "")
  if ((host && !emulated) || (!host && values.project.startsWith("demo-")))
    throw Error("EMULATOR_TARGET_INVALID")
  const backup = JSON.parse(await readFile(values.backup, "utf8")),
    dates = JSON.parse(await readFile(values["auth-dates"], "utf8"))
  if (!emulated && backup.payload.projectId !== values.project)
    throw Error("BACKUP_PROJECT_MISMATCH")
  const { app, db } = adminClients(values.project)
  try {
    db.settings({ useBigInt: true })
    if (values.apply && !emulated) {
      const maintenance = await readFile(
        new URL("../firestore.maintenance.rules", import.meta.url),
        "utf8"
      )
      const current = await getSecurityRules(app).getFirestoreRuleset()
      if (current.source.length !== 1 || current.source[0].content.trim() !== maintenance.trim())
        throw Error("MAINTENANCE_RULES_NOT_ACTIVE")
    }
    const plan = await planMigrationRollback(db, backup, dates)
    console.log(JSON.stringify({ project: values.project, dryRun: !values.apply, ...plan.summary }))
    if (values.apply) console.log(JSON.stringify(await applyMigrationRollback(db, plan)))
  } finally {
    await deleteApp(app)
  }
}
main().catch((error) => {
  const candidate = error.code ?? error.message
  const code =
    typeof candidate === "string" && /^[A-Z_]+$/.test(candidate)
      ? candidate
      : "ROLLBACK_NOT_COMPLETED"
  console.error(code)
  process.exitCode = 1
})
