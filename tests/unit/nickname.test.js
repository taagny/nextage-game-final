import test from "node:test"
import assert from "node:assert/strict"
import { defaultNickname, validateNickname } from "../../src/utils/nickname.js"

test("apelido inicial usa somente o primeiro nome saneado", () => {
  assert.equal(defaultNickname("  João Silva  "), "Joao")
  assert.equal(defaultNickname("Ana-Maria Silva"), "Ana-Maria")
  assert.equal(defaultNickname("Lu_ca9 Outra"), "Lu_ca9")
  assert.equal(defaultNickname("<Ana> Silva"), "Ana")
})

test("apelido inicial respeita os limites e usa Jogador quando necessário", () => {
  for (const name of [null, undefined, "", "  ", "Li Silva", "😀 Silva"]) {
    assert.equal(defaultNickname(name), "Jogador")
  }
  assert.equal(defaultNickname("A".repeat(30)), "A".repeat(20))
})

test("validação aceita as bordas e os caracteres permitidos", () => {
  for (const nickname of ["Ab3", "A".repeat(20), "Ana-Maria_9"]) {
    assert.equal(validateNickname(nickname), "")
  }
})

test("validação rejeita tamanho inválido, espaços e outros caracteres", () => {
  for (const nickname of [
    null,
    123,
    "",
    "AB",
    "A".repeat(21),
    "Ana Maria",
    "João",
    "<Ana>",
    "Ana\n"
  ]) {
    assert.ok(validateNickname(nickname))
  }
})
