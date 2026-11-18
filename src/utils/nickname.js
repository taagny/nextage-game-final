import { NICKNAME_MIN, NICKNAME_MAX } from "./constants.js"

export function defaultNickname(displayName) {
  const firstName = String(displayName ?? "")
    .trim()
    .split(/\s+/)[0]
  const nickname = firstName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9_-]/g, "")
    .slice(0, NICKNAME_MAX)

  return nickname.length >= NICKNAME_MIN ? nickname : "Jogador"
}

export function validateNickname(nickname) {
  if (
    typeof nickname !== "string" ||
    nickname.length < NICKNAME_MIN ||
    nickname.length > NICKNAME_MAX
  ) {
    return `O apelido deve ter de ${NICKNAME_MIN} a ${NICKNAME_MAX} caracteres.`
  }
  if (!/^[A-Za-z0-9_-]+$/.test(nickname)) {
    return "Use apenas letras sem acento, números, _ e -."
  }
  return ""
}
