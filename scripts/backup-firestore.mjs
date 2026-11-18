import { parseArgs } from "node:util"
import { readFile, writeFile, mkdir } from "node:fs/promises"
import path from "node:path"
import process from "node:process"
import { deleteApp, initializeApp } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"
import { adminClients } from "./lib/admin.mjs"
import {
  captureFirestore,
  inspectBackup,
  restoreBackupToEmulator
} from "./lib/firestore-backup.mjs"

async function main() {
  const { values } = parseArgs({
    options: {
      project: { type: "string" },
      out: { type: "string" },
      verify: { type: "string" },
      "rehearse-local": { type: "string" },
      "migration-documents-only": { type: "boolean", default: false }
    }
  })
  if (
    !values.project ||
    [values.out, values.verify, values["rehearse-local"]].filter(Boolean).length !== 1
  ) {
    throw new Error("Informe --project e exatamente um de --out, --verify ou --rehearse-local.")
  }
  if (values.verify || values["rehearse-local"]) {
    if (values["migration-documents-only"])
      throw new Error(
        "O escopo da cópia existente é lido do arquivo; não informe outro escopo na verificação."
      )
    const backup = JSON.parse(await readFile(values.verify || values["rehearse-local"], "utf8"))
    const host = process.env.FIRESTORE_EMULATOR_HOST
    if (
      values["rehearse-local"] &&
      (!/^demo-[a-z0-9-]+$/.test(values.project) || !/^127\.0\.0\.1:\d+$/.test(host ?? ""))
    ) {
      throw new Error(
        "Ensaio permitido somente com --project demo-* e FIRESTORE_EMULATOR_HOST em 127.0.0.1."
      )
    }
    // Verification needs no credential or remote connection.
    const app = initializeApp({ projectId: values.project })
    try {
      const db = getFirestore(app)
      db.settings({ useBigInt: true })
      const summary = values.verify
        ? inspectBackup(backup, db)
        : await restoreBackupToEmulator(backup, db, values.project, host)
      console.log(
        JSON.stringify({
          mode: values.verify ? "verify-offline" : "rehearsal-local",
          ...summary,
          ...(values["rehearse-local"]
            ? {
                sourceProjectId: summary.projectId,
                targetProjectId: values.project,
                emulatorHost: host
              }
            : {})
        })
      )
    } finally {
      await deleteApp(app)
    }
    return
  }
  if (process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_AUTH_EMULATOR_HOST)
    throw new Error("Remova variáveis de emulador antes de um backup real.")
  const out = path.resolve(values.out)
  const allowed = path.resolve(".firebase/private-backups") + path.sep
  if (!out.startsWith(allowed))
    throw new Error("Use --out dentro de .firebase/private-backups/, ignorado pelo Git.")
  const { app, db } = adminClients(values.project)
  try {
    db.settings({ useBigInt: true })
    console.log(
      "Copiando documentos por leitura administrativa. Nenhum documento remoto será alterado."
    )
    if (values["migration-documents-only"])
      console.log(
        "Escopo limitado: documentos principais de jogadores e perfis públicos. O histórico de partidas não integra esta cópia."
      )
    const backup = await captureFirestore(db, values.project, {
      migrationDocumentsOnly: values["migration-documents-only"]
    })
    const summary = inspectBackup(backup, db)
    await mkdir(path.dirname(out), { recursive: true })
    // Never overwrite a previous recovery file. A failed write has no success marker.
    await writeFile(out, JSON.stringify(backup) + "\n", { flag: "wx", mode: 0o600 })
    const readBack = JSON.parse(await readFile(out, "utf8"))
    inspectBackup(readBack, db)
    console.log(
      JSON.stringify({
        mode: "read-only-export",
        ...summary,
        consistentSnapshot: false,
        note: "Cópia lógica; não inclui Authentication, regras, índices ou arquivos Storage. Não é snapshot atômico."
      })
    )
  } finally {
    await deleteApp(app)
  }
}

main().catch(() => {
  // SDK errors may contain document paths or request details. Do not print them.
  console.error(
    "Não foi possível concluir a operação. Confira projeto, credencial externa, opções, destino e integridade do arquivo. Nenhum sucesso de backup foi confirmado."
  )
  process.exitCode = 1
})
