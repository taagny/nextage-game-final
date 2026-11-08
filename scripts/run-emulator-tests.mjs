import { spawn } from "node:child_process"
import { fileURLToPath } from "node:url"

const emulator = process.argv[2]
const scripts = {
  auth: "node --test tests/auth/*.test.mjs",
  firestore: "node --test rules-tests/*.test.js"
}
if (!Object.hasOwn(scripts, emulator)) throw new Error("Informe auth ou firestore para executar os testes locais.")

// Não modificar o ambiente do usuário. O DEBUG herdado faz o CLI registrar o
// ambiente inteiro; os testes locais também não precisam de credenciais reais.
const allowedEnvironment = new Set([
  "path", "pathext", "systemroot", "systemdrive", "windir", "comspec", "appdata",
  "localappdata", "programdata", "allusersprofile", "home", "userprofile",
  "homedrive", "homepath", "temp", "tmp", "lang", "lc_all", "lc_ctype", "term", "no_color"
])
const testEnvironment = Object.fromEntries(Object.entries(process.env)
  .filter(([key]) => allowedEnvironment.has(key.toLowerCase())))

const child = spawn(process.execPath, [
  fileURLToPath(new URL("../node_modules/firebase-tools/lib/bin/firebase.js", import.meta.url)),
  "emulators:exec", "--only", emulator, "--project", "demo-nextage-v2", scripts[emulator]
], {
  cwd: fileURLToPath(new URL("../", import.meta.url)),
  env: testEnvironment, stdio: "inherit", windowsHide: true
})
child.on("error", error => {
  console.error("Não foi possível iniciar o emulador local:", error.message)
  process.exitCode = 1
})
child.on("close", code => { process.exitCode = code ?? 1 })
