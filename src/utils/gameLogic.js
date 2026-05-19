export function checkGuess(secret, guess) {
  const solutionChars = secret.split("")
  const guessChars = guess.split("")
  const result = Array(5).fill("absent")

  guessChars.forEach((char, index) => {
    if (char === solutionChars[index]) {
      result[index] = "correct"
      solutionChars[index] = null
      guessChars[index] = null
    }
  })

  guessChars.forEach((char, index) => {
    if (char && solutionChars.includes(char)) {
      result[index] = "present"
      solutionChars[solutionChars.indexOf(char)] = null
    }
  })

  return result
}