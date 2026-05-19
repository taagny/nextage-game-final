import { useEffect, useMemo, useState } from "react"
import { useWordle } from "../hooks/useWordle"
import { answers } from "../utils/answers"
import { useAuth } from "../context/AuthContext"
import {
  ensurePlayerExists,
  getPlayer,
  incrementStreak,
  resetStreak,
  updatePlayerStats,
  saveMatchHistory
} from "../services/playerService"
import Modal from "../components/Modal"
import Keyboard from "../components/Keyboard"
import "../styles/game.css"

function GameBoard() {

  const { user, setGameInProgress } = useAuth()
  const [gameKey, setGameKey] = useState(0)
  const [copied, setCopied] = useState(false)
  const [startTime, setStartTime] = useState(Date.now())
  const [showVictoryModal, setShowVictoryModal] = useState(false)

  const secret = useMemo(() => {
    const randomIndex = Math.floor(Math.random() * answers.length)
    return answers[randomIndex]
  }, [gameKey])

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
    resetBoard,
    setExternalStreak,
    invalidWord
  } = useWordle(secret)

  useEffect(() => {
    async function loadPlayer() {
      if (!user) return

      await ensurePlayerExists(user.uid, user.displayName, user.email)
      const data = await getPlayer(user.uid)

      if (data && data.sequenciaAtual !== undefined) {
        setExternalStreak(data.sequenciaAtual)
      }
    }

    loadPlayer()
  }, [user])

  useEffect(() => {
    function handleEnterRestart(e) {
      if (!isGameOver) return
      if (e.key === "Enter") {
        handleNewGame()
      }
    }

    window.addEventListener("keydown", handleEnterRestart)
    return () => window.removeEventListener("keydown", handleEnterRestart)
  }, [isGameOver])

  useEffect(() => {
    async function syncStreak() {
      if (!user || !isGameOver) return

      setShowVictoryModal(true)

      const guessRow = results?.[currentRow]
      const isWinner = guessRow && guessRow.every(s => s === "correct")

      if (isWinner) {
        await incrementStreak(user.uid)

        const endTime = Date.now()
        const timeSpent = endTime - startTime
        const attempts = currentRow + 1

        await updatePlayerStats(user.uid, timeSpent, attempts)

        await saveMatchHistory(user.uid, {
          mode: "classico",
          won: true,
          attempts,
          timeMs: timeSpent,
          abandoned: false
        })
      } else {
        await resetStreak(user.uid)

        await saveMatchHistory(user.uid, {
          mode: "classico",
          won: false,
          attempts: 6,
          timeMs: 0,
          abandoned: false
        })
      }
    }

    syncStreak()
  }, [isGameOver])

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
    } else {
      setGameInProgress(false)
    }
  }, [board, isGameOver])

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
    setCopied(false)
    setShowVictoryModal(false)
    setGameKey(prev => prev + 1)
    setStartTime(Date.now())
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

    text += `\n🔥 Sequência: ${streak.toLocaleString("pt-BR")}`
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

      <Modal isOpen={showVictoryModal}>
        <div className="modal-card streak-modal">

          <button
            className="victory-close"
            onClick={() => setShowVictoryModal(false)}
          >
            ×
          </button>

          <h2 className="streak-title">
            PARABÉNS!
          </h2>

          <p className="victory-word">
            A palavra era: <strong>{secret}</strong>
          </p>

          <div className="streak-highlight-box">
            <span className="streak-fire">🔥</span>
            <div className="streak-highlight-info">
              <span className="streak-highlight-label">SEQUÊNCIA</span>
              <span className="streak-highlight-number">
                {streak.toLocaleString("pt-BR")}
              </span>
            </div>
          </div>

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

            <button onClick={handleNewGame} className="modal-btn red">
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