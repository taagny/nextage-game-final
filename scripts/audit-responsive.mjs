import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { setTimeout as delay } from "node:timers/promises"
import { register } from "node:module"
import { initializeApp, deleteApp } from "firebase/app"
import { getAuth, connectAuthEmulator, signInWithEmailAndPassword, deleteUser } from "firebase/auth"
import {
  getFirestore,
  connectFirestoreEmulator,
  getDocs,
  collection,
  deleteDoc,
  doc
} from "firebase/firestore"
import { until, debuggerClient } from "../tests/browser/helpers.mjs"

function inspectViewport() {
  const overlay = [...document.querySelectorAll(".modal-overlay")].at(-1)
  const scope = overlay || document
  const rect = (element) => {
    const value = element.getBoundingClientRect()
    return {
      x: value.x,
      y: value.y,
      w: value.width,
      h: value.height,
      right: value.right,
      bottom: value.bottom
    }
  }
  const issues = []
  const selectors = overlay
    ? ".modal-card,.auth-card,.ranking-card-new,.profile-close,.ranking-close,.victory-close,.info-close"
    : ".logo,.header-left,.theme-toggle,.nav,.game-grid,.keyboard,.game-wrapper>h1,.game-wrapper>p,.user-dropdown"
  for (const element of scope.querySelectorAll(selectors)) {
    const bounds = rect(element)
    if (!bounds.w || !bounds.h) continue
    if (bounds.x < -1 || bounds.right > innerWidth + 1)
      issues.push({ type: "horizontal-cut", element: element.className, rect: bounds })
    if (overlay && (bounds.y < -1 || bounds.bottom > innerHeight + 1))
      issues.push({ type: "vertical-cut", element: element.className, rect: bounds })
    if (element.scrollWidth > element.clientWidth + 2)
      issues.push({
        type: "internal-overflow",
        element: element.className,
        width: element.scrollWidth,
        available: element.clientWidth
      })
    if (element.matches(".profile-close,.info-close") && Math.abs(bounds.w - bounds.h) > 2)
      issues.push({ type: "close-stretched", element: element.className, rect: bounds })
    if (element.matches(".profile-close,.ranking-close,.victory-close,.info-close")) {
      const top = document.elementFromPoint(bounds.x + bounds.w / 2, bounds.y + bounds.h / 2)
      if (!top || !element.contains(top))
        issues.push({ type: "close-obscured", element: element.className })
    }
  }
  if (!overlay) {
    const logo = rect(document.querySelector(".logo")),
      nav = rect(document.querySelector(".nav"))
    if (
      Math.min(logo.right, nav.right) - Math.max(logo.x, nav.x) > 1 &&
      Math.min(logo.bottom, nav.bottom) - Math.max(logo.y, nav.y) > 1
    )
      issues.push({ type: "header-overlap", logo, nav })
  }
  return {
    width: innerWidth,
    height: innerHeight,
    pageWidth: document.documentElement.scrollWidth,
    pageHeight: document.documentElement.scrollHeight,
    issues
  }
}

const label = process.argv[2] || "current"
if (!/^[a-z-]+$/.test(label)) throw new Error("Rótulo inválido.")
const theme = process.argv[3] || "dark"
assert.ok(["dark", "light"].includes(theme), "Tema inválido: use dark ou light.")
const directory = path.resolve(".firebase/responsiveness", label)
mkdirSync(directory, { recursive: true })
const profile = path.resolve(mkdtempSync(".firebase/responsive-browser-"))
const executable = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
].find(existsSync)
assert.ok(executable, "Chrome ou Edge necessário.")
const email = "responsive-" + Date.now() + "@example.invalid"
const password = "senha-local-ficticia-123"
const app = spawn(process.execPath, ["scripts/run-emulator-tests.mjs", "app"], {
  stdio: ["ignore", "pipe", "pipe", "ipc"],
  windowsHide: true,
  env: { ...process.env, VITE_CONTACT_EMAIL: "contato-fixture@example.invalid" }
})
let output = ""
for (const stream of [app.stdout, app.stderr])
  stream.on("data", (data) => {
    output = (output + data).slice(-15000)
  })
const exited = new Promise((resolve) => app.once("exit", resolve))
let browser,
  client,
  accountCreated = false
