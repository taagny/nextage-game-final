import { useEffect, useEffectEvent, useLayoutEffect, useRef, useState } from "react"
import { useWordle } from "../hooks/useWordle"
import { classicElapsedTime, newClassicRound } from "../utils/classicSession.js"
import { classicScope, loadClassicSession, saveClassicSession } from "../services/classicSessionService.js"
import { useAuth } from "../context/useAuth"
import { buildWordFeedback } from "../utils/wordFeedback"
import {
  getPublicProfile,
  registerWin,
  registerLoss
} from "../services/playerService"
import Modal from "../components/Modal"
import Keyboard from "../components/Keyboard"
import "../styles/game.css"

function GameBoard() {
  const { user } = useAuth()
  return <ClassicSession key={classicScope(user?.uid)} ownerId={user?.uid} />
}

function ClassicSession({ ownerId }) {
  const [session, setSession] = useState(() => {
    const loaded = loadClassicSession(ownerId)
    return { round: loaded.round ?? newClassicRound(), error: loaded.error }
  })
  return <ClassicRound key={session.round.matchId} initialRound={session.round}
    ownerId={ownerId} storageWarning={session.error}
    onNewGame={streak => {
      const round = newClassicRound()
      round.game.streak = streak
      setSession({ round, error: session.error })
    }} />
}

