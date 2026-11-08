import test from "node:test"
import assert from "node:assert/strict"
import { compareWithFirst, buildWordFeedback } from "../../src/utils/wordFeedback.js"
import { nextWordDoc } from "../../src/utils/wordHistory.js"

const firstWin = { won: true, attempts: 3, timeMs: 1000 }

test("primeira vez não gera mensagem de comparação", () => {
  assert.equal(compareWithFirst(null, firstWin), null)
  assert.equal(buildWordFeedback(null), null)
  assert.equal(buildWordFeedback(nextWordDoc(null, firstWin, "1")), null)
  assert.equal(buildWordFeedback(nextWordDoc(null, { won: false, attempts: 6, timeMs: 2000 }, "1")), null)
})

test("menos tentativas é melhor mesmo demorando mais", () => {
  assert.equal(compareWithFirst(firstWin, { won: true, attempts: 2, timeMs: 60000 }), "melhor")
})

test("mais tentativas é pior mesmo sendo mais rápido", () => {
  assert.equal(compareWithFirst(firstWin, { won: true, attempts: 4, timeMs: 100 }), "pior")
})

for (const [timeMs, expected] of [[900, "melhor"], [1100, "pior"], [1000, "igual"]]) {
  test(`empate em tentativas entre vitórias: tempo ${timeMs} resulta em ${expected}`, () => {
    assert.equal(compareWithFirst(firstWin, { won: true, attempts: 3, timeMs }), expected)
  })
}

test("duas derrotas são iguais, sem comparar o tempo", () => {
  assert.equal(compareWithFirst({ won: false, attempts: 6, timeMs: 5000 }, { won: false, attempts: 6, timeMs: 100 }), "igual")
})

test("derrota primeiro e vitória depois é melhor; vitória seguida de derrota é pior", () => {
  assert.equal(compareWithFirst({ won: false, attempts: 6, timeMs: 1000 }, { won: true, attempts: 6, timeMs: 60000 }), "melhor")
  assert.equal(compareWithFirst(firstWin, { won: false, attempts: 6, timeMs: 100 }), "pior")
})

test("mensagem informa comparação e quantidade de aparições concluídas", () => {
  const first = nextWordDoc(null, firstWin, "1")
  const second = nextWordDoc(first, { won: true, attempts: 2, timeMs: 2000 }, "2")
  const feedback = buildWordFeedback(second)
  assert.equal(feedback.comparison, "melhor")
  assert.equal(feedback.occurrences, 2)
  assert.match(feedback.message, /melhor.*primeira vez/)
  assert.match(feedback.message, /2 vezes/)
})

test("terceira ocorrência continua comparando com a primeira, não com a última", () => {
  let word = nextWordDoc(null, firstWin, "1")
  word = nextWordDoc(word, { won: true, attempts: 1, timeMs: 500 }, "2")
  word = nextWordDoc(word, { won: true, attempts: 2, timeMs: 2000 }, "3")
  assert.equal(buildWordFeedback(word).comparison, "melhor")
  assert.equal(buildWordFeedback(word).occurrences, 3)
})
