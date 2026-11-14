import { after, test } from "node:test"
import assert from "node:assert/strict"
import { deleteApp } from "firebase/app"
import { app } from "./firebase.mjs"
import { registerWithPassword, loginWithPassword, logout } from "../../src/services/authService.js"
import {
  ensurePlayerExists, setTermsAccepted, registerWin, getPlayer, getPublicProfile,
  getRecentMatches, saveRunnerRecord, registerLoss, setResearchConsent
} from "../../src/services/playerService.js"
import { getClassicRanking, getRunnerRanking } from "../../src/services/rankingService.js"
import { hasResearchConsent } from "../../src/utils/researchConsent.js"

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
})
