import { test } from "node:test"
import assert from "node:assert/strict"
import { createWordleInput, wordleInputReducer } from "../../src/utils/wordleInput.js"

const edit = (state, ...actions) => actions.reduce(wordleInputReducer, state)
const letters = (text) => [...text].map((letter) => ({ type: "letter", letter }))
const select = (column, row = 0) => ({ type: "select", row, column })

test("digitação após seleção segue o cursor e preserva espaços anteriores", () => {
  const state = edit(createWordleInput(), select(2), ...letters("ABC"))
  assert.deepEqual(state.board[0], ["", "", "A", "B", "C"])
  assert.equal(state.currentCol, 4)
})

test("letras excedentes não sobrescrevem o fim da palavra", () => {
  const state = edit(createWordleInput(), ...letters("CASASXYZ"))
  assert.deepEqual(state.board[0], [..."CASAS"])
  assert.equal(state.currentCol, 4)
})

test("seleção no meio permite substituir letras consecutivas em uma linha cheia", () => {
  const state = edit(createWordleInput(), ...letters("CASAS"), select(1), ...letters("OR"))
  assert.deepEqual(state.board[0], [..."CORAS"])
  assert.equal(state.currentCol, 3)
})

test("setas respeitam as bordas e permitem substituir a última casa", () => {
  let state = edit(createWordleInput(), ...letters("CASAS"))
  for (let i = 0; i < 8; i++) state = edit(state, { type: "move", direction: -1 })
  assert.equal(state.currentCol, 0)
  for (let i = 0; i < 8; i++) state = edit(state, { type: "move", direction: 1 })
  assert.equal(state.currentCol, 4)
  state = edit(state, ...letters("A"))
  assert.deepEqual(state.board[0], [..."CASAA"])
})

test("backspace apaga a casa ocupada ou recua quando ela está vazia", () => {
  let state = edit(createWordleInput(), ...letters("CASAS"), select(2), { type: "delete" })
  assert.deepEqual(state.board[0], ["C", "A", "", "A", "S"])
  assert.equal(state.currentCol, 2)
  state = edit(state, { type: "delete" }, ...letters("OR"))
  assert.deepEqual(state.board[0], [..."CORAS"])
})

test("apagar toda a linha mantém o cursor dentro do tabuleiro", () => {
  let state = edit(createWordleInput(), ...letters("AB"))
  for (let i = 0; i < 8; i++) state = edit(state, { type: "delete" })
  assert.deepEqual(state.board[0], Array(5).fill(""))
  assert.equal(state.currentCol, 0)
})

test("linhas enviadas e futuras não podem ser selecionadas", () => {
  const state = edit(createWordleInput(), ...letters("CASAS"), { type: "next-row" })
  assert.equal(edit(state, select(3, 0), select(2, 2)), state)
  const next = edit(state, select(2, 1), ...letters("AB"))
  assert.deepEqual(next.board[0], [..."CASAS"])
  assert.deepEqual(next.board[1], ["", "", "A", "B", ""])
})

test("restauração mantém a casa selecionada sem compartilhar a matriz salva", () => {
  const saved = edit(createWordleInput(), ...letters("CASAS"), select(1))
  const state = edit(createWordleInput(saved), ...letters("OR"))
  assert.deepEqual(state.board[0], [..."CORAS"])
  assert.deepEqual(saved.board[0], [..."CASAS"])
  assert.equal(saved.currentCol, 1)
})

test("limpar, mudar de tentativa e reiniciar reposicionam o cursor", () => {
  const filled = edit(createWordleInput(), ...letters("CASAS"))
  const cleared = edit(filled, { type: "clear" })
  assert.deepEqual(cleared.board[0], Array(5).fill(""))
  assert.equal(cleared.currentCol, 0)
  const next = edit(filled, { type: "next-row" })
  assert.equal(next.currentRow, 1)
  assert.equal(next.currentCol, 0)
  assert.deepEqual(edit(next, { type: "reset" }), createWordleInput())
  assert.deepEqual(filled.board[0], [..."CASAS"])
})

test("última tentativa, posições e entradas inválidas não ultrapassam os limites", () => {
  const state = { ...createWordleInput(), currentRow: 5 }
  assert.equal(edit(state, { type: "next-row" }), state)
  assert.equal(edit(state, select(-1, 5), select(5, 5), select(1.5, 5)), state)
  assert.equal(edit(state, { type: "move", direction: 2 }, ...letters("12")), state)
})
