import { parseArgs } from "node:util"
import { deleteApp } from "firebase-admin/app"
import { adminClients } from "./lib/admin.mjs"

async function main() {
  const { values } = parseArgs({
    options: {
      project: { type: "string" },
      uid: { type: "string" },
      apply: { type: "boolean", default: false }
    }
  })
  if (!values.uid || values.uid.length > 128)
    throw new Error("Informe --uid com o UID da conta administradora.")
  const { app, auth } = adminClients(values.project)
  try {
    const user = await auth.getUser(values.uid)
    const claims = { ...user.customClaims, admin: true }
    if (values.apply) await auth.setCustomUserClaims(values.uid, claims)
    console.log(
      values.apply
        ? "Claim admin definido. Saia e entre novamente no aplicativo para renovar o token."
        : "DRY-RUN: conta encontrada; claim admin seria definido, preservando os demais claims. Use --apply para gravar."
    )
  } finally {
    await deleteApp(app)
  }
}

main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
