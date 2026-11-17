const FORMAT = "nextage-research-key"
const DOMAIN = "NEXTAGE:research:v1:"

function hex(bytes) {
  return Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("")
}

// Gerada somente por ação do administrador. Nunca vai para env, banco ou bundle.
export function createResearchKeyFile() {
  return { format: FORMAT, version: 1, secret: hex(crypto.getRandomValues(new Uint8Array(32))) }
}

export async function openResearchKeyFile(text) {
  if (typeof text !== "string" || text.length > 4096) throw new Error("Arquivo de chave inválido.")
  let data
  try { data = JSON.parse(text) } catch { throw new Error("Arquivo de chave inválido.") }
  if (!data || Array.isArray(data) || Object.keys(data).sort().join(",") !== "format,secret,version" ||
      data.format !== FORMAT || data.version !== 1 || !/^[a-f0-9]{64}$/.test(data.secret)) {
    throw new Error("Selecione uma chave de pesquisa do NEXTAGE com 256 bits.")
  }
  const bytes = Uint8Array.from(data.secret.match(/../g), byte => parseInt(byte, 16))
  const cryptoKey = await crypto.subtle.importKey("raw", bytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"])
  const fingerprint = hex(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))).slice(0, 16)
  bytes.fill(0)
  return Object.freeze({ id: fingerprint, cryptoKey })
}

export async function pseudonymizeUid(uid, key) {
  if (typeof uid !== "string" || !uid) throw new TypeError("UID obrigatório para gerar o código de pesquisa.")
  if (!key?.cryptoKey || key.cryptoKey.algorithm?.name !== "HMAC" ||
      key.cryptoKey.algorithm?.hash?.name !== "SHA-256" || key.cryptoKey.extractable ||
      !/^[a-f0-9]{16}$/.test(key.id)) {
    throw new TypeError("Abra sua chave de pesquisa antes de gerar os dados.")
  }
  const signature = await crypto.subtle.sign("HMAC", key.cryptoKey, new TextEncoder().encode(DOMAIN + uid))
  return `P_${hex(new Uint8Array(signature))}`
}
