import { existsSync } from "node:fs"
import { fileURLToPath } from "node:url"

// Redireciona somente a conexão; todos os serviços e SDKs são os reais.
// Suporta os imports sem extensão usados pelo Vite no código do aplicativo.
export function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith(".") && context.parentURL?.startsWith("file:")) {
    const url = new URL(specifier, context.parentURL)
    if (/\/src\/services\/firebase(?:\.js)?$/.test(url.pathname)) {
      return { url: new URL("./firebase.mjs", import.meta.url).href, shortCircuit: true }
    }
    if (!/\.[a-z]+$/i.test(url.pathname) && existsSync(fileURLToPath(url) + ".js")) {
      return nextResolve(url.href + ".js", context)
    }
  }
  return nextResolve(specifier, context)
}

// O Vite injeta import.meta.env no navegador; a suíte usa configuração fictícia.
export async function load(url, context, nextLoad) {
  const result = await nextLoad(url, context)
  if (url.endsWith("/src/utils/constants.js")) {
    return {
      ...result,
      source: result.source
        .toString()
        .replaceAll("import.meta.env", '({ VITE_EXCLUDED_FROM_RESEARCH_UIDS: "excluded-fixture" })')
    }
  }
  return result
}
