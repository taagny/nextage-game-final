const settings = {
  apiKey: "VITE_FIREBASE_API_KEY",
  authDomain: "VITE_FIREBASE_AUTH_DOMAIN",
  projectId: "VITE_FIREBASE_PROJECT_ID",
  appId: "VITE_FIREBASE_APP_ID",
  storageBucket: "VITE_FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "VITE_FIREBASE_MESSAGING_SENDER_ID"
}

// Uma configuração parcial nunca deve misturar projetos de preview/produção.
export function resolveFirebaseConfig(environment, fallback) {
  const configured = Object.fromEntries(
    Object.entries(settings)
      .map(([key, variable]) => [key, environment[variable]?.trim() ?? ""])
      .filter(([, value]) => value !== "")
  )
  if (Object.keys(configured).length === 0) return { ...fallback }
  const missing = ["apiKey", "authDomain", "projectId", "appId"]
    .filter((key) => !configured[key])
    .map((key) => settings[key])
  if (missing.length) throw new Error(`Configuração Firebase incompleta: ${missing.join(", ")}.`)
  return configured
}
