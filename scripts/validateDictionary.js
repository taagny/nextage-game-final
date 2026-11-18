import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const answersPath = path.resolve(__dirname, "../src/utils/answers.js")
const dictionaryPath = path.resolve(__dirname, "../public/dictionary.json")

const answersFile = fs.readFileSync(answersPath, "utf-8")
const dictionaryFile = fs.readFileSync(dictionaryPath, "utf-8")

const answersMatch = answersFile.match(/'([^']+)'|"([^"]+)"/g)

const answers = answersMatch
  .map((w) => w.replace(/['"]/g, ""))
  .map((w) =>
    w
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase()
  )

const dictionary = new Set(JSON.parse(dictionaryFile))

const missing = answers.filter((word) => !dictionary.has(word))

if (missing.length === 0) {
  console.log("✅ Todas as palavras de answers estão no dictionary.")
} else {
  console.log("❌ Palavras faltando no dictionary:")
  missing.forEach((w) => console.log(w))
  console.log(`\nTotal faltando: ${missing.length}`)
}
