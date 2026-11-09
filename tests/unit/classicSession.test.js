import { test } from "node:test"
import assert from "node:assert/strict"
import { classicElapsedTime, classicSessionKey, newClassicRound, restoreClassicRound } from "../../src/utils/classicSession.js"
import { checkGuess } from "../../src/utils/gameLogic.js"

function fixture(guesses = [], finished = false) {
  const round = newClassicRound(1000, "partida-local-fixture")
  round.secret = "OPACA"
  for (let index = 0; index < guesses.length; index++) {
    round.game.board[index] = guesses[index].split("")
    round.game.results[index] = checkGuess(round.secret, guesses[index])
  }
  round.game.currentRow = finished ? guesses.length - 1 : guesses.length
  round.game.isGameOver = finished
  round.finishedAt = finished ? 1500 : null
  return round
}
test("recarga mantém palavra, ID, tempo, tentativa parcial e posição do cursor", () => {
  const round = fixture(["CASAS"])
  round.game.board[1] = ["T", "E", "", "", ""]
  round.game.currentCol = 2
  round.game.isManualSelection = true
  const restored = restoreClassicRound(JSON.parse(JSON.stringify(round)))
  assert.deepEqual(restored, round)
  restored.game.board[1][0] = "A"
  assert.equal(round.game.board[1][0], "T")
})
test("vitória concluída restaura resultado e ID para reenvio idempotente", () => {
  const round = fixture(["CASAS", "TERMO", "OPACA"], true)
  const restored = restoreClassicRound(round)
  assert.equal(restored.game.isGameOver, true)
  assert.equal(restored.game.currentRow, 2)
  assert.equal(restored.finishedAt, 1500)
  assert.equal(restored.recorded, false)
  assert.equal(restored.matchId, round.matchId)
  round.recorded = true
  assert.equal(restoreClassicRound(round).recorded, true)
})
test("derrota após seis linhas continua encerrada ao recarregar", () => {
  const restored = restoreClassicRound(fixture(Array(6).fill("CASAS"), true))
  assert.equal(restored.game.currentRow, 5)
  assert.equal(restored.game.isGameOver, true)
  assert.equal(restored.game.results.length, 6)
})
test("cores são recalculadas; snapshot inválido ou linhas posteriores à vitória são recusados", () => {
  const round = fixture(["CASAS"])
  round.game.results[0] = Array(5).fill("correct")
  assert.deepEqual(restoreClassicRound(round).game.results[0], checkGuess("OPACA", "CASAS"))
  assert.equal(restoreClassicRound(fixture(["OPACA", "CASAS"], true)), null)
  assert.equal(restoreClassicRound({ ...round, secret: "<html>" }), null)
  assert.equal(restoreClassicRound({ ...round, version: 999 }), null)
  assert.equal(restoreClassicRound({ ...round, game: { ...round.game, board: [] } }), null)
  assert.equal(restoreClassicRound({ ...fixture(["OPACA"], true), finishedAt: null }), null)
})
test("contas, visitante e projetos têm chaves separadas", () => {
  const keys = [classicSessionKey("projeto-a", "alice"), classicSessionKey("projeto-a", "bob"),
    classicSessionKey("projeto-b", "alice"), classicSessionKey("projeto-a"), classicSessionKey("projeto-a", "guest")]
  assert.equal(new Set(keys).size, keys.length)
})
test("tempo inclui intervalo fora da página sem exceder os limites das regras", () => {
  assert.equal(classicElapsedTime(1000, 17000), 16000)
  assert.equal(classicElapsedTime(1000, 500), 0)
  assert.equal(classicElapsedTime(0, 86400001), 86400000)
})
