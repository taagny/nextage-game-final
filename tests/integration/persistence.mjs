import assert from "node:assert/strict"
import { deleteApp } from "firebase/app"
import { app } from "./firebase.mjs"
import { registerWithPassword, loginWithPassword } from "../../src/services/authService.js"
import {
  ensurePlayerExists,
  setTermsAccepted,
  registerWin,
  getPublicProfile,
  getRecentMatches
} from "../../src/services/playerService.js"
import { getClassicRanking } from "../../src/services/rankingService.js"

const email = "persistencia-local@example.invalid"
const password = "senha-ficticia-local-123"
try {
  if (process.argv[2] === "save") {
    const { user } = await registerWithPassword(email, password)
    await ensurePlayerExists(user.uid, "Persistencia")
    await setTermsAccepted(user.uid)
    await registerWin(user.uid, {
      word: "OPACA",
      attempts: 4,
      timeMs: 15000,
      matchId: "partida-persistida"
    })
    console.log("Conta e vitória criadas nos emuladores de teste para exportação.")
  } else if (process.argv[2] === "load") {
    const { user } = await loginWithPassword(email, password)
    const profile = await getPublicProfile(user.uid)
    assert.equal(profile.sequenciaAtual, 1)
    assert.equal((await getRecentMatches(user.uid))[0].id, "partida-persistida")
    assert.equal((await getClassicRanking(user.uid, 1)).userPosition, 1)
    console.log(
      "Persistência aprovada: login, partida e posição no ranking restaurados após reiniciar ambos os emuladores."
    )
  } else throw new Error("Informe save ou load.")
} finally {
  await deleteApp(app)
}
