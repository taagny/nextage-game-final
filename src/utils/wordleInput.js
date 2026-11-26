export function createWordleInput(initialState) {
  return {
    board:
      initialState?.board.map((row) => [...row]) ??
      Array.from({ length: 6 }, () => Array(5).fill("")),
    currentRow: initialState?.currentRow ?? 0,
    currentCol: initialState?.currentCol ?? 0,
    isManualSelection: initialState?.isManualSelection ?? false
  }
}

function updateRow(state, row, currentCol, isManualSelection) {
  const board = [...state.board]
  board[state.currentRow] = row
  return { ...state, board, currentCol, isManualSelection }
}

// Letras e cursor mudam juntos, inclusive quando o React agrupa eventos rápidos.
export function wordleInputReducer(state, action) {
  const { currentRow, currentCol, isManualSelection } = state
  switch (action.type) {
    case "letter": {
      if (!/^[A-Z]$/.test(action.letter)) return state
      const row = [...state.board[currentRow]]
      // Ao chegar ao fim, outra letra não deve substituir a última sem seleção.
      if (row[currentCol] !== "" && !isManualSelection) return state
      row[currentCol] = action.letter
      return updateRow(state, row, Math.min(currentCol + 1, 4), currentCol < 4)
    }
    case "delete": {
      const row = [...state.board[currentRow]]
      const column = row[currentCol] !== "" ? currentCol : Math.max(currentCol - 1, 0)
      row[column] = ""
      return updateRow(state, row, column, false)
    }
    case "select":
      if (
        action.row !== currentRow ||
        !Number.isInteger(action.column) ||
        action.column < 0 ||
        action.column > 4
      )
        return state
      return { ...state, currentCol: action.column, isManualSelection: true }
    case "move":
      if (action.direction !== -1 && action.direction !== 1) return state
      return {
        ...state,
        currentCol: Math.max(0, Math.min(currentCol + action.direction, 4)),
        isManualSelection: true
      }
    case "clear":
      return updateRow(state, Array(5).fill(""), 0, false)
    case "next-row":
      if (currentRow === 5) return state
      return { ...state, currentRow: currentRow + 1, currentCol: 0, isManualSelection: false }
    case "reset":
      return createWordleInput()
    default:
      return state
  }
}