const measurements = []
const sizes = [
  [320, 568],
  [360, 640],
  [390, 844],
  [600, 800],
  [768, 1024],
  [844, 390],
  [1024, 768],
  [1440, 900]
]
try {
  await until(() => output.includes("http://127.0.0.1:5173/") || app.exitCode !== null, 90000)
  assert.equal(app.exitCode, null, output)
  browser = spawn(
    executable,
    [
      "--headless=new",
      "--no-first-run",
      "--no-default-browser-check",
      "--remote-debugging-port=0",
      "--user-data-dir=" + profile,
      "about:blank"
    ],
    { stdio: "ignore", windowsHide: true }
  )
  await until(() => existsSync(path.join(profile, "DevToolsActivePort")))
  const port = readFileSync(path.join(profile, "DevToolsActivePort"), "utf8").split(/\r?\n/)[0]
  const target = await (
    await fetch("http://127.0.0.1:" + port + "/json/new?about:blank", { method: "PUT" })
  ).json()
  client = debuggerClient(target.webSocketDebuggerUrl)
  const evaluate = async (expression) => {
    const response = await client.send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true
    })
    if (response.exceptionDetails) throw new Error(response.exceptionDetails.text)
    return response.result.value
  }
  const viewport = async (width, height) => {
    await client.send("Emulation.setDeviceMetricsOverride", {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: false
    })
    await evaluate("window.scrollTo(0,0)")
    await delay(500)
  }
  const click = (selector) =>
    evaluate("document.querySelector(" + JSON.stringify(selector) + ").click()")
  const measure = async (scene) => {
    for (const [width, height] of sizes) {
      await viewport(width, height)
      measurements.push({ scene, ...(await evaluate("(" + inspectViewport.toString() + ")()")) })
      if (
        [320, 844, 1440].includes(width) &&
        [
          "classic",
          "classic-authenticated",
          "profile",
          "settings",
          "login",
          "ranking",
          "result",
          "runner-playing"
        ].includes(scene)
      ) {
        const screenshot = await client.send("Page.captureScreenshot", {
          format: "png",
          captureBeyondViewport: false
        })
        writeFileSync(
          path.join(directory, scene + "-" + width + ".png"),
          Buffer.from(screenshot.data, "base64")
        )
      }
    }
    await viewport(1440, 900)
    console.log("Conferido: " + scene)
  }
  await client.send("Page.enable")
  await viewport(1440, 900)
  await client.send("Page.navigate", { url: "http://127.0.0.1:5173/" })
  await until(() => evaluate("document.querySelectorAll('.game-tile').length===30"))
  assert.equal(await evaluate("document.documentElement.dataset.theme"), "dark")
  const initialBoard = await evaluate("document.querySelector('.game-grid').textContent")
  await click(".theme-toggle")
  await until(() => evaluate("document.documentElement.dataset.theme === 'light'"))
  assert.equal(await evaluate("localStorage.getItem('nextage:theme')"), "light")
  assert.equal(await evaluate("document.querySelector('.game-grid').textContent"), initialBoard)
  const reloadMarker = await client.send("Page.addScriptToEvaluateOnNewDocument", {
    source: "window.__themeReloadReady = true"
  })
  await client.send("Page.reload")
  await until(() =>
    evaluate(
      "window.__themeReloadReady && !!document.querySelector('.theme-toggle') && document.querySelectorAll('.game-tile').length === 30"
    ).catch(() => false)
  )
  await client.send("Page.removeScriptToEvaluateOnNewDocument", {
    identifier: reloadMarker.identifier
  })
  assert.equal(await evaluate("document.documentElement.dataset.theme"), "light")
  // Enter no seletor não pode enviar a palavra para o jogo.
  for (const key of "CASAS") {
    await evaluate(
      "window.dispatchEvent(new KeyboardEvent('keydown',{key:" + JSON.stringify(key) + "}))"
    )
  }
  await delay(150)
  await client.send("Page.bringToFront")
  await evaluate("document.querySelector('.theme-toggle').focus()")
  await client.send("Input.dispatchKeyEvent", {
    type: "keyDown",
    key: "Enter",
    code: "Enter",
    windowsVirtualKeyCode: 13,
    text: "\r",
    unmodifiedText: "\r"
  })
  console.log(
    "Seletor por teclado:",
    await evaluate(
      "({theme:document.documentElement.dataset.theme,focused:document.activeElement.className})"
    )
  )
  await client.send("Input.dispatchKeyEvent", {
    type: "keyUp",
    key: "Enter",
    code: "Enter",
    windowsVirtualKeyCode: 13
  })
  await until(() => evaluate("document.documentElement.dataset.theme === 'dark'"))
  assert.equal(
    await evaluate(
      "document.querySelectorAll('.game-tile.tile-correct,.game-tile.tile-present,.game-tile.tile-absent').length"
    ),
    0
  )
  await evaluate("document.querySelector('.theme-toggle').blur()")
  for (let index = 0; index < 5; index++) {
    await evaluate("window.dispatchEvent(new KeyboardEvent('keydown',{key:'Backspace'}))")
  }
  // Armazenamento bloqueado não impede alternar o tema na sessão atual.
  await evaluate(`(() => {
    const original = Storage.prototype.setItem
    Storage.prototype.setItem = function(key, value) {
      if (key === 'nextage:theme') throw new DOMException('Bloqueado', 'SecurityError')
      return original.call(this, key, value)
    }
    try { document.querySelector('.theme-toggle').click() }
    finally { Storage.prototype.setItem = original }
  })()`)
  await until(() => evaluate("document.documentElement.dataset.theme === 'light'"))
  await click(".theme-toggle")
  if (theme === "light") await click(".theme-toggle")
  await until(() => evaluate("document.documentElement.dataset.theme === " + JSON.stringify(theme)))
  // Aviso injetado pelo SDK só existe nos emuladores, não no site publicado.
  await evaluate("document.querySelector('.firebase-emulator-warning')?.remove()")
  await measure("classic")
  await click(".header-left .icon-btn")
  await until(() => evaluate("!!document.querySelector('.ranking-card-new')"))
  await measure("ranking")
  await click(".ranking-close")
  await click(".info-btn")
  await until(() => evaluate("!!document.querySelector('.info-card')"))
  await measure("info")
  await click(".info-close")
  await evaluate(
    "[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Login').click()"
  )
  await measure("login")
  await click(".auth-card .switch")
  await measure("signup")
  await evaluate(
    "(() => {const values=" +
      JSON.stringify({
        Nome: "Participante",
        Email: email,
        Senha: password,
        "Confirmar senha": password
      }) +
      "; for(const e of document.querySelectorAll('.auth-card input')) {Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,values[e.placeholder]);e.dispatchEvent(new Event('input',{bubbles:true}));}})()"
  )
  await until(() => evaluate("!document.querySelector('.auth-card button[type=submit]').disabled"))
  await click(".auth-card button[type=submit]")
  await until(() => evaluate("!!document.querySelector('.terms-modal')"))
  accountCreated = true
  await measure("terms")
  await click(".terms-btn.accept")
  await until(() =>
    evaluate("!document.querySelector('.terms-modal') && !!document.querySelector('.user-btn')")
  )
  // Histórico fictício preenchido pelos serviços reais, somente no emulador.
  process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099"
  process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080"
  register("../tests/integration/service-loader.mjs", import.meta.url)
  const authentication = await import("../src/services/authService.js")
  const players = await import("../src/services/playerService.js")
  const runtime = await import("../tests/integration/firebase.mjs")
  try {
    const { user } = await authentication.loginWithPassword(email, password)
    for (let index = 0; index < 6; index++) {
      await players.registerWin(user.uid, {
        word: ["OPACA", "CASAS", "TERMO"][index % 3],
        attempts: index + 1,
        timeMs: (index + 1) * 2000,
        matchId: "responsive-seed-" + index
      })
    }
    await players.saveRunnerRecord(user.uid, "10", 3)
  } finally {
    await deleteApp(runtime.app)
  }
  const openSettings = async () => {
    await click(".user-btn")
    await evaluate(
      "[...document.querySelectorAll('.user-dropdown button')].find(b=>b.textContent.includes('Configura')).click()"
    )
    await until(() => evaluate("!!document.querySelector('.profile-modal')"))
  }
  await openSettings()
  await evaluate(
    "[...document.querySelectorAll('.profile-tabs button')].find(b=>b.textContent.includes('Configura')).click()"
  )
  await until(() => evaluate("!document.querySelector('#nickname-input').disabled"))
  await evaluate(
    "(() => {const e=document.querySelector('#nickname-input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'ParticipanteXXXXXXXX');e.dispatchEvent(new Event('input',{bubbles:true}));})()"
  )
  await until(() => evaluate("!document.querySelector('.settings-actions .green').disabled"))
  await click(".settings-actions .green")
  await until(() => evaluate("!document.querySelector('.profile-modal')"))
  await measure("classic-authenticated")
  await click(".header-left .icon-btn")
  await until(() => evaluate("!!document.querySelector('.ranking-row-self')"))
  await measure("ranking-populated")
  await click(".ranking-close")
  await click(".user-btn")
  await measure("user-menu")
  await click(".user-btn")
  await openSettings()
  for (const [tab, scene] of [
    ["Perfil", "profile"],
    ["Evolução", "evolution"],
    ["Palavras", "words"],
    ["Configurações", "settings"]
  ]) {
    await evaluate(
      "[...document.querySelectorAll('.profile-tabs button')].find(b=>b.textContent.trim()===" +
        JSON.stringify(tab) +
        ").click()"
    )
    await measure(scene)
  }
  await click(".profile-close")
  const secret = await evaluate(
    "JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k=>k.startsWith('nextage:classic:')&&k.includes(':user:')))).secret"
  )
  const guess = secret === "CASAS" ? "TERMO" : "CASAS"
  for (let row = 0; row < 6; row++) {
    for (const key of [...guess, "Enter"]) {
      await evaluate(
        "window.dispatchEvent(new KeyboardEvent('keydown',{key:" + JSON.stringify(key) + "}))"
      )
      await delay(30)
    }
  }
  await until(() => evaluate("!!document.querySelector('.streak-modal')"))
  await measure("result")
  await click(".victory-close")
  await click("a[href='/runner']")
  await until(() => evaluate("!!document.querySelector('.runner-options-vertical')"))
  await measure("runner-select")
  await evaluate(
    "[...document.querySelectorAll('.runner-options-vertical button')].find(b=>b.textContent==='10s').click()"
  )
  await until(
    () =>
      evaluate(
        "document.querySelectorAll('.game-tile').length===30 && !!document.querySelector('.runner-stats')"
      ),
    15000
  )
  await measure("runner-playing")
  await until(() => evaluate("!!document.querySelector('.runner-result-card')"), 15000)
  await measure("runner-result")
  writeFileSync(
    path.join(directory, "measurements.json"),
    JSON.stringify(measurements, null, 2) + "\n"
  )
  const affected = measurements.filter((item) => item.issues.length)
  console.log(
    JSON.stringify(
      {
        directory,
        theme,
        cases: measurements.length,
        affected: affected.map((item) => ({
          scene: item.scene,
          size: item.width + "x" + item.height,
          issues: item.issues.map((issue) => issue.type)
        }))
      },
      null,
      2
    )
  )
  if (label !== "baseline" && affected.length) process.exitCode = 1
} finally {
  if (client) {
    client.send("Browser.close").catch(() => {})
    await delay(500)
    client.close()
  }
  if (browser?.exitCode === null) browser.kill()
  try {
    if (accountCreated) {
      const fixture = initializeApp(
        { projectId: "demo-nextage-v2", apiKey: "fake-api-key", authDomain: "localhost" },
        "responsive-cleanup"
      )
      try {
        const auth = getAuth(fixture),
          db = getFirestore(fixture)
        connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true })
        connectFirestoreEmulator(db, "127.0.0.1", 8080)
        const { user } = await signInWithEmailAndPassword(auth, email, password)
        for (const name of ["partidas", "palavras"]) {
          const rows = await getDocs(collection(db, "jogadores", user.uid, name))
          await Promise.all(rows.docs.map((row) => deleteDoc(row.ref)))
        }
        await deleteDoc(doc(db, "jogadores", user.uid))
        await deleteDoc(doc(db, "perfisPublicos", user.uid))
        await deleteUser(user)
      } finally {
        await deleteApp(fixture)
      }
    }
  } finally {
    if (app.connected) app.send({ type: "nextage:shutdown" })
    assert.equal(await Promise.race([exited, delay(60000, "timeout", { ref: false })]), 0, output)
  }
}
