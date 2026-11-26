import { test } from "node:test"
import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { existsSync, mkdirSync, mkdtempSync, readFileSync } from "node:fs"
import path from "node:path"
import { setTimeout as delay } from "node:timers/promises"
import { initializeApp, deleteApp } from "firebase/app"
import { connectAuthEmulator, getAuth, signInWithEmailAndPassword, deleteUser } from "firebase/auth"
import {
  connectFirestoreEmulator,
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  doc
} from "firebase/firestore"
import {
  initializeApp as initializeAdminApp,
  deleteApp as deleteAdminApp
} from "firebase-admin/app"
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore"
import { getAuth as getAdminAuth } from "firebase-admin/auth"

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
  socket.addEventListener("message", (event) => {
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

test(
  "Chrome edita casas com clique/setas, retoma partidas e preserva resultados sem duplicação",
  { timeout: 180000 },
  async () => {
    const chrome = [
      "C:/Program Files/Google/Chrome/Application/chrome.exe",
      "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
    ].find(existsSync)
    assert.ok(chrome, "Chrome ou Edge necessário para este teste de navegador.")
    mkdirSync(".firebase", { recursive: true })
    const profile = path.resolve(mkdtempSync(".firebase/browser-session-"))
    let output = ""
    const app = spawn(process.execPath, ["scripts/run-emulator-tests.mjs", "app"], {
      stdio: ["ignore", "pipe", "pipe", "ipc"],
      windowsHide: true,
      env: { ...process.env, VITE_CONTACT_EMAIL: "contato-fixture@example.invalid" }
    })
    const collect = (chunk) => {
      output = (output + chunk.toString()).slice(-15000)
    }
    app.stdout.on("data", collect)
    app.stderr.on("data", collect)
    const appExit = new Promise((resolve) => app.once("exit", resolve))
    let browser
    let client
    let accountCreated = false
    const email = "recarga-" + Date.now() + "@example.invalid"
    const password = "senha-local-ficticia-123"
    try {
      await until(() => output.includes("http://127.0.0.1:5173/") || app.exitCode !== null, 90000)
      assert.equal(app.exitCode, null, output)
      browser = spawn(
        chrome,
        [
          "--headless=new",
          "--no-first-run",
          "--no-default-browser-check",
          "--remote-debugging-port=0",
          `--user-data-dir=${profile}`,
          "about:blank"
        ],
        {
          stdio: "ignore",
          windowsHide: true
        }
      )
      await until(() => existsSync(path.join(profile, "DevToolsActivePort")))
      const port = readFileSync(path.join(profile, "DevToolsActivePort"), "utf8").split(/\r?\n/)[0]
      const target = await (
        await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" })
      ).json()
      client = debuggerClient(target.webSocketDebuggerUrl)
      const evaluate = async (expression) => {
        const result = await client.send("Runtime.evaluate", {
          expression,
          returnByValue: true,
          awaitPromise: true
        })
        if (result.exceptionDetails) throw new Error(result.exceptionDetails.text)
        return result.result.value
      }
      let storageKey = "nextage:classic:v1:demo-nextage-v2:guest"
      const snapshot = () =>
        evaluate("JSON.parse(localStorage.getItem(" + JSON.stringify(storageKey) + "))")
      const ready = async () => {
        await until(() =>
          evaluate(
            "document.querySelectorAll('.game-tile').length === 30 && !!localStorage.getItem('nextage:classic:v1:demo-nextage-v2:guest')"
          )
        )
        await until(() =>
          evaluate(
            "performance.getEntriesByType('resource').some(e => e.name.endsWith('/dictionary.json') && e.responseEnd > 0)"
          )
        )
      }
      const key = async (value) => {
        await evaluate(
          `window.dispatchEvent(new KeyboardEvent('keydown', {key:${JSON.stringify(value)}}))`
        )
        await delay(40)
      }
      const type = async (word) => {
        for (const letter of word) await key(letter)
      }
      const reload = async () => {
        await client.send("Page.reload", { ignoreCache: true })
        await delay(300)
        await ready()
      }
      await client.send("Page.enable")
      await client.send("Page.navigate", { url: "http://127.0.0.1:5173/" })
      await ready()
      const initial = await snapshot()

      // A digitação deve seguir a casa destacada, mesmo com espaços à esquerda.
      const selectCell = (column, row = 0) =>
        evaluate(`document.querySelectorAll('.game-row')[${row}].children[${column}].click()`)
      const assertRow = async (expected, column) => {
        const game = (await snapshot()).game
        assert.deepEqual(game.board[game.currentRow], expected)
        assert.equal(game.currentCol, column)
        assert.equal(
          await evaluate(
            "[...document.querySelectorAll('.game-tile')].findIndex(e=>e.classList.contains('cursor-active'))"
          ),
          game.currentRow * 5 + column
        )
      }
      await selectCell(2)
      await type("AB")
      await assertRow(["", "", "A", "B", ""], 4)
      await evaluate("[...document.querySelectorAll('.key')].find(e=>e.textContent==='Z').click()")
      await type("Q")
      await assertRow(["", "", "A", "B", "Z"], 4)
      await key("ArrowLeft")
      await key("ArrowLeft")
      await type("CD")
      await assertRow(["", "", "C", "D", "Z"], 4)
      for (let i = 0; i < 6; i++) await key("ArrowLeft")
      await type("XY")
      await assertRow(["X", "Y", "C", "D", "Z"], 2)
      for (let i = 0; i < 6; i++) await key("ArrowRight")
      await key("Backspace")
      await key("Backspace")
      await assertRow(["X", "Y", "C", "", ""], 3)
      await type("EF")
      await assertRow(["X", "Y", "C", "E", "F"], 4)
      await selectCell(1)
      const selected = await snapshot()
      await reload()
      assert.deepEqual(await snapshot(), selected)
      await type("A")
      await assertRow(["X", "A", "C", "E", "F"], 2)
      await selectCell(4, 1)
      await assertRow(["X", "A", "C", "E", "F"], 2)
      await selectCell(4)
      for (let i = 0; i < 6; i++) await key("Backspace")
      await assertRow(["", "", "", "", ""], 0)

      // Eventos agrupados não podem usar uma posição antiga do cursor.
      await evaluate(
        "document.querySelectorAll('.game-tile')[1].click(); for(const key of ['A','B','ArrowRight','C']) window.dispatchEvent(new KeyboardEvent('keydown',{key}))"
      )
      await assertRow(["", "A", "B", "", "C"], 4)
      const beforeShortcut = await snapshot()
      await evaluate(
        "for(const options of [{key:'a',ctrlKey:true},{key:'ArrowLeft',altKey:true},{key:'x',isComposing:true}]) window.dispatchEvent(new KeyboardEvent('keydown',options))"
      )
      assert.deepEqual(await snapshot(), beforeShortcut)
      assert.equal(
        await evaluate(
          "window.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowLeft',cancelable:true}))"
        ),
        false,
        "Setas do tabuleiro devem impedir a rolagem padrão da página."
      )
      await selectCell(4)
      for (let i = 0; i < 6; i++) await key("Backspace")

      const wrong = initial.secret === "CASAS" ? "TERMO" : "CASAS"
      await type(wrong)
      await key("Enter")
      await until(async () => (await snapshot()).game.currentRow === 1)
      await selectCell(3, 0)
      await assertRow(["", "", "", "", ""], 0)
      await type("AB")
      const before = await snapshot()
      await reload()
      assert.deepEqual(await snapshot(), before)
      assert.equal(
        await evaluate(
          "[...document.querySelectorAll('.game-tile')].slice(0,7).map(e=>e.textContent).join('')"
        ),
        wrong + "AB"
      )
      await key("Backspace")
      await key("Backspace")
      await type(initial.secret)
      await key("Enter")
      await until(async () => (await snapshot()).game.isGameOver)
      const won = await snapshot()
      await key("ArrowLeft")
      await type("ABC")
      assert.deepEqual(await snapshot(), won)
      await reload()
      assert.equal((await snapshot()).matchId, initial.matchId)
      assert.equal((await snapshot()).finishedAt, won.finishedAt)
      assert.ok(await evaluate("document.body.textContent.includes('PARABÉNS!')"))
      await evaluate(
        "[...document.querySelectorAll('button')].find(e=>e.textContent.includes('Novo Jogo')).click()"
      )
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
      await evaluate(
        "document.querySelector('.victory-close').click(); [...document.querySelectorAll('button')].find(e=>e.textContent.trim()==='Login').click()"
      )
      await until(() => evaluate("!!document.querySelector('.auth-card .switch')"))
      const beforeLoginInput = await snapshot()
      await key("ArrowLeft")
      await type("ABC")
      assert.deepEqual(await snapshot(), beforeLoginInput)
      await evaluate("document.querySelector('.auth-card .switch').click()")
      await until(() => evaluate("document.querySelectorAll('.auth-card input').length === 4"))
      await evaluate(
        "(() => {const values=" +
          JSON.stringify({
            Nome: "Jogador",
            Email: email,
            Senha: password,
            "Confirmar senha": password
          }) +
          "; for(const input of document.querySelectorAll('.auth-card input')) { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,values[input.placeholder]); input.dispatchEvent(new Event('input',{bubbles:true})); }})()"
      )
      await until(() =>
        evaluate("!document.querySelector('.auth-card button[type=submit]').disabled")
      )
      await evaluate("document.querySelector('.auth-card button[type=submit]').click()")
      await until(() => evaluate("!!document.querySelector('.terms-btn.accept')"))
      accountCreated = true
      assert.equal(
        await evaluate("document.querySelector('.terms-research-choice input').checked"),
        false
      )
      await evaluate("document.querySelector('.terms-btn.accept').click()")
      await until(() => evaluate("!document.querySelector('.terms-modal')"))
      storageKey = await evaluate(
        "Object.keys(localStorage).find(k=>k.startsWith('nextage:classic:v1:demo-nextage-v2:user:'))"
      )
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
      await evaluate(
        "(() => { const k=" +
          JSON.stringify(storageKey) +
          "; const r=JSON.parse(localStorage.getItem(k)); r.recorded=false; localStorage.setItem(k,JSON.stringify(r)); })()"
      )
      await reload()
      await until(async () => (await snapshot()).recorded)
      assert.equal((await snapshot()).matchId, owned.matchId)
      await evaluate(
        "document.querySelector('.victory-close').click(); document.querySelector('.header-left .icon-btn').click()"
      )
      await until(() =>
        evaluate(
          "document.querySelector('.ranking-list-new')?.getAttribute('aria-busy')==='false' && !!document.querySelector('.ranking-row-self .highlight-blue')"
        )
      )
      assert.equal(
        await evaluate(
          "document.querySelector('.ranking-row-self .highlight-blue').textContent.trim()"
        ),
        "1"
      )
      await evaluate("document.querySelector('.ranking-close').click()")
      await key("Enter")
      await until(async () => (await snapshot()).matchId !== owned.matchId)
      assert.equal((await snapshot()).game.streak, 1)
      let expectedBestStreak = "1"
      const openSettings = async () => {
        await evaluate("document.querySelector('.user-btn').click()")
        await until(() => evaluate("!!document.querySelector('.user-dropdown button')"))
        await evaluate("document.querySelector('.user-dropdown button').click()")
        await until(() => evaluate("!!document.querySelector('.profile-tabs')"))
        await until(() => evaluate("!!document.querySelector('.profile-metric-value')"))
        assert.equal(
          await evaluate("document.querySelector('.profile-metric-label').textContent"),
          "Maior sequência"
        )
        assert.equal(
          await evaluate("document.querySelector('.profile-metric-value').textContent"),
          expectedBestStreak
        )
        await evaluate(
          "[...document.querySelectorAll('.profile-tabs button')].find(e=>e.textContent.trim()==='Configurações').click()"
        )
        await until(() =>
          evaluate(
            "!!document.querySelector('.account-research button') && !document.querySelector('.account-research button').disabled"
          )
        )
      }
      await openSettings()
      assert.ok(
        await evaluate(
          "document.querySelector('.account-research').textContent.includes('Não autorizada')"
        )
      )
      await evaluate("document.querySelector('.account-research button').click()")
      await until(() => evaluate("!!document.querySelector('.terms-btn.accept')"))
      assert.ok(
        await evaluate("document.querySelector('.terms-modal').textContent.includes('histórico')")
      )
      await evaluate("document.querySelector('.terms-btn.accept').click()")
      await until(() =>
        evaluate(
          "!document.querySelector('.terms-modal') && document.querySelector('.account-research button').textContent==='Revogar participação'"
        )
      )
      await evaluate("document.querySelector('.account-research button').click()")
      await until(() =>
        evaluate(
          "document.querySelector('.account-research').textContent.includes('Não autorizada') && !document.querySelector('.account-research button').disabled"
        )
      )
      await reload()
      assert.ok(
        await evaluate(
          "!!document.querySelector('.user-btn') && !document.querySelector('.terms-modal')"
        )
      )
      assert.equal((await snapshot()).game.streak, 1)
      await openSettings()
      assert.ok(
        await evaluate(
          "document.querySelector('.account-research').textContent.includes('Não autorizada')"
        )
      )
      const downloads = path.resolve(mkdtempSync(".firebase/browser-downloads-"))
      await client.send("Browser.setDownloadBehavior", {
        behavior: "allow",
        downloadPath: downloads
      })
      await evaluate(
        "[...document.querySelectorAll('.account-data-actions button')].find(e=>e.textContent.includes('JSON')).click()"
      )
      const jsonPath = path.join(downloads, "nextage_meus_dados.json")
      await until(() => existsSync(jsonPath))
      const personal = JSON.parse(readFileSync(jsonPath, "utf8"))
      assert.equal(personal.player.stats.totalWins, 1)
      assert.equal(personal.player.researchConsent.accepted, false)
      await until(() =>
        evaluate("!document.querySelector('.account-data-actions button').disabled")
      )
      await evaluate(
        "[...document.querySelectorAll('.account-data-actions button')].find(e=>e.textContent.includes('CSV')).click()"
      )
      const csvPath = path.join(downloads, "nextage_minhas_partidas.csv")
      await until(() => existsSync(csvPath))
      assert.ok(readFileSync(csvPath, "utf8").includes(owned.secret))
      await evaluate("document.querySelector('.profile-close').click()")

      // Após duas vitórias, uma derrota e outra vitória, o recorde é 2, não 3.
      const finishRound = async (won) => {
        const round = await snapshot()
        const guess = won ? round.secret : round.secret === "CASAS" ? "TERMO" : "CASAS"
        for (let row = 0; row < (won ? 1 : 6); row++) {
          await type(guess)
          await key("Enter")
        }
        await until(async () => (await snapshot()).game.isGameOver && (await snapshot()).recorded)
      }
      const nextRound = async () => {
        const previousId = (await snapshot()).matchId
        await evaluate(
          "[...document.querySelectorAll('button')].find(e=>e.textContent.includes('Novo Jogo')).click()"
        )
        await until(async () => (await snapshot()).matchId !== previousId)
      }
      await finishRound(true)
      await nextRound()
      await finishRound(false)
      await nextRound()
      await finishRound(true)
      assert.equal((await snapshot()).game.streak, 1)
      await evaluate("document.querySelector('.victory-close').click()")
      expectedBestStreak = "2"
      await openSettings()
      await evaluate("document.querySelector('.profile-close').click()")
      await key("Enter")
      await until(async () => !(await snapshot()).game.isGameOver)

      // Regressão Runner: na sexta linha, entradas rejeitadas não encerram a corrida.
      await evaluate(
        "window.nextageOriginalRandom=Math.random; Math.random=()=>0; document.querySelector('a[href=\"/runner\"]').click()"
      )
      await until(() => evaluate("!!document.querySelector('.runner-options-vertical')"))
      await evaluate(
        "[...document.querySelectorAll('.runner-options-vertical button')].find(e=>e.textContent==='60s').click()"
      )
      await until(() => evaluate("!!document.querySelector('.runner-timer')"))
      await selectCell(2)
      await type("AB")
      await key("ArrowLeft")
      await type("C")
      assert.deepEqual(
        await evaluate(
          "[...document.querySelectorAll('.game-row')[0].children].map(e=>e.textContent)"
        ),
        ["", "", "A", "C", ""]
      )
      assert.equal(
        await evaluate(
          "[...document.querySelectorAll('.game-tile')].findIndex(e=>e.classList.contains('cursor-active'))"
        ),
        4
      )
      await key("Backspace")
      assert.equal(
        await evaluate("document.querySelector('.game-row').textContent"),
        "",
        "Backspace do Runner continua limpando a tentativa inteira."
      )
      for (let row = 0; row < 5; row++) {
        await type("CASAS")
        await key("Enter")
      }
      await until(() =>
        evaluate("document.querySelectorAll('.game-tile[class*=tile-]').length===25")
      )
      await type("AB")
      await key("Enter")
      assert.ok(
        await evaluate(
          "!!document.querySelector('.runner-timer') && !document.querySelector('.runner-result-card')"
        )
      )
      await key("Backspace")
      await type("QZXQZ")
      await evaluate(
        "[...document.querySelectorAll('.keyboard button')].find(e=>e.textContent==='ENTER').click()"
      )
      await delay(100)
      assert.ok(
        await evaluate(
          "!!document.querySelector('.runner-timer') && !document.querySelector('.runner-result-card')"
        )
      )
      await key("Backspace")
      await type("CASAS")
      await key("Enter")
      await until(() => evaluate("!!document.querySelector('.runner-result-card')"))
      await evaluate(
        "Math.random=window.nextageOriginalRandom; document.querySelector('.runner-back-btn').click()"
      )
      await until(() =>
        evaluate("location.pathname==='/' && document.querySelectorAll('.game-tile').length===30")
      )

      // Exclusão completa da própria conta fictícia pela interface, com senha fictícia.
      await openSettings()
      await until(() => evaluate("!document.querySelector('.account-data > button').disabled"))
      await evaluate(
        "[...document.querySelectorAll('.account-data > button')].find(e=>e.textContent==='Excluir minha conta').click()"
      )
      await until(() => evaluate("!!document.querySelector('#account-delete-confirmation')"))
      await evaluate(
        "[...document.querySelectorAll('.account-delete-panel button')].find(e=>e.textContent==='Cancelar').click()"
      )
      assert.ok(await evaluate("!!document.querySelector('.user-btn')"))
      await evaluate(
        "[...document.querySelectorAll('.account-data > button')].find(e=>e.textContent==='Excluir minha conta').click()"
      )
      await until(() => evaluate("!!document.querySelector('#account-delete-password')"))
      await evaluate(
        "(() => { for(const [id,value] of " +
          JSON.stringify([
            ["account-delete-confirmation", "EXCLUIR"],
            ["account-delete-password", password]
          ]) +
          ") { const input=document.getElementById(id); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,value); input.dispatchEvent(new Event('input',{bubbles:true})); }})()"
      )
      await until(() =>
        evaluate(
          "[...document.querySelectorAll('.account-delete-panel button')].some(e=>e.textContent==='Confirmar exclusão' && !e.disabled)"
        )
      )
      await evaluate(
        "[...document.querySelectorAll('.account-delete-panel button')].find(e=>e.textContent==='Confirmar exclusão').click()"
      )
      await until(() => evaluate("!document.querySelector('.user-btn')"))
      accountCreated = false
      const originalFirestoreHost = process.env.FIRESTORE_EMULATOR_HOST
      const originalAuthHost = process.env.FIREBASE_AUTH_EMULATOR_HOST
      process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080"
      process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099"
      const adminFixture = initializeAdminApp(
        { projectId: "demo-nextage-v2" },
        "deletion-verification"
      )
      try {
        const uid = storageKey.split(":user:")[1]
        assert.ok(uid)
        const db = getAdminFirestore(adminFixture)
        const [player, profile, matches, words] = await Promise.all([
          db.doc(`jogadores/${uid}`).get(),
          db.doc(`perfisPublicos/${uid}`).get(),
          db.collection(`jogadores/${uid}/partidas`).get(),
          db.collection(`jogadores/${uid}/palavras`).get()
        ])
        assert.equal(player.exists, false)
        assert.equal(profile.exists, false)
        assert.equal(matches.size, 0)
        assert.equal(words.size, 0)
        await assert.rejects(getAdminAuth(adminFixture).getUser(uid), {
          code: "auth/user-not-found"
        })
      } finally {
        await deleteAdminApp(adminFixture)
        if (originalFirestoreHost === undefined) delete process.env.FIRESTORE_EMULATOR_HOST
        else process.env.FIRESTORE_EMULATOR_HOST = originalFirestoreHost
        if (originalAuthHost === undefined) delete process.env.FIREBASE_AUTH_EMULATOR_HOST
        else process.env.FIREBASE_AUTH_EMULATOR_HOST = originalAuthHost
      }
    } finally {
      if (client) {
        client.send("Browser.close").catch(() => {})
        await delay(500)
        client.close()
      }
      if (browser?.exitCode === null) browser.kill()
      if (accountCreated) {
        const fixture = initializeApp(
          { projectId: "demo-nextage-v2", apiKey: "fake-api-key", authDomain: "localhost" },
          "browser-cleanup"
        )
        try {
          const auth = getAuth(fixture)
          const db = getFirestore(fixture)
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
      if (app.connected) app.send({ type: "nextage:shutdown" })
      assert.equal(
        await Promise.race([appExit, delay(60000, "timeout", { ref: false })]),
        0,
        output
      )
    }
  }
)
