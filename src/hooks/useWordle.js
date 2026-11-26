import { useEffect, useReducer, useRef, useState } from "react"
import { checkGuess } from "../utils/gameLogic"
import { createWordleInput, wordleInputReducer } from "../utils/wordleInput.js"

export function useWordle(secret, { initialState, onFinish } = {}) {
  const [{ board, currentRow, currentCol, isManualSelection }, dispatchInput] = useReducer(
    wordleInputReducer,
    initialState,
    createWordleInput
  )

  const [results, setResults] = useState(
    () => initialState?.results.map((row) => row && [...row]) ?? Array(6).fill(null)
  )

  const [isGameOver, setIsGameOver] = useState(initialState?.isGameOver ?? false)
  const [streak, setStreak] = useState(initialState?.streak ?? 0)
  const [invalidWord, setInvalidWord] = useState(false)

  const dictionaryRef = useRef(null)
  const previousSecret = useRef(secret)

  useEffect(() => {
    fetch("/dictionary.json")
      .then((res) => res.json())
      .then((data) => {
        dictionaryRef.current = new Set(data)
      })
      .catch(() => {
        dictionaryRef.current = new Set()
      })
  }, [])

  useEffect(() => {
    // Preservar a restauração inicial; mudanças posteriores continuam resetando
    // o Runner como antes. Novo Clássico remonta com outro ID, mesmo se repetir palavra.
    if (previousSecret.current === secret) return
    previousSecret.current = secret
    resetBoard()
  }, [secret])

  function addLetter(letter) {
    if (isGameOver) return
    dispatchInput({ type: "letter", letter })
  }

  function deleteLetter() {
    if (isGameOver) return
    dispatchInput({ type: "delete" })
  }

  function selectCell(row, column) {
    if (isGameOver) return
    dispatchInput({ type: "select", row, column })
  }

  function moveCursor(direction) {
    if (isGameOver) return
    dispatchInput({ type: "move", direction })
  }

  function clearCurrentRow() {
    if (isGameOver) return
    dispatchInput({ type: "clear" })
  }

  function submitGuess() {
    if (isGameOver) return null
    if (!dictionaryRef.current) return null

    const guess = board[currentRow].join("")

    if (guess.length !== 5) return null

    if (!dictionaryRef.current?.has(guess)) {
      setInvalidWord(true)
      setTimeout(() => setInvalidWord(false), 1000)
      return null
    }

    const result = checkGuess(secret, guess)

    setResults((prev) => {
      const newResults = [...prev]
      newResults[currentRow] = result
      return newResults
    })

    const isWinner = result.every((r) => r === "correct")

    if (isWinner) {
      onFinish?.()
      setIsGameOver(true)
      setStreak((prev) => prev + 1)
      return true
    }

    if (currentRow === 5) {
      onFinish?.()
      setIsGameOver(true)
      setStreak(0)
      return false
    }

    dispatchInput({ type: "next-row" })
    return false
  }

  function resetBoard() {
    dispatchInput({ type: "reset" })
    setResults(Array(6).fill(null))
    setIsGameOver(false)
  }

  return {
    board,
    results,
    addLetter,
    deleteLetter,
    clearCurrentRow,
    submitGuess,
    isGameOver,
    streak,
    currentRow,
    currentCol,
    selectCell,
    moveCursor,
    isManualSelection,
    resetBoard,
    setExternalStreak: setStreak,
    invalidWord
  }
}
