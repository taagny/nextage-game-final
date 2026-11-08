import test from "node:test"
import assert from "node:assert/strict"
import { Timestamp } from "firebase/firestore"
import { personalMatchesCSV, serializeTimestamps, timestampISO, toCSV } from "../../src/utils/dataExport.js"

test("exportação pessoal converte timestamps aninhados e preserva o próprio apelido", () => {
  const timestamp = Timestamp.fromMillis(1000)
  const source = { publicProfile: { apelido: "ApelidoFixture", updatedAt: timestamp },
    player: { termsAcceptedAt: timestamp }, matches: [{ createdAt: timestamp }], words: [], missing: null }
  const result = serializeTimestamps(source)
  assert.equal(result.publicProfile.apelido, "ApelidoFixture")
  assert.equal(result.publicProfile.updatedAt, "1970-01-01T00:00:01.000Z")
  assert.equal(result.matches[0].createdAt, result.player.termsAcceptedAt)
  assert.equal(result.missing, null)
  assert.ok(source.player.termsAcceptedAt instanceof Timestamp)
})

test("CSV preserva separadores, aspas e quebras de linha", () => {
  const csv = toCSV(["value", "empty"], [{ value: 'x;"y"\nz' }])
  assert.equal(csv, '"value";"empty"\r\n"x;""y""\nz";""\r\n')
})

test("CSV neutraliza fórmulas de texto e preserva números negativos", () => {
  const csv = toCSV(["value"], ["=1+1", "+cmd", "@cmd", "-cmd", "  =1+1", -7].map(value => ({ value })))
  for (const value of ["=1+1", "+cmd", "@cmd", "-cmd", "  =1+1"]) assert.ok(csv.includes(`'${value}`))
  assert.ok(csv.includes('"-7"'))
})

test("CSV pessoal contém palavra, desfecho, data ISO e marca de confiabilidade", () => {
  const timestamp = Timestamp.fromMillis(1000)
  const csv = personalMatchesCSV([{ id: "fixture-partida", mode: "classico", won: false,
    attempts: 6, timeMs: 3000, abandoned: false, word: "CASAS", createdAt: timestamp }], timestamp)
  assert.ok(csv.includes('"CASAS"'))
  assert.ok(csv.includes('"false"'))
  assert.ok(csv.includes('"counters_valid_since"'))
  assert.ok(csv.includes('"1970-01-01T00:00:01.000Z"'))
  assert.equal(timestampISO(null), "")
  assert.throws(() => timestampISO("data-inválida"), /Timestamp inválido/)
})
