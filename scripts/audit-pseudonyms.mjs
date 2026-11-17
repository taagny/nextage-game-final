import fs from "node:fs"
import path from "node:path"
import crypto from "node:crypto"
import { createResearchKeyFile, openResearchKeyFile, pseudonymizeUid } from "../src/utils/pseudonym.js"

// Experimento offline: somente identificadores fictícios, sem Firebase ou dados reais.
const candidates = ["fixture-a", "fixture-b", "fixture-c"]
const oldCode = uid => "P_" + crypto.createHash("sha256").update(uid).digest("hex").slice(0, 8)
const keyFile = createResearchKeyFile()
const key = await openResearchKeyFile(JSON.stringify(keyFile))
const reopened = await openResearchKeyFile(JSON.stringify(keyFile))
const wrong = await openResearchKeyFile(JSON.stringify(createResearchKeyFile()))
const oldDataset = new Set(candidates.map(oldCode))
const dataset = new Set(await Promise.all(candidates.map(uid => pseudonymizeUid(uid, key))))
const hashes = candidates.map(uid => "P_" + crypto.createHash("sha256").update(uid).digest("hex"))
const wrongCodes = await Promise.all(candidates.map(uid => pseudonymizeUid(uid, wrong)))
const rightCodes = await Promise.all(candidates.map(uid => pseudonymizeUid(uid, reopened)))
let rejectsMissingKey = false
try { await pseudonymizeUid(candidates[0]) } catch { rejectsMissingKey = true }
const report = {
  date: new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date()),
  recordedAtUTC: new Date().toISOString(), timeZone: "America/Sao_Paulo", scope: "três UIDs candidatos fictícios; nenhum acesso remoto",
  participants: candidates.length, algorithm: "HMAC-SHA-256", domain: "NEXTAGE:research:v1:", keyBits: 256, outputHexCharacters: 64,
  legacyPublicHashLinks: candidates.map(oldCode).filter(code => oldDataset.has(code)).length,
  currentPublicHashLinks: hashes.filter(code => dataset.has(code)).length,
  wrongKeyLinks: wrongCodes.filter(code => dataset.has(code)).length,
  reopenedCorrectKeyLinks: rightCodes.filter(code => dataset.has(code)).length,
  rejectsMissingKey, cryptoKeyExtractable: key.cryptoKey.extractable,
  privateKeyIncluded: false,
  interpretation: "O ataque de recalcular hashes públicos ou usar outra chave não reproduziu os pseudônimos HMAC da amostra. Quem possui a chave correta os reproduz. Este experimento não demonstra anonimato nem exclui associação por metadados."
}
if (report.legacyPublicHashLinks !== 3 || report.currentPublicHashLinks || report.wrongKeyLinks || report.reopenedCorrectKeyLinks !== 3 || !rejectsMissingKey) throw new Error("Resultado inesperado na demonstração.")
const output = path.resolve(process.argv[2] || ".firebase/review-v11/HMAC_EXPERIMENTO.json")
fs.mkdirSync(path.dirname(output), { recursive: true })
fs.writeFileSync(output, JSON.stringify(report, null, 2) + "\n")
console.log(JSON.stringify(report, null, 2))
