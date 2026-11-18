import { answers } from "./answers.js"
import { checkGuess } from "./gameLogic.js"

const validAnswers = new Set(answers)
export const emptyBoard = () => Array.from({ length: 6 }, () => Array(5).fill(""))
export function newClassicRound(now = Date.now(), id = crypto.randomUUID()) {
  return {
    version: 1,
    matchId: id,
    secret: answers[Math.floor(Math.random() * answers.length)],
    startTime: now,
    finishedAt: null,
    recorded: false,
    game: {
      board: emptyBoard(),
      results: Array(6).fill(null),
      currentRow: 0,
      currentCol: 0,
      isManualSelection: false,
      isGameOver: false,
      streak: 0
    }
  }
}

// Dados locais são recuperáveis, não uma fonte confiável de placares.
export function restoreClassicRound(value) {
  if (
    !value ||
    value.version !== 1 ||
    typeof value.matchId !== "string" ||
    !/^[a-zA-Z0-9-]{1,100}$/.test(value.matchId) ||
    !validAnswers.has(value.secret) ||
    !Number.isSafeInteger(value.startTime) ||
    value.startTime < 0
  )
    return null
  const game = value.game
  if (
    !game ||
    !Array.isArray(game.board) ||
    game.board.length !== 6 ||
    !game.board.every(
      (row) =>
        Array.isArray(row) &&
        row.length === 5 &&
        row.every((cell) => typeof cell === "string" && /^(|[A-Z])$/.test(cell))
    ) ||
    !Array.isArray(game.results) ||
    game.results.length !== 6
  )
    return null
  const submitted = game.results.findIndex((row) => row === null)
  const count = submitted === -1 ? 6 : submitted
  const results = Array(6).fill(null)
  let won = false
  for (let row = 0; row < count; row++) {
    if (won || game.board[row].some((cell) => cell === "") || !Array.isArray(game.results[row]))
      return null
    results[row] = checkGuess(value.secret, game.board[row].join(""))
    won = results[row].every((status) => status === "correct")
  }
  if (game.results.slice(count).some((row) => row !== null)) return null
  const isGameOver = won || count === 6
  const currentRow = isGameOver ? count - 1 : count
  if (
    game.board.slice(currentRow + 1).some((row) => row.some(Boolean)) ||
    !Number.isInteger(game.currentCol) ||
    game.currentCol < 0 ||
    game.currentCol > 4 ||
    (isGameOver && (!Number.isSafeInteger(value.finishedAt) || value.finishedAt < value.startTime))
  )
    return null
  return {
    version: 1,
    matchId: value.matchId,
    secret: value.secret,
    startTime: value.startTime,
    finishedAt: isGameOver ? value.finishedAt : null,
    recorded: isGameOver && value.recorded === true,
    game: {
      board: game.board.map((row) => [...row]),
      results,
      currentRow,
      currentCol: game.currentCol,
      isManualSelection: game.isManualSelection === true,
      isGameOver,
      streak: Number.isSafeInteger(game.streak) && game.streak >= 0 ? game.streak : 0
    }
  }
}

export function classicSessionKey(projectId, uid) {
  return `nextage:classic:v1:${encodeURIComponent(projectId)}:${uid ? `user:${encodeURIComponent(uid)}` : "guest"}`
}
export function classicElapsedTime(startTime, finishedAt) {
  return Math.max(0, Math.min(86400000, finishedAt - startTime))
}
