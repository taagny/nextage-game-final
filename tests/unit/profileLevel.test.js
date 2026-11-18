import test from "node:test"
import assert from "node:assert/strict"
import { getProfileLevel } from "../../src/utils/profileLevel.js"

for (const [wins, expected] of [
  [0, "iniciante"],
  [99, "iniciante"],
  [100, "medio"],
  [499, "medio"],
  [500, "avancado"],
  [501, "avancado"]
]) {
  test(`classifica ${wins} vitórias como ${expected}`, () => {
    assert.equal(getProfileLevel(wins), expected)
  })
}

test("mantém iniciante quando não há um total válido de vitórias", () => {
  for (const wins of [-1, NaN, Infinity, "inválido"]) {
    assert.equal(getProfileLevel(wins), "iniciante")
  }
  assert.equal(getProfileLevel(), "iniciante")
})
