import test from "node:test"
import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import process from "node:process"

test("migração informa o placar inválido original sem exigir chave de pesquisa nem expor UID", () => {
  const adminURL = new URL("../../scripts/lib/admin.mjs", import.meta.url).href
  const mock = `import { initializeApp } from 'firebase-admin/app';
    export function adminClients() {
      const app = initializeApp({ projectId: 'demo-nextage-migration' });
      const snapshot = { id: 'uid-ficticio-que-nao-deve-aparecer',
        data: () => ({ runnerScores: { 10: 11 } }) };
      const query = { orderBy: () => query, limit: () => query,
        get: async () => ({ empty: false, docs: [snapshot] }) };
      const db = { collection: name => name === 'jogadores' ? query :
        { doc: () => ({ get: async () => ({ exists: false }) }) } };
      return { app, db, auth: {} };
    }`
  const loader = `export async function load(url, context, next) {
    return url === ${JSON.stringify(adminURL)} ?
      { format: 'module', shortCircuit: true, source: ${JSON.stringify(mock)} } : next(url, context);
  }`
  const registration = `import { register } from 'node:module';
    register(${JSON.stringify(`data:text/javascript,${encodeURIComponent(loader)}`)}, ${JSON.stringify(import.meta.url)});`
  const env = Object.fromEntries(
    ["SystemRoot", "WINDIR", "PATH", "TEMP", "TMP"]
      .filter((key) => process.env[key])
      .map((key) => [key, process.env[key]])
  )
  const result = spawnSync(
    process.execPath,
    [
      "--import",
      `data:text/javascript,${encodeURIComponent(registration)}`,
      "scripts/migrate-v2.mjs",
      "--copy",
      "--project",
      "demo-nextage-migration"
    ],
    { encoding: "utf8", windowsHide: true, timeout: 20000, env }
  )
  assert.equal(result.error, undefined)
  assert.equal(result.status, 1)
  const output = result.stdout + result.stderr
  assert.match(output, /DRY-RUN: nenhuma gravação/)
  assert.match(output, /Documento na posição 1: runnerScores\/10: valor inválido/)
  assert.doesNotMatch(output, /uid-ficticio-que-nao-deve-aparecer|Abra sua chave/)
})
