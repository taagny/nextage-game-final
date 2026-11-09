import { test } from "node:test"
import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { existsSync, mkdirSync, mkdtempSync, readFileSync } from "node:fs"
import path from "node:path"
import { setTimeout as delay } from "node:timers/promises"
import { initializeApp, deleteApp } from "firebase/app"
import { connectAuthEmulator, getAuth, signInWithEmailAndPassword, deleteUser } from "firebase/auth"
import { connectFirestoreEmulator, getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore"

async function until(check, timeout = 30000) {
  const end = Date.now() + timeout
  while (Date.now() < end) {
    if (await check()) return
    await delay(100)
  }
  throw new Error("Tempo esgotado aguardando o navegador/aplicativo.")
}

function debuggerClient(url) {
  const socket = new WebSocket(url)
  const pending = new Map()
  let sequence = 0
  const opened = new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true })
    socket.addEventListener("error", reject, { once: true })
  })
  socket.addEventListener("message", event => {
    const response = JSON.parse(event.data)
    const promise = pending.get(response.id)
    if (!promise) return
    pending.delete(response.id)
    if (response.error) promise.reject(new Error(JSON.stringify(response.error)))
    else promise.resolve(response.result)
  })
  return {
    async send(method, params = {}) {
      await opened
      const id = ++sequence
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject })
        socket.send(JSON.stringify({ id, method, params }))
      })
    },
    close: () => socket.close()
  }
}

