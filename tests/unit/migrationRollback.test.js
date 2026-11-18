import test from "node:test"
import assert from "node:assert/strict"
import process from "node:process"
import { spawnSync } from "node:child_process"
import { applyMigrationRollback } from "../../scripts/lib/migration-rollback.mjs"

test("recuperação recusa qualquer caminho de histórico antes de iniciar escritas", async () => {
  const db = {
    projectId: "demo-test",
    runTransaction: () => {
      throw Error("Não deve acessar o banco")
    }
  }
  await assert.rejects(
    applyMigrationRollback(db, {
      targetProjectId: "demo-test",
      operations: [{ kind: "restore-player", path: "jogadores/ficticio/partidas/historico" }]
    }),
    (error) => error.code === "ROLLBACK_SCOPE_INVALID"
  )
})

test("CLI de recuperação exige confirmação explícita do projeto antes de carregar credenciais", () => {
  const env = Object.fromEntries(
    ["SystemRoot", "WINDIR", "PATH", "TEMP", "TMP"]
      .filter((key) => process.env[key])
      .map((key) => [key, process.env[key]])
  )
  const r = spawnSync(
    process.execPath,
    [
      "scripts/rollback-v2.mjs",
      "--project",
      "nextage-d6d48",
      "--backup",
      "inexistente.json",
      "--auth-dates",
      "inexistente.json",
      "--apply"
    ],
    { encoding: "utf8", windowsHide: true, env, timeout: 15000 }
  )
  assert.equal(r.status, 1)
  assert.match(r.stderr, /PROJECT_CONFIRMATION_REQUIRED/)
  assert.doesNotMatch(r.stdout + r.stderr, /GOOGLE_APPLICATION_CREDENTIALS|ENOENT/)
})
