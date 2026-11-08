const PARTICIPANT_PREFIX = "P_"

export async function pseudonymizeUid(uid) {
  if (typeof uid !== "string" || !uid) {
    throw new TypeError("UID obrigatório para gerar o código de pesquisa.")
  }
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(uid))
  const hex = Array.from(new Uint8Array(digest), byte =>
    byte.toString(16).padStart(2, "0")
  ).join("")
  return `${PARTICIPANT_PREFIX}${hex.slice(0, 8)}`
}