test("Chrome retoma visitante/conta, preserva vitória/derrota e não duplica sequência após recarga", { timeout: 180000 }, async () => {
  const chrome = ["C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"].find(existsSync)
  assert.ok(chrome, "Chrome ou Edge necessário para este teste de navegador.")
  mkdirSync(".firebase", { recursive: true })
  const profile = path.resolve(mkdtempSync(".firebase/browser-session-"))
  let output = ""
  const app = spawn(process.execPath, ["scripts/run-emulator-tests.mjs", "app"], {
    stdio: ["ignore", "pipe", "pipe", "ipc"], windowsHide: true,
    env: { ...process.env, VITE_CONTACT_EMAIL: "contato-fixture@example.invalid" }
  })
  const collect = chunk => { output = (output + chunk.toString()).slice(-15000) }
  app.stdout.on("data", collect)
  app.stderr.on("data", collect)
  const appExit = new Promise(resolve => app.once("exit", resolve))
  let browser
  let client
  let accountCreated = false
  const email = "recarga-" + Date.now() + "@example.invalid"
  const password = "senha-local-ficticia-123"
  try {
    await until(() => output.includes("http://127.0.0.1:5173/") || app.exitCode !== null, 90000)
    assert.equal(app.exitCode, null, output)
    browser = spawn(chrome, ["--headless=new", "--no-first-run", "--no-default-browser-check",
      "--remote-debugging-port=0", `--user-data-dir=${profile}`, "about:blank"], {
      stdio: "ignore", windowsHide: true
    })
    await until(() => existsSync(path.join(profile, "DevToolsActivePort")))
    const port = readFileSync(path.join(profile, "DevToolsActivePort"), "utf8").split(/\r?\n/)[0]
    const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" })).json()
    client = debuggerClient(target.webSocketDebuggerUrl)
    const evaluate = async expression => {
      const result = await client.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })
      if (result.exceptionDetails) throw new Error(result.exceptionDetails.text)
      return result.result.value
    }
    let storageKey = "nextage:classic:v1:demo-nextage-v2:guest"
    const snapshot = () => evaluate("JSON.parse(localStorage.getItem(" + JSON.stringify(storageKey) + "))")
    const ready = async () => {
      await until(() => evaluate("document.querySelectorAll('.game-tile').length === 30 && !!localStorage.getItem('nextage:classic:v1:demo-nextage-v2:guest')"))
      await until(() => evaluate("performance.getEntriesByType('resource').some(e => e.name.endsWith('/dictionary.json') && e.responseEnd > 0)"))
    }
    const key = async value => {
      await evaluate(`window.dispatchEvent(new KeyboardEvent('keydown', {key:${JSON.stringify(value)}}))`)
      await delay(40)
    }
    const type = async word => { for (const letter of word) await key(letter) }
    const reload = async () => { await client.send("Page.reload", { ignoreCache: true }); await delay(300); await ready() }
    await client.send("Page.enable")
    await client.send("Page.navigate", { url: "http://127.0.0.1:5173/" })
    await ready()
    const initial = await snapshot()
    const wrong = initial.secret === "CASAS" ? "TERMO" : "CASAS"
    await type(wrong)
    await key("Enter")
    await until(async () => (await snapshot()).game.currentRow === 1)
    await type("AB")
    const before = await snapshot()
    await reload()
    assert.deepEqual(await snapshot(), before)
    assert.equal(await evaluate("[...document.querySelectorAll('.game-tile')].slice(0,7).map(e=>e.textContent).join('')"), wrong + "AB")
    await key("Backspace")
    await key("Backspace")
    await type(initial.secret)
    await key("Enter")
    await until(async () => (await snapshot()).game.isGameOver)
    const won = await snapshot()
    await reload()
    assert.equal((await snapshot()).matchId, initial.matchId)
    assert.equal((await snapshot()).finishedAt, won.finishedAt)
    assert.ok(await evaluate("document.body.textContent.includes('PARABÉNS!')"))
    await evaluate("[...document.querySelectorAll('button')].find(e=>e.textContent.includes('Novo Jogo')).click()")
    await until(async () => (await snapshot()).matchId !== initial.matchId)
    const next = await snapshot()
    const losingGuess = next.secret === "CASAS" ? "TERMO" : "CASAS"
    for (let row = 0; row < 6; row++) {
      await type(losingGuess)
      await key("Enter")
    }
    await until(async () => (await snapshot()).game.isGameOver)
    await reload()
    assert.equal((await snapshot()).matchId, next.matchId)
    assert.equal((await snapshot()).game.currentRow, 5)
    assert.ok(await evaluate("document.body.textContent.includes('FIM DE JOGO!')"))

    // Conta fictícia real no emulador: restauração por UID e reenvio de resultado.
    await evaluate("document.querySelector('.victory-close').click(); [...document.querySelectorAll('button')].find(e=>e.textContent.trim()==='Login').click()")
    await until(() => evaluate("!!document.querySelector('.auth-card .switch')"))
    await evaluate("document.querySelector('.auth-card .switch').click()")
    await until(() => evaluate("document.querySelectorAll('.auth-card input').length === 4"))
    await evaluate("(() => {const values=" + JSON.stringify({ Nome: "Jogador", Email: email, Senha: password, "Confirmar senha": password }) + "; for(const input of document.querySelectorAll('.auth-card input')) { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,values[input.placeholder]); input.dispatchEvent(new Event('input',{bubbles:true})); }})()")
    await until(() => evaluate("!document.querySelector('.auth-card button[type=submit]').disabled"))
    await evaluate("document.querySelector('.auth-card button[type=submit]').click()")
    await until(() => evaluate("!!document.querySelector('.terms-btn.accept')"))
    accountCreated = true
    await evaluate("document.querySelector('.terms-btn.accept').click()")
    await until(() => evaluate("!document.querySelector('.terms-modal')"))
    storageKey = await evaluate("Object.keys(localStorage).find(k=>k.startsWith('nextage:classic:v1:demo-nextage-v2:user:'))")
    assert.ok(storageKey)
    const owned = await snapshot()
    const ownedWrong = owned.secret === "CASAS" ? "TERMO" : "CASAS"
    await type(ownedWrong)
    await key("Enter")
    await until(async () => (await snapshot()).game.currentRow === 1)
    await type("AB")
    const ownedBefore = await snapshot()
    await reload()
    assert.deepEqual(await snapshot(), ownedBefore)
    await key("Backspace")
    await key("Backspace")
    await type(owned.secret)
    await key("Enter")
    await until(async () => (await snapshot()).game.isGameOver && (await snapshot()).recorded)
    // Simula servidor confirmado, mas último checkpoint local sem confirmação.
    await evaluate("(() => { const k=" + JSON.stringify(storageKey) + "; const r=JSON.parse(localStorage.getItem(k)); r.recorded=false; localStorage.setItem(k,JSON.stringify(r)); })()")
    await reload()
    await until(async () => (await snapshot()).recorded)
    assert.equal((await snapshot()).matchId, owned.matchId)
    await evaluate("document.querySelector('.victory-close').click(); document.querySelector('.header-left .icon-btn').click()")
    await until(() => evaluate("!!document.querySelector('.ranking-row-self .highlight-blue')"))
    assert.equal(await evaluate("document.querySelector('.ranking-row-self .highlight-blue').textContent.trim()"), "1")
    await evaluate("document.querySelector('.ranking-close').click()")
    await key("Enter")
    await until(async () => (await snapshot()).matchId !== owned.matchId)
    assert.equal((await snapshot()).game.streak, 1)
  } finally {
    if (client) {
      client.send("Browser.close").catch(() => {})
      await delay(500)
      client.close()
    }
    if (browser?.exitCode === null) browser.kill()
    if (accountCreated) {
      const fixture = initializeApp({ projectId: "demo-nextage-v2", apiKey: "fake-api-key", authDomain: "localhost" }, "browser-cleanup")
      try {
        const auth = getAuth(fixture)
        const db = getFirestore(fixture)
        connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true })
        connectFirestoreEmulator(db, "127.0.0.1", 8080)
        const { user } = await signInWithEmailAndPassword(auth, email, password)
        for (const name of ["partidas", "palavras"]) {
          const rows = await getDocs(collection(db, "jogadores", user.uid, name))
          await Promise.all(rows.docs.map(row => deleteDoc(row.ref)))
        }
        await deleteDoc(doc(db, "jogadores", user.uid))
        await deleteDoc(doc(db, "perfisPublicos", user.uid))
        await deleteUser(user)
      } finally { await deleteApp(fixture) }
    }
    if (app.connected) app.send({ type: "nextage:shutdown" })
    assert.equal(await Promise.race([appExit, delay(60000, "timeout", { ref: false })]), 0, output)
  }
})
