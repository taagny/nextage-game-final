import { useCallback, useEffect, useState } from "react"

export function useRunner(duration) {
  const [timeLeft, setTimeLeft] = useState(duration)
  const [isRunning, setIsRunning] = useState(false)
  const [score, setScore] = useState(0)

  useEffect(() => {
    if (!isRunning) return
    if (timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [isRunning, timeLeft])

  const start = useCallback(() => {
    setIsRunning(true)
  }, [])

  const stop = useCallback(() => {
    setIsRunning(false)
  }, [])

  function reset(newDuration) {
    setTimeLeft(newDuration)
    setScore(0)
    setIsRunning(false)
  }

  function incrementScore() {
    setScore((prev) => prev + 1)
  }

  return {
    timeLeft,
    isRunning,
    score,
    start,
    stop,
    reset,
    incrementScore
  }
}
