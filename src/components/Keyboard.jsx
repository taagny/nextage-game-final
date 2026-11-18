const rows = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACKSPACE"]
]

function Keyboard({ onKeyPress, results, board }) {
  function getKeyStatus(letter) {
    let status = null

    board.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        if (cell !== letter) return

        const cellStatus = results[rowIndex]?.[colIndex]

        if (cellStatus === "correct") {
          status = "correct"
        } else if (cellStatus === "present" && status !== "correct") {
          status = "present"
        } else if (cellStatus === "absent" && !status) {
          status = "absent"
        }
      })
    })

    return status
  }

  return (
    <div className="keyboard">
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="keyboard-row">
          {row.map((key) => {
            const status = getKeyStatus(key)
            let className = "key"

            if (status === "correct") className += " key-correct"
            if (status === "present") className += " key-present"
            if (status === "absent") className += " key-absent"
            if (key === "ENTER" || key === "BACKSPACE") className += " key-wide"

            return (
              <button key={key} className={className} onClick={() => onKeyPress(key)}>
                {key === "BACKSPACE" ? "⌫" : key}
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}

export default Keyboard
