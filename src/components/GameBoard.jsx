import { useEffect, useMemo, useRef, useState } from "react"
import { useWordle } from "../hooks/useWordle"
import { answers } from "../utils/answers"
import { useAuth } from "../context/AuthContext"
import {
  getPublicProfile,
  registerWin,
  registerLoss
} from "../services/playerService"
import Modal from "../components/Modal"
import Keyboard from "../components/Keyboard"
import "../styles/game.css"

function GameBoard() {

  const { user, setGameInProgress, setGameMatchId } = useAuth()
  const [gameKey, setGameKey] = useState(0)
  const [copied, setCopied] = useState(false)
  const [startTime, setStartTime] = useState(Date.now())
  const [showVictoryModal, setShowVictoryModal] = useState(false)
  const [matchId, setMatchId] = useState(() => crypto.randomUUID())
  const [saveError, setSaveError] = useState("")
  const processedFinish = useRef(false)

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
    setExternalStreak,
    invalidWord
  } = useWordle(secret)

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
        handleNewGame()
      }
    }

    window.addEventListener("keydown", handleEnterRestart)
    return () => window.removeEventListener("keydown", handleEnterRestart)
  }, [isGameOver])

  useEffect(() => {
    if (!isGameOver) {
      processedFinish.current = false
      return
    }
    // Não registra outra partida ao trocar a palavra antes do reset do hook,
    // repetir o efeito ou entrar na conta depois de terminar como visitante.
    if (processedFinish.current) return
    processedFinish.current = true
    let active = true
    async function syncStreak() {
      setShowVictoryModal(true)

      const guessRow = results?.[currentRow]
      const isWinner = guessRow && guessRow.every(s => s === "correct")

      if (!user) return

      const timeSpent = Date.now() - startTime

      const register = isWinner ? registerWin : registerLoss
      await register(user.uid, {
        word: secret,
        attempts: currentRow + 1,
        timeMs: timeSpent,
        matchId
      })
    }

    syncStreak().catch(error => {
      console.error("Não foi possível salvar a partida.", error)
      if (active) setSaveError("Não foi possível salvar sua partida. Verifique sua conexão.")
    })
    return () => { active = false }
  }, [isGameOver, currentRow, results, startTime, user, secret, matchId])

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
    setCopied(false)
    setShowVictoryModal(false)
    setSaveError("")
    setMatchId(crypto.randomUUID())
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
