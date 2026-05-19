import { useEffect, useRef, useState } from "react"
import { checkGuess } from "../utils/gameLogic"

export function useWordle(secret) {

  const [board, setBoard] = useState(
    Array(6).fill(null).map(() => Array(5).fill(""))
  )

  const [results, setResults] = useState(
    Array(6).fill(null)
  )

  const [currentRow, setCurrentRow] = useState(0)
  const [currentCol, setCurrentCol] = useState(0)
  const [isManualSelection, setIsManualSelection] = useState(false)
  const [isGameOver, setIsGameOver] = useState(false)
  const [streak, setStreak] = useState(0)
  const [invalidWord, setInvalidWord] = useState(false)

  const dictionaryRef = useRef(null)

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
    setBoard(Array(6).fill(null).map(() => Array(5).fill("")))
    setResults(Array(6).fill(null))
    setCurrentRow(0)
    setCurrentCol(0)
    setIsManualSelection(false)
    setIsGameOver(false)
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

  function submitGuess() {
    if (isGameOver) return false
    if (!dictionaryRef.current) return false

    const guess = board[currentRow].join("")

    if (guess.length !== 5) return false

    if (!dictionaryRef.current?.has(guess)) {
      setInvalidWord(true)
      setTimeout(() => setInvalidWord(false), 1000)
      return false
    }

    const result = checkGuess(secret, guess)

    setResults(prev => {
      const newResults = [...prev]
      newResults[currentRow] = result
      return newResults
    })

    const isWinner = result.every(r => r === "correct")

    if (isWinner) {
      setIsGameOver(true)
      setStreak(prev => prev + 1)
      return true
    }

    if (currentRow === 5) {
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
  }
}