import { after, test } from "node:test"
import assert from "node:assert/strict"
import { deleteApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { app } from "./firebase.mjs"
import { registerWithPassword, loginWithPassword, logout } from "../../src/services/authService.js"
import {
  ensurePlayerExists, setTermsAccepted, registerWin, getPlayer, getPublicProfile,
  getRecentMatches, saveRunnerRecord, registerLoss, setResearchConsent
} from "../../src/services/playerService.js"
import { getClassicRanking, getRunnerRanking } from "../../src/services/rankingService.js"
import { hasResearchConsent } from "../../src/utils/researchConsent.js"
import { createResearchKeyFile, openResearchKeyFile, pseudonymizeUid } from "../../src/utils/pseudonym.js"
import { getGlobalStats, exportResearchJSON, exportSummaryCSV, exportMatchesCSV } from "../../src/services/adminService.js"
import { initializeApp as initializeAdminApp, deleteApp as deleteAdminApp } from "firebase-admin/app"
import { getAuth as getAdminAuth } from "firebase-admin/auth"

after(async () => { await deleteApp(app) })

test("cadastro, aceite, erro de senha, novo login, vitória e rankings usam os serviços reais", async () => {
  const email = "fluxo-integrado@example.invalid"
  const password = "senha-local-ficticia-123"
  const { user } = await registerWithPassword(email, password)
  const uid = user.uid
  await ensurePlayerExists(uid, "Jogador")
  await setTermsAccepted(uid)
  await logout()
  await assert.rejects(loginWithPassword(email, "senha-incorreta"), error =>
    ["auth/wrong-password", "auth/invalid-credential"].includes(error.code))
  assert.equal((await loginWithPassword(email, password)).user.uid, uid)
  await ensurePlayerExists(uid, "Jogador")
  assert.equal((await getPlayer(uid)).termsAccepted, true)
  assert.equal(hasResearchConsent(await getPlayer(uid)), false)
  await setResearchConsent(uid, true)
  assert.equal(hasResearchConsent(await getPlayer(uid)), true)
  await setResearchConsent(uid, false)
  assert.equal(hasResearchConsent(await getPlayer(uid)), false)

  await registerWin(uid, { word: "OPACA", attempts: 4, timeMs: 15000, matchId: "vitoria-integrada" })
  const profile = await getPublicProfile(uid)
  assert.equal(profile.sequenciaAtual, 1)
  assert.equal((await getPlayer(uid)).stats.totalWins, 1)
  assert.equal((await getRecentMatches(uid))[0].word, "OPACA")
  const ranking = await getClassicRanking(uid, profile.sequenciaAtual)
  assert.equal(ranking.userPosition, 1)
  assert.equal(ranking.players.find(player => player.id === uid).sequenciaAtual, 1)

  // Reenvio do mesmo desfecho não duplica partida nem sequência.
  await registerWin(uid, { word: "OPACA", attempts: 4, timeMs: 15000, matchId: "vitoria-integrada" })
  assert.equal((await getPlayer(uid)).stats.totalWins, 1)
  await saveRunnerRecord(uid, "10", 3)
  const runner = await getRunnerRanking("10", uid, 3)
  assert.equal(runner.userPosition, 1)
  assert.equal(runner.players.find(player => player.id === uid).runnerScores["10"], 3)

  await logout()
  await loginWithPassword(email, password)
  assert.equal((await getPublicProfile(uid)).sequenciaAtual, 1)
  await registerLoss(uid, { word: "CASAS", timeMs: 20000, matchId: "derrota-integrada" })
  assert.equal((await getPlayer(uid)).stats.totalLosses, 1)
  assert.equal(hasResearchConsent(await getPlayer(uid)), false)
  assert.equal((await getPublicProfile(uid)).sequenciaAtual, 0)
  assert.equal((await getClassicRanking(uid, 0)).players.some(player => player.id === uid), false)

  assert.match(process.env.FIREBASE_AUTH_EMULATOR_HOST, /^127\.0\.0\.1:\d+$/)
  const adminFixture = initializeAdminApp({ projectId: "demo-nextage-v2" }, "research-fixture")
  try {
    await getAdminAuth(adminFixture).setCustomUserClaims(uid, { admin: true })
    await getAuth(app).currentUser.getIdToken(true)
    assert.equal((await getAuth(app).currentUser.getIdTokenResult()).claims.admin, true)
    const keyFile = createResearchKeyFile()
    const researchKey = await openResearchKeyFile(JSON.stringify(keyFile))
    assert.equal((await getGlobalStats(researchKey)).totalPlayers, 0)
    await setResearchConsent(uid, true)
    assert.equal((await getGlobalStats(researchKey)).totalPlayers, 1)
    const blobs = new Map(), downloads = []
    const originalDocument = globalThis.document
    const originalCreateURL = URL.createObjectURL
    URL.createObjectURL = blob => { const url = originalCreateURL(blob); blobs.set(url, blob); return url }
    globalThis.document = { body: { appendChild() {} }, createElement() { return { remove() {}, click() { downloads.push({ name: this.download, blob: blobs.get(this.href) }) } } } }
    try {
      await exportResearchJSON(researchKey)
      await exportSummaryCSV(researchKey)
      await exportMatchesCSV(researchKey)
      const dataset = JSON.parse(await downloads[0].blob.text())
      assert.equal(dataset.schemaVersion, 3)
      assert.equal(dataset.pseudonymization.algorithm, "HMAC-SHA-256")
      assert.equal(dataset.participants.length, 1)
      assert.equal(dataset.participants[0].participant_id, await pseudonymizeUid(uid, researchKey))
      assert.equal(dataset.participants[0].matches.length, 2)
      for (const download of downloads) {
        const text = await download.blob.text()
        for (const forbidden of [uid, email, keyFile.secret]) assert.equal(text.includes(forbidden), false)
        assert.ok(text.includes(researchKey.id))
      }
      await setResearchConsent(uid, false)
      await exportResearchJSON(researchKey)
      assert.equal(JSON.parse(await downloads.at(-1).blob.text()).participants.length, 0)
      assert.equal((await getPlayer(uid)).stats.totalGames, 2)
    } finally {
      URL.createObjectURL = originalCreateURL
      if (originalDocument === undefined) delete globalThis.document
      else globalThis.document = originalDocument
    }
  } finally { await deleteAdminApp(adminFixture) }
})
