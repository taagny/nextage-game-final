import { spawn, spawnSync } from "node:child_process"
import { existsSync, readdirSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const emulator = process.argv[2]
const scripts = {
  auth: { only: "auth", command: "node --test tests/auth/*.test.mjs" },
  firestore: { only: "firestore", command: "node --test rules-tests/*.test.js" },
  integration: { only: "auth,firestore", command: "node --import ./tests/integration/register.mjs --test tests/integration/playerFlow.test.mjs" },
  "persistence-save": { only: "auth,firestore", command: "node --import ./tests/integration/register.mjs tests/integration/persistence.mjs save" },
  "persistence-load": { only: "auth,firestore", command: "node --import ./tests/integration/register.mjs tests/integration/persistence.mjs load" },
  app: { only: "auth,firestore" }
}
if (!Object.hasOwn(scripts, emulator)) throw new Error("Informe auth, firestore, integration ou app para executar os emuladores locais.")
const { only, command } = scripts[emulator]

// Não modificar o ambiente do usuário. O DEBUG herdado faz o CLI registrar o
// ambiente inteiro; os testes locais também não precisam de credenciais reais.
const allowedEnvironment = new Set([
  "path", "pathext", "systemroot", "systemdrive", "windir", "comspec", "appdata",
  "localappdata", "programdata", "allusersprofile", "home", "userprofile",
  "homedrive", "homepath", "temp", "tmp", "lang", "lc_all", "lc_ctype", "term", "no_color"
])
const testEnvironment = Object.fromEntries(Object.entries(process.env)
  .filter(([key]) => allowedEnvironment.has(key.toLowerCase())))

// Terminais abertos antes de instalar Java mantêm o PATH antigo. Localizar o
// JDK altera somente o ambiente filho, sem modificar o PATH global do usuário.
if (only.includes("firestore") && process.platform === "win32") {
  const javaWorks = executable => {
    const result = spawnSync(executable, ["-version"], {
      env: testEnvironment, encoding: "utf8", windowsHide: true, timeout: 10000
    })
    const major = Number(`${result.stderr ?? ""}\n${result.stdout ?? ""}`.match(/version "(?:1\.)?(\d+)/)?.[1])
    return result.status === 0 && major >= 21
  }
  if (!javaWorks("java")) {
    const microsoftRoot = path.join(process.env.ProgramFiles || "C:\\Program Files", "Microsoft")
    const candidates = [process.env.JAVA_HOME]
    if (existsSync(microsoftRoot)) {
      candidates.push(...readdirSync(microsoftRoot, { withFileTypes: true })
        .filter(entry => entry.isDirectory() && /^jdk-/.test(entry.name))
        .map(entry => path.join(microsoftRoot, entry.name)))
    }
    const javaHome = candidates.filter(Boolean)
      .find(root => javaWorks(path.join(root, "bin", "java.exe")))
    if (!javaHome) throw new Error("Java 21 ou superior não encontrado. Instale o JDK ou configure JAVA_HOME e reinicie o terminal.")
    const pathKey = Object.keys(testEnvironment).find(key => key.toLowerCase() === "path") || "Path"
    testEnvironment[pathKey] = `${path.join(javaHome, "bin")}${path.delimiter}${testEnvironment[pathKey] || ""}`
    testEnvironment.JAVA_HOME = javaHome
    console.info("Java 21+ localizado para o emulador local (PATH do terminal estava desatualizado).")
  }
}

const persistence = emulator === "app"
  ? ["--import", ".firebase/emulators-data", "--export-on-exit", ".firebase/emulators-data"]
  : emulator === "persistence-save"
    ? ["--export-on-exit", ".firebase/persistence-test"]
    : emulator === "persistence-load" ? ["--import", ".firebase/persistence-test"] : []
const child = spawn(process.execPath, [
  "--import", new URL("./lib/emulator-shutdown.mjs", import.meta.url).href,
  fileURLToPath(new URL("../node_modules/firebase-tools/lib/bin/firebase.js", import.meta.url)),
  emulator === "app" ? "emulators:start" : "emulators:exec",
  "--only", only, "--project", "demo-nextage-v2",
  "--config", emulator === "app" ? "firebase.json" : "firebase.tests.json",
  ...persistence, ...(command ? [command] : [])
], {
  cwd: fileURLToPath(new URL("../", import.meta.url)),
  env: testEnvironment, stdio: ["inherit", "inherit", "inherit", "ipc"], windowsHide: true
})
child.on("error", error => {
  console.error("Não foi possível iniciar o emulador local:", error.message)
  process.exitCode = 1
})
let viteServer
child.on("close", async code => {
  await viteServer?.close()
  process.exitCode ||= code ?? 1
  if (process.connected) process.disconnect()
})

let stopping = false
async function requestShutdown() {
  if (stopping) return
  stopping = true
  console.info("Encerrando os emuladores; aguarde a exportação e a liberação das portas.")
  await viteServer?.close()
  // No Windows, kill(SIGINT) pode terminar o processo sem executar seus handlers.
  // IPC solicita ao próprio CLI que execute seu encerramento normal.
  if (child.connected) child.send({ type: "nextage:shutdown" }, () => {})
}
process.on("SIGINT", requestShutdown)
process.on("SIGTERM", requestShutdown)
// Permite testar o mesmo caminho de encerramento sem sinais de console globais.
process.on("message", message => {
  if (message?.type === "nextage:shutdown") requestShutdown()
})

if (emulator === "app") {
  try {
    const responds = url => fetch(url, { signal: AbortSignal.timeout(1000) })
      .then(() => true, () => false)
    let ready = false
    const deadline = Date.now() + 90000
    while (!stopping && child.exitCode === null && Date.now() < deadline) {
      const services = await Promise.all([
        responds("http://127.0.0.1:9099/"), responds("http://127.0.0.1:8080/")
      ])
      if (services.every(Boolean)) { ready = true; break }
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    if (ready && !stopping && child.exitCode === null) {
      // Vite pertence ao wrapper: não sobra outro processo node após encerrar.
      const { createServer } = await import("vite")
      viteServer = await createServer({
        mode: "emulators", server: { host: "127.0.0.1", port: 5173, strictPort: true }
      })
      if (stopping || child.exitCode !== null) await viteServer.close()
      else {
        await viteServer.listen()
        viteServer.printUrls()
      }
    } else if (!stopping && child.exitCode === null) {
      throw new Error("Os emuladores não ficaram disponíveis em 90 segundos.")
    }
  } catch (error) {
    console.error("Falha ao iniciar o aplicativo local:", error.message)
    process.exitCode = 1
    await requestShutdown()
  }
}
