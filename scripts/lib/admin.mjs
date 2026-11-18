import { realpathSync } from "node:fs"
import { isAbsolute, relative, resolve, sep } from "node:path"
import { fileURLToPath } from "node:url"
import { applicationDefault, initializeApp } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"
import { getFirestore } from "firebase-admin/firestore"

export function adminClients(projectId) {
  if (!/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(projectId ?? "")) {
    throw new Error("Informe --project com o ID explícito do projeto Firebase.")
  }
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
  if (!credentialsPath) {
    throw new Error(
      "Defina GOOGLE_APPLICATION_CREDENTIALS para uma credencial fora do repositório."
    )
  }
  const root = realpathSync(fileURLToPath(new URL("../../", import.meta.url)))
  let credential
  try {
    credential = realpathSync(resolve(credentialsPath))
  } catch {
    throw new Error("A credencial informada não está acessível.")
  }
  const pathFromRoot = relative(root, credential)
  if (
    pathFromRoot === "" ||
    (!isAbsolute(pathFromRoot) && pathFromRoot !== ".." && !pathFromRoot.startsWith(`..${sep}`))
  ) {
    throw new Error(
      "A credencial precisa estar fora do repositório, inclusive após resolver links."
    )
  }
  const app = initializeApp({ projectId, credential: applicationDefault() })
  return { app, db: getFirestore(app), auth: getAuth(app) }
}
