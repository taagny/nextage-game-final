import { parseArgs, isDeepStrictEqual } from "node:util"
import { deleteApp } from "firebase-admin/app"
import { FieldPath, Timestamp } from "firebase-admin/firestore"
import { adminClients } from "./lib/admin.mjs"
import { buildPrivateDocument, buildPublicProfile } from "./lib/migration-v2.mjs"
import { pseudonymizeUid } from "../src/utils/pseudonym.js"

async function main() {
  const { values } = parseArgs({ options: {
    project: { type: "string" }, copy: { type: "boolean" },
    cleanup: { type: "boolean" }, apply: { type: "boolean", default: false }
  } })
  if (Boolean(values.copy) === Boolean(values.cleanup)) {
    throw new Error("Escolha exatamente um modo: --copy ou --cleanup. Sem --apply, nada é gravado.")
  }
  const { app, db, auth } = adminClients(values.project)
  const summary = { mode: values.copy ? "copy" : "cleanup", dryRun: !values.apply, examined: 0, planned: 0, written: 0, skipped: 0 }
  console.log(`Projeto: ${values.project}; modo: ${summary.mode}; ${summary.dryRun ? "DRY-RUN: nenhuma gravação" : "APPLY: gravações habilitadas"}`)
  try {
    let cursor
    while (true) {
      let pageQuery = db.collection("jogadores").orderBy(FieldPath.documentId()).limit(200)
      if (cursor) pageQuery = pageQuery.startAfter(cursor)
      const page = await pageQuery.get()
      if (page.empty) break
      for (const snapshot of page.docs) {
        summary.examined += 1
        try {
          const legacy = snapshot.data()
          const publicRef = db.collection("perfisPublicos").doc(snapshot.id)
          const publicSnapshot = await publicRef.get()
          if (values.copy) {
            if (publicSnapshot.exists) { summary.skipped += 1; continue }
            const profile = buildPublicProfile(legacy, Timestamp.now())
            summary.planned += 1
            if (values.apply) {
              const copied = await db.runTransaction(async transaction => {
                const current = await transaction.get(publicRef)
                if (current.exists) return false
                transaction.create(publicRef, profile)
                return true
              })
              if (copied) summary.written += 1
              else summary.skipped += 1
            }
          } else {
            if (!publicSnapshot.exists) throw new Error("Perfil público ausente: execute --copy antes de --cleanup.")
            // A data real vem do Authentication; nunca inventar createdAt para o legado.
            const creation = legacy.createdAt ?? Timestamp.fromDate(new Date((await auth.getUser(snapshot.id)).metadata.creationTime))
            const now = Timestamp.now()
            const cleaned = buildPrivateDocument(legacy, { now, createdAt: creation })
            if (isDeepStrictEqual(legacy, cleaned)) { summary.skipped += 1; continue }
            summary.planned += 1
            if (values.apply) {
              // Releitura transacional preserva partidas/aceites feitos durante a migração.
              const changed = await db.runTransaction(async transaction => {
                const current = await transaction.get(snapshot.ref)
                const currentPublic = await transaction.get(publicRef)
                if (!current.exists) return false
                if (!currentPublic.exists) throw new Error("Perfil público foi removido; cleanup interrompido.")
                const next = buildPrivateDocument(current.data(), { now, createdAt: creation })
                if (isDeepStrictEqual(current.data(), next)) return false
                transaction.set(snapshot.ref, next)
                return true
              })
              if (changed) summary.written += 1
              else summary.skipped += 1
            }
          }
        } catch (error) {
          // Logs de diagnóstico não incluem nome, e-mail nem UID bruto.
          throw new Error(`Documento ${await pseudonymizeUid(snapshot.id)}: ${error.message}`, { cause: error })
        }
      }
      cursor = page.docs.at(-1)
    }
    console.log(JSON.stringify(summary, null, 2))
  } finally {
    await deleteApp(app)
  }
}

main().catch(error => {
  console.error(error.message)
  process.exitCode = 1
})
