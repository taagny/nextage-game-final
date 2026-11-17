import { useEffect, useRef, useState } from "react"
import { checkGuess } from "../utils/gameLogic"

export function useWordle(secret, { initialState, onFinish } = {}) {

  const [board, setBoard] = useState(
    () => initialState?.board.map(row => [...row]) ?? Array(6).fill(null).map(() => Array(5).fill(""))
  )

  const [results, setResults] = useState(
    () => initialState?.results.map(row => row && [...row]) ?? Array(6).fill(null)
  )

  const [currentRow, setCurrentRow] = useState(initialState?.currentRow ?? 0)
  const [currentCol, setCurrentCol] = useState(initialState?.currentCol ?? 0)
  const [isManualSelection, setIsManualSelection] = useState(initialState?.isManualSelection ?? false)
  const [isGameOver, setIsGameOver] = useState(initialState?.isGameOver ?? false)
  const [streak, setStreak] = useState(initialState?.streak ?? 0)
  const [invalidWord, setInvalidWord] = useState(false)

  const dictionaryRef = useRef(null)
  const previousSecret = useRef(secret)

  useEffect(() => {
    fetch("/dictionary.json")
      .then(res => res.json())
      .then(data => {
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

    setBoard(prev => {
      const newBoard = [...prev]
      const row = [...newBoard[currentRow]]

      let targetIndex

      if (isManualSelection) {
        targetIndex = currentCol
      } else {
        targetIndex = row.findIndex(cell => cell === "")
      }

      if (targetIndex !== -1 && targetIndex < 5) {
        row[targetIndex] = letter
        newBoard[currentRow] = row
        setCurrentCol(Math.min(targetIndex + 1, 4))
      }

      return newBoard
    })

    setIsManualSelection(false)
  }

  function deleteLetter() {
    if (isGameOver) return

    setBoard(prev => {
      const newBoard = [...prev]
      const row = [...newBoard[currentRow]]

      let targetIndex

      if (isManualSelection) {
        targetIndex = currentCol
      } else {
        targetIndex = row
          .map((val, index) => val !== "" ? index : -1)
          .filter(index => index !== -1)
          .pop()
      }

      if (targetIndex !== undefined && targetIndex >= 0) {
        row[targetIndex] = ""
        newBoard[currentRow] = row
        setCurrentCol(targetIndex)
      }

      return newBoard
    })

    setIsManualSelection(false)
  }

  function clearCurrentRow() {
    if (isGameOver) return

    setBoard(prev => {
      const newBoard = [...prev]
      newBoard[currentRow] = ["", "", "", "", ""]
      return newBoard
    })

    setCurrentCol(0)
    setIsManualSelection(false)
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

    setResults(prev => {
      const newResults = [...prev]
      newResults[currentRow] = result
      return newResults
    })

    const isWinner = result.every(r => r === "correct")

    if (isWinner) {
      onFinish?.()
      setIsGameOver(true)
      setStreak(prev => prev + 1)
      return true
    }

    if (currentRow === 5) {
      onFinish?.()
      setIsGameOver(true)
      setStreak(0)
      return false
    }

    setCurrentRow(prev => prev + 1)
    setCurrentCol(0)
    setIsManualSelection(false)
    return false
  }

  function resetBoard() {
    setBoard(Array(6).fill(null).map(() => Array(5).fill("")))
    setResults(Array(6).fill(null))
    setCurrentRow(0)
    setCurrentCol(0)
    setIsManualSelection(false)
    setIsGameOver(false)
  }

  function setExternalStreak(value) {
    setStreak(value)
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
    setCurrentCol,
    setIsManualSelection,
    isManualSelection,
    resetBoard,
    setExternalStreak,
    invalidWord
  }
}
