import test from "node:test"
import assert from "node:assert/strict"
import { nextWordDoc } from "../../src/utils/wordHistory.js"

test("primeira vitória cria o documento completo da palavra", () => {
  assert.deepEqual(nextWordDoc(null, { won: true, attempts: 3, timeMs: 1000 }, "primeira"), {
    vezesVista: 1,
    vitorias: 1,
    totalTentativas: 3,
    mediaTentativas: 3,
    primeiraVenceu: true,
    primeiraTentativas: 3,
    primeiraTempoMs: 1000,
    melhorTentativas: 3,
    melhorTempoMs: 1000,
    ultimaVenceu: true,
    ultimaTentativas: 3,
    ultimaTempoMs: 1000,
    atualizadoEm: "primeira"
  })
})

test("primeira derrota usa 7 tentativas na média sem alterar o resultado recebido", () => {
  const result = { won: false, attempts: 6, timeMs: 9000 }
  const word = nextWordDoc(null, result, "primeira")
  assert.equal(word.primeiraVenceu, false)
  assert.equal(word.vitorias, 0)
  assert.equal(word.primeiraTentativas, 7)
  assert.equal(word.ultimaTentativas, 7)
  assert.equal(word.mediaTentativas, 7)
  assert.equal(result.attempts, 6)
})

test("vitória depois de derrota melhora o recorde e mantém a primeira ocorrência", () => {
  const first = Object.freeze(
    nextWordDoc(null, { won: false, attempts: 6, timeMs: 9000 }, "primeira")
  )
  const next = nextWordDoc(first, { won: true, attempts: 3, timeMs: 2000 }, "segunda")
  assert.equal(next.vezesVista, 2)
  assert.equal(next.vitorias, 1)
  assert.equal(next.totalTentativas, 10)
  assert.equal(next.mediaTentativas, 5)
  assert.equal(next.primeiraVenceu, false)
  assert.equal(next.primeiraTentativas, 7)
  assert.equal(next.primeiraTempoMs, 9000)
  assert.equal(next.melhorTentativas, 3)
  assert.equal(next.melhorTempoMs, 2000)
  assert.equal(first.vezesVista, 1)
})

test("melhor resultado prioriza tentativas e depois tempo, sem piorar com novas partidas", () => {
  let word = nextWordDoc(null, { won: true, attempts: 6, timeMs: 10000 }, "1")
  for (const [attempts, timeMs] of [
    [2, 5000],
    [2, 3000],
    [3, 1000]
  ]) {
    word = nextWordDoc(word, { won: true, attempts, timeMs }, "depois")
  }
  word = nextWordDoc(word, { won: false, attempts: 6, timeMs: 500 }, "última")
  assert.equal(word.vezesVista, 5)
  assert.equal(word.vitorias, 4)
  assert.equal(word.totalTentativas, 20)
  assert.equal(word.mediaTentativas, 4)
  assert.equal(word.melhorTentativas, 2)
  assert.equal(word.melhorTempoMs, 3000)
  assert.equal(word.primeiraTentativas, 6)
  assert.equal(word.primeiraTempoMs, 10000)
  assert.equal(word.ultimaVenceu, false)
  assert.equal(word.ultimaTentativas, 7)
})

test("duas derrotas mantêm o primeiro tempo como recorde sem desempate por tempo", () => {
  const first = nextWordDoc(null, { won: false, attempts: 6, timeMs: 9000 }, "1")
  const second = nextWordDoc(first, { won: false, attempts: 6, timeMs: 1000 }, "2")
  assert.equal(second.melhorTentativas, 7)
  assert.equal(second.melhorTempoMs, 9000)
  assert.equal(second.mediaTentativas, 7)
})

test("tempo zero da primeira ocorrência é preservado e campos extras não são copiados", () => {
  const first = {
    ...nextWordDoc(null, { won: true, attempts: 1, timeMs: 0 }, "1"),
    extra: "fixture"
  }
  const second = nextWordDoc(first, { won: true, attempts: 2, timeMs: 100 }, "2")
  assert.equal(second.primeiraTempoMs, 0)
  assert.equal(second.melhorTempoMs, 0)
  assert.equal(Object.hasOwn(second, "extra"), false)
})

test("histórico rejeita abandonos, vitórias inválidas e tempos fora dos limites", () => {
  for (const result of [
    { won: false, abandoned: true, attempts: 0, timeMs: 0 },
    { won: true, attempts: 0, timeMs: 0 },
    { won: true, attempts: 7, timeMs: 0 },
    { won: true, attempts: 2.5, timeMs: 0 },
    { won: true, attempts: 2, timeMs: -1 },
    { won: false, attempts: 6, timeMs: 86400001 },
    { won: true, attempts: 2, timeMs: 0.5 }
  ])
    assert.throws(() => nextWordDoc(null, result, "agora"), /Resultado inválido/)
})
