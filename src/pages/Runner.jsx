import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useWordle } from "../hooks/useWordle"
import { useRunner } from "../hooks/useRunner"
import { answers } from "../utils/answers"
import RunnerRankingModal from "../components/RunnerRankingModal"
import Modal from "../components/Modal"
import Keyboard from "../components/Keyboard"
import { saveRunnerRecord } from "../services/playerService"
import { useAuth } from "../context/useAuth"
import "../styles/game.css"
import "../styles/runner.css"

function Runner() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [selectedTime, setSelectedTime] = useState(null)
  const [prepTime, setPrepTime] = useState(null)
  const [openRunnerRanking, setOpenRunnerRanking] = useState(false)
  const [lostByError, setLostByError] = useState(false)

  const {
    timeLeft,
    isRunning,
    score,
    start,
    stop,
    incrementScore,
    reset
  } = useRunner(selectedTime || 0)

  const [secret, setSecret] = useState(() => {
    const randomIndex = Math.floor(Math.random() * answers.length)
    return answers[randomIndex]
  })

  const {
    board,
    results,
    addLetter,
    submitGuess,
    resetBoard,
    currentRow,
    clearCurrentRow
  } = useWordle(secret)

  const finished = selectedTime && (timeLeft <= 0 || lostByError)

  useEffect(() => {
    if (!isRunning) return
    if (timeLeft <= 0) stop()
  }, [timeLeft, isRunning])

  useEffect(() => {
    if (prepTime === null) return

    const timer = setTimeout(() => {
      if (prepTime <= 0) {
        setPrepTime(null)
        start()
      } else {
        setPrepTime(prev => prev - 1)
      }
    }, prepTime <= 0 ? 0 : 1000)

    return () => clearTimeout(timer)
  }, [prepTime])

  useEffect(() => {
    function handleKey(e) {
      const key = e.key?.toUpperCase?.() || ""

      if (!isRunning || finished || openRunnerRanking) return

      if (key === "ENTER") {
        const rowBefore = currentRow
        const correct = submitGuess()

        if (correct === true) {
          incrementScore()

          const randomIndex = Math.floor(Math.random() * answers.length)
          setSecret(answers[randomIndex])
          resetBoard()
        } else if (correct === false && rowBefore === 5) {
          setLostByError(true)
          stop()
        }

        return
      }

      if (key === "BACKSPACE") {
        clearCurrentRow()
        return
      }

      if (/^[A-Z]$/.test(key)) return addLetter(key)
    }

    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [addLetter, submitGuess, isRunning, finished, openRunnerRanking, currentRow])

  useEffect(() => {
    function handleOpenRanking() {
      if (isRunning) stop()
      setOpenRunnerRanking(true)
    }

    window.addEventListener("openRunnerRanking", handleOpenRanking)
    return () => window.removeEventListener("openRunnerRanking", handleOpenRanking)
  }, [isRunning])

  useEffect(() => {
    function handleOpenRunnerMode() {
      handleChangeTime()
    }

    window.addEventListener("openRunnerMode", handleOpenRunnerMode)
    return () => window.removeEventListener("openRunnerMode", handleOpenRunnerMode)
  }, [])

  useEffect(() => {
    if (!openRunnerRanking && selectedTime && !finished) {
      start()
    }
  }, [openRunnerRanking])

  useEffect(() => {
    function handleEscape(e) {
      if (e.key !== "Escape") return
      if (openRunnerRanking) return
      if (selectedTime) handleRestart()
    }

    window.addEventListener("keydown", handleEscape)
    return () => window.removeEventListener("keydown", handleEscape)
  }, [selectedTime, openRunnerRanking])

  useEffect(() => {
    if (!finished || !user) return
    saveRunnerRecord(user.uid, String(selectedTime), score)
      .catch(error => console.error("Não foi possível salvar o recorde do Runner.", error))
  }, [finished])

  useEffect(() => {
    function handleEnterRestart(e) {
      if (!finished) return
      if (e.key === "Enter") {
        handleRestart()
      }
    }

    window.addEventListener("keydown", handleEnterRestart)
    return () => window.removeEventListener("keydown", handleEnterRestart)
  }, [finished])

  function handleChangeTime() {
    setLostByError(false)
    stop()
    reset(selectedTime)
    resetBoard()
    setPrepTime(null)
    setSelectedTime(null)
  }

  function handleBackToClassic() {
    setLostByError(false)
    stop()
    reset(selectedTime)
    resetBoard()
    setSelectedTime(null)
    setPrepTime(null)
    setOpenRunnerRanking(false)
    navigate("/")
  }

  function startRunner(seconds) {
    setLostByError(false)
    setSelectedTime(seconds)
    reset(seconds)
    setPrepTime(5)

    const randomIndex = Math.floor(Math.random() * answers.length)
    setSecret(answers[randomIndex])
  }

  function handleRestart() {
    setLostByError(false)
    reset(selectedTime)
    resetBoard()
    setPrepTime(5)

    const randomIndex = Math.floor(Math.random() * answers.length)
    setSecret(answers[randomIndex])
  }

  function handleVirtualKey(key) {
    if (!isRunning || finished || openRunnerRanking) return

    if (key === "ENTER") {
      const rowBefore = currentRow
      const correct = submitGuess()

      if (correct === true) {
        incrementScore()

        const randomIndex = Math.floor(Math.random() * answers.length)
        setSecret(answers[randomIndex])
        resetBoard()
      } else if (correct === false && rowBefore === 5) {
        setLostByError(true)
        stop()
      }

      return
    }

    if (key === "BACKSPACE") {
      clearCurrentRow()
      return
    }

    if (/^[A-Z]$/.test(key)) return addLetter(key)
  }

  return (
    <div className="game-wrapper">
      <h1>MODO RUNNER</h1>
      <p style={{ marginBottom: "20px", color: "#ccc" }}>
        Acerte o máximo de palavras antes do tempo acabar
      </p>

      {!selectedTime && (
        <Modal isOpen={true}>
          <div className="modal-card">
            <h2>Escolha o tempo</h2>

            <div className="runner-options-vertical">
              <button className="modal-btn red" onClick={() => startRunner(10)}>10s</button>
              <button className="modal-btn red" onClick={() => startRunner(30)}>30s</button>
              <button className="modal-btn red" onClick={() => startRunner(60)}>60s</button>
            </div>

            <button
              className="runner-close-select-btn"
              onClick={handleBackToClassic}
            >
              Fechar
            </button>
          </div>
        </Modal>
      )}

      {prepTime !== null && (
        <Modal isOpen={true}>
          <div className="prep-fullscreen">
            <h2 className="prep-title">PREPARE‑SE</h2>
            <div className="prep-number">{prepTime}</div>
          </div>
        </Modal>
      )}

      {selectedTime && prepTime === null && !finished && (
        <>
          <div className="runner-stats">
            <div className="runner-timer">{timeLeft}s</div>
            <div className="runner-score">{score}</div>
          </div>

          <div className="game-grid">
            {board.map((row, rowIndex) => (
              <div key={rowIndex} className="game-row">
                {row.map((cell, colIndex) => {
                  const status = results?.[rowIndex]?.[colIndex]
                  let className = "game-tile"
                  if (status === "correct") className += " tile-correct"
                  if (status === "present") className += " tile-present"
                  if (status === "absent") className += " tile-absent"

                  return (
                    <div key={colIndex} className={className}>
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
        </>
      )}

      {finished && (
        <Modal isOpen={true}>
          <div className="modal-card runner-result-card">
            <h2 className="runner-result-title">
              FIM DA CORRIDA 🏁
            </h2>

            <p className="runner-result-time">
              Tempo Total: {selectedTime}s
            </p>

            <div className="runner-result-acertos">
              <span className="runner-acertos-label">ACERTOS:</span>
              <span className="runner-acertos-value">{score}</span>
            </div>

            <p className="runner-result-average">
              {score > 0
                ? `Média: ${(selectedTime / score).toFixed(1)}s por palavra`
                : "Nenhuma palavra acertada"}
            </p>

            <button
              className="runner-restart-btn"
              onClick={handleRestart}
            >
              NOVA CORRIDA
            </button>

            <button
              className="runner-back-btn"
              onClick={handleBackToClassic}
            >
              VOLTAR AO MODO CLÁSSICO
            </button>
          </div>
        </Modal>
      )}

      <RunnerRankingModal
        isOpen={openRunnerRanking}
        onClose={() => setOpenRunnerRanking(false)}
        time={selectedTime}
      />
    </div>
  )
}

export default Runner