function ClassicRound({ initialRound, ownerId, storageWarning, onNewGame }) {

  const { user, setGameInProgress, setGameMatchId } = useAuth()
  const [copied, setCopied] = useState(false)
  const startTime = initialRound.startTime
  const matchId = initialRound.matchId
  const secret = initialRound.secret
  const [showVictoryModal, setShowVictoryModal] = useState(initialRound.game.isGameOver)
  const [finishedAt, setFinishedAt] = useState(initialRound.finishedAt)
  const [recorded, setRecorded] = useState(initialRound.recorded || !ownerId)
  const [saveAttempt, setSaveAttempt] = useState(0)
  const [storageError, setStorageError] = useState(storageWarning)
  const [saveError, setSaveError] = useState("")
  const [wordFeedback, setWordFeedback] = useState(null)
  const finishRequest = useRef(null)

  const {
    board,
    results,
    addLetter,
    deleteLetter,
    submitGuess,
    isGameOver,
    streak,
    currentRow,
    currentCol,
    setCurrentCol,
    setIsManualSelection,
    isManualSelection,
    setExternalStreak,
    invalidWord
  } = useWordle(secret, { initialState: initialRound.game, onFinish: () => {
    setFinishedAt(Math.max(Date.now(), startTime))
    setShowVictoryModal(true)
  } })

  useLayoutEffect(() => {
    saveClassicSession(ownerId, { version: 1, matchId, secret, startTime, finishedAt, recorded,
      game: { board, results, currentRow, currentCol, isManualSelection, isGameOver, streak }
    }).catch(() => setStorageError("Não foi possível salvar a partida neste navegador. Não recarregue a página até concluí-la."))
  }, [ownerId, matchId, secret, startTime, finishedAt, recorded, board, results, currentRow,
    currentCol, isManualSelection, isGameOver, streak])

  const restartFinishedRound = useEffectEvent(() => handleNewGame())

  useEffect(() => {
    let active = true
    async function loadPlayer() {
      if (!user) return

      const data = await getPublicProfile(user.uid)

      if (active && data && data.sequenciaAtual !== undefined) {
        setExternalStreak(data.sequenciaAtual)
      }
    }

    loadPlayer().catch(error => console.error("Não foi possível carregar a sequência.", error))
    return () => { active = false }
  }, [user])

  useEffect(() => {
    function handleEnterRestart(e) {
      if (!isGameOver) return
      if (e.key === "Enter") {
        restartFinishedRound()
      }
    }

    window.addEventListener("keydown", handleEnterRestart)
    return () => window.removeEventListener("keydown", handleEnterRestart)
  }, [isGameOver])

  useEffect(() => {
    if (!isGameOver || !user || recorded || finishedAt === null) return
    let active = true
    if (!finishRequest.current) {
      const isWinner = results[currentRow].every(status => status === "correct")
      const register = isWinner ? registerWin : registerLoss
      finishRequest.current = register(user.uid, {
        word: secret,
        attempts: currentRow + 1,
        timeMs: classicElapsedTime(startTime, finishedAt),
        matchId
      })
    }
    finishRequest.current.then(saved => {
      if (!active) return
      setWordFeedback(buildWordFeedback(saved.wordHistory))
      setRecorded(true)
    }).catch(error => {
      console.error("Não foi possível salvar a partida.", error)
      if (active) setSaveError("Não foi possível salvar sua partida. Verifique sua conexão.")
    })
    return () => { active = false }
  }, [isGameOver, currentRow, results, startTime, finishedAt, user, secret, matchId, recorded, saveAttempt])

  useEffect(() => {
    function handleKey(e) {
      const key = e.key?.toUpperCase?.() || ""

      if (isGameOver) return
      if (key === "ENTER") return submitGuess()
      if (key === "BACKSPACE") return deleteLetter()
      if (/^[A-Z]$/.test(key)) return addLetter(key)
    }

    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [addLetter, deleteLetter, submitGuess, isGameOver])

  useEffect(() => {
    const hasTypedLetter = board?.some(row =>
      row?.some(cell => cell !== "")
    )

    if (!isGameOver && hasTypedLetter) {
      setGameInProgress(true)
      setGameMatchId(matchId)
    } else {
      setGameInProgress(false)
      setGameMatchId(null)
    }
  }, [board, isGameOver, matchId, setGameInProgress, setGameMatchId])

  function handleVirtualKey(key) {

    if (key === "ENTER") {

      if (isGameOver && !showVictoryModal) {
        handleNewGame()
        return
      }

      if (!isGameOver) {
        submitGuess()
      }

      return
    }

    if (isGameOver) return

    if (key === "BACKSPACE") return deleteLetter()
    if (/^[A-Z]$/.test(key)) return addLetter(key)
  }

  function handleNewGame() {
    if (ownerId && !recorded) return
    onNewGame(streak)
  }

  function retrySave() {
    finishRequest.current = null
    setSaveError("")
    setSaveAttempt(attempt => attempt + 1)
  }

  function generateShareText() {
    let text = `NEXTAGE ${currentRow + 1}/6\n\n`

    for (let i = 0; i <= currentRow; i++) {
      if (!results?.[i]) continue
      results[i].forEach(status => {
        if (status === "correct") text += "🟩"
        else if (status === "present") text += "🟨"
        else text += "⬛"
      })
      text += "\n"
    }

    if (user) {
      text += `\n🔥 Sequência: ${streak.toLocaleString("pt-BR")}`
    }

    return text
  }

  async function handleShare() {
    const text = generateShareText()
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="game-wrapper">
      {storageError && <p role="alert">{storageError}</p>}

      <Modal isOpen={showVictoryModal}>
        <div className="modal-card streak-modal">

          <button
            className="victory-close"
            onClick={() => setShowVictoryModal(false)}
          >
            ×
          </button>

          <h2 className="streak-title">
            {results?.[currentRow]?.every(status => status === "correct")
              ? "PARABÉNS!"
              : "FIM DE JOGO!"}
          </h2>

          <p className="victory-word">
            A palavra era: <strong>{secret}</strong>
          </p>
          {saveError && <p role="alert">{saveError}</p>}
          {saveError && <button className="modal-btn red" onClick={retrySave}>Tentar salvar novamente</button>}
          {ownerId && !recorded && !saveError && <p role="status">Salvando partida…</p>}
          {wordFeedback && <p className="word-feedback" role="status">{wordFeedback.message}</p>}

          {user && (
            <div className="streak-highlight-box">
              <span className="streak-fire">🔥</span>
              <div className="streak-highlight-info">
                <span className="streak-highlight-label">SEQUÊNCIA</span>
                <span className="streak-highlight-number">
                  {streak.toLocaleString("pt-BR")}
                </span>
              </div>
            </div>
          )}

          <div className="victory-mini-grid">
            {(results || [])
              .slice(0, currentRow + 1)
              .map((row, rowIndex) => (
                <div key={rowIndex} className="victory-mini-row">
                  {(row || []).map((status, colIndex) => (
                    <div
                      key={colIndex}
                      className={`victory-mini-tile ${status || ""}`}
                    />
                  ))}
                </div>
              ))}
          </div>

          <div className="victory-actions">
            <button onClick={handleShare} className="modal-btn green">
              {copied ? "COPIADO ✅" : "Compartilhar 🔗"}
            </button>

            <button onClick={handleNewGame} disabled={Boolean(ownerId && !recorded)} className="modal-btn red">
              Novo Jogo ↺
            </button>
          </div>

        </div>
      </Modal>

      {invalidWord && (
        <div className="invalid-message">
          Palavra inválida
        </div>
      )}

      <div className="game-grid">
        {board.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className={`game-row ${invalidWord && rowIndex === currentRow ? "row-shake" : ""
              }`}
          >
            {row.map((cell, colIndex) => {
              const status = results?.[rowIndex]?.[colIndex]
              let className = "game-tile"
              if (status === "correct") className += " tile-correct"
              if (status === "present") className += " tile-present"
              if (status === "absent") className += " tile-absent"

              return (
                <div
                  key={colIndex}
                  className={`${className} ${rowIndex === currentRow && colIndex === currentCol
                      ? "cursor-active"
                      : ""
                    }`}
                  onClick={() => {
                    if (!isGameOver && rowIndex === currentRow) {
                      setCurrentCol(colIndex)
                      setIsManualSelection(true)
                    }
                  }}
                >
                  {cell}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      <Keyboard
        onKeyPress={handleVirtualKey}
        results={results}
        board={board}
      />

    </div>
  )
}

export default GameBoard
