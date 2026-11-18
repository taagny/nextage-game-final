import fs from "fs"

const INPUT_PATH = "./scripts/raw-words.txt"
const OUTPUT_PATH = "./public/dictionary.json"

const FORMAT_MODE = "minified"

// ✅ Remove acento
function normalizeWord(word) {
  return word
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
}

function formatInBlocks(arr, blockSize = 12) {
  let result = "[\n"
  for (let i = 0; i < arr.length; i += blockSize) {
    const block = arr.slice(i, i + blockSize)
    result += "  " + block.map((w) => `"${w}"`).join(", ") + ",\n"
  }
  result += "]"
  return result
}

const rawText = fs.readFileSync(INPUT_PATH, "utf-8")

const words = rawText
  .split("\n")
  .map((line) => line.trim())
  .filter((line) => line.length > 0)
  .map((line) => line.split(/\s+/)[0])
  .map(normalizeWord)
  .filter((word) => /^[A-Z]{5}$/.test(word))

const uniqueWords = [...new Set(words)]

uniqueWords.sort()

if (FORMAT_MODE === "minified") {
  fs.writeFileSync(OUTPUT_PATH, formatInBlocks(uniqueWords))
} else {
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(uniqueWords))
}

console.log(`✅ Dictionary gerado com ${uniqueWords.length} palavras`)
console.log(`📦 Modo: ${FORMAT_MODE}`)
