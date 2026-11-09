import { test } from "node:test"
import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { createServer } from "node:net"
import { existsSync } from "node:fs"
import { setTimeout as delay } from "node:timers/promises"

async function portFree(port) {
  return new Promise(resolve => {
    const server = createServer()
    server.once("error", () => resolve(false))
    server.listen(port, "127.0.0.1", () => server.close(() => resolve(true)))
  })
}

test("app local inicia, encerra pelo controle de shutdown e reinicia sem deixar portas ocupadas", { timeout: 360000 }, async () => {
  const ports = [8080, 9099, 5173]
  for (const port of ports) assert.equal(await portFree(port), true, `A porta ${port} já está ocupada; encerre o app antes deste teste.`)
  for (let cycle = 1; cycle <= 2; cycle++) {
    let output = ""
    const child = spawn(process.execPath, ["scripts/run-emulator-tests.mjs", "app"], {
      stdio: ["ignore", "pipe", "pipe", "ipc"], windowsHide: true
    })
    const collect = chunk => { output = (output + chunk.toString()).slice(-15000) }
    child.stdout.on("data", collect)
    child.stderr.on("data", collect)
    const exited = new Promise((resolve, reject) => {
      child.once("error", reject)
      child.once("exit", code => resolve(code))
    })
    try {
      const deadline = Date.now() + 120000
      while (!output.includes("http://127.0.0.1:5173/") && child.exitCode === null && Date.now() < deadline) {
        await delay(250)
      }
      assert.ok(output.includes("http://127.0.0.1:5173/"), output)
      assert.equal((await fetch("http://127.0.0.1:5173/")).status, 200)
      console.log(`Ciclo ${cycle}: app respondeu; solicitando encerramento pelo mesmo handler de Ctrl+C.`)
    } finally {
      if (child.connected) child.send({ type: "nextage:shutdown" })
      const timer = delay(90000, "timeout", { ref: false })
      assert.equal(await Promise.race([exited, timer]), 0, output)
    }
    assert.ok(output.includes("Export complete"), output)
    assert.equal(existsSync(".firebase/emulators-data/firebase-export-metadata.json"), true)
    for (const port of ports) assert.equal(await portFree(port), true, `Porta ${port} ocupada após ciclo ${cycle}.\n${output}`)
    console.log(`Ciclo ${cycle}: exportação concluída; portas 8080, 9099 e 5173 livres.`)
  }
})
