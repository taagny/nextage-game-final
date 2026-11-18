import { readFile, readdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { execFileSync } from "node:child_process"
import { ESLint } from "eslint"

// Somente leitura de código/Git; não inicializa Firebase nem lê dados de usuários.
const baseline = "13601d6"
const eslint = new ESLint()
const complexity = new ESLint({ overrideConfig: { rules: { complexity: ["warn", 1] } } })
const normalize = (file) => file.replaceAll("\\", "/")
async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  return (
    await Promise.all(
      entries.map((entry) => {
        const file = `${dir}/${entry.name}`
        return entry.isDirectory() ? walk(file) : [file]
      })
    )
  )
    .flat()
    .sort()
}
const source = (await walk("src")).filter((file) => /\.(js|jsx)$/.test(file))
const results = await eslint.lintFiles(["."])
const byRule = {}
const warnings = []
for (const result of results)
  for (const message of result.messages) {
    const key = message.ruleId ?? "parser"
    byRule[key] ??= { errors: 0, warnings: 0 }
    byRule[key][message.severity === 2 ? "errors" : "warnings"]++
    if (message.severity === 1)
      warnings.push({
        file: normalize(path.relative(process.cwd(), result.filePath)),
        line: message.line,
        rule: key,
        message: message.message
      })
  }
async function measure(files, historic = false) {
  const functions = []
  const lines = []
  for (const file of files) {
    const text = historic
      ? execFileSync("git", ["show", `${baseline}:${file}`], { encoding: "utf8" })
      : await readFile(file, "utf8")
    const [result] = await complexity.lintText(text, { filePath: file })
    for (const message of result.messages.filter((message) => message.ruleId === "complexity")) {
      const value = Number(message.message.match(/complexity of (\d+)/)?.[1])
      functions.push({ file, line: message.line, value, message: message.message })
    }
    if (/src\/(components|pages)\/.*\.jsx$/.test(file))
      lines.push({ file, lines: text.trimEnd().split(/\r?\n/).length })
  }
  return {
    complexity: functions.sort((a, b) => b.value - a.value).slice(0, 10),
    largestComponents: lines.sort((a, b) => b.lines - a.lines).slice(0, 10)
  }
}
const oldFiles = execFileSync("git", ["ls-tree", "-r", "--name-only", baseline, "src"], {
  encoding: "utf8"
})
  .trim()
  .split(/\r?\n/)
  .filter((file) => /\.(js|jsx)$/.test(file))
const lock = JSON.parse(await readFile("package-lock.json", "utf8"))
const libraries = Object.fromEntries(
  Object.keys({ ...lock.packages[""].dependencies, ...lock.packages[""].devDependencies })
    .sort()
    .map((name) => [name, lock.packages[`node_modules/${name}`].version])
)
const layers = Object.fromEntries(
  ["components", "pages", "context", "hooks", "services", "utils", "styles"].map((layer) => [
    layer,
    []
  ])
)
for (const file of await walk("src")) {
  const layer = file.split("/")[1]
  if (layers[layer]) layers[layer].push(file)
}
async function interfaceImports(files, historic = false) {
  const found = []
  for (const file of files.filter((file) => /^src\/(components|pages|context)\//.test(file))) {
    const text = historic
      ? execFileSync("git", ["show", `${baseline}:${file}`], { encoding: "utf8" })
      : await readFile(file, "utf8")
    if (/from\s*["']firebase\/firestore(?:\/[^"']*)?["']/.test(text)) found.push(file)
  }
  return found
}
const metrics = {
  baselineCommit: baseline,
  baselineLint: {
    files: 32,
    errors: 14,
    warnings: 14,
    byRule: {
      "no-unused-vars": { errors: 9, warnings: 0 },
      "react-hooks/set-state-in-effect": { errors: 3, warnings: 0 },
      "no-empty": { errors: 1, warnings: 0 },
      "react-refresh/only-export-components": { errors: 1, warnings: 0 },
      "react-hooks/exhaustive-deps": { errors: 0, warnings: 14 }
    }
  },
  finalLint: {
    files: results.length,
    errors: results.reduce((n, r) => n + r.errorCount, 0),
    warnings: results.reduce((n, r) => n + r.warningCount, 0),
    byRule,
    warningsDetail: warnings
  },
  baseline: await measure(oldFiles, true),
  final: await measure(source),
  firestoreInterfaceImports: {
    baseline: await interfaceImports(oldFiles, true),
    final: await interfaceImports(source)
  },
  libraries,
  layers
}
await writeFile("docs/METRICAS_V2.json", `${JSON.stringify(metrics, null, 2)}\n`)
console.log(
  JSON.stringify(
    {
      lint: metrics.finalLint,
      baseline: metrics.baseline,
      final: metrics.final,
      imports: metrics.firestoreInterfaceImports,
      libraries
    },
    null,
    2
  )
)
