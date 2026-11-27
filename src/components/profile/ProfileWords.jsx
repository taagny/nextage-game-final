import { useEffect, useState } from "react"
import { getHardestWords } from "../../services/wordService"

export default function ProfileWords({ uid, onClose }) {
  const [hardestWords, setHardestWords] = useState([])
  const [wordsLoading, setWordsLoading] = useState(false)
  const [wordsError, setWordsError] = useState("")
  useEffect(() => {
    if (!uid) return
    let active = true
    async function loadWords() {
      setWordsLoading(true)
      setWordsError("")
      setHardestWords([])
      try {
        const words = await getHardestWords(uid, 10)
        if (active) setHardestWords(words)
      } catch (error) {
        console.error(
          "Não foi possível carregar o histórico por palavra.",
          error?.code ?? error?.name
        )
        if (active)
          setWordsError("Não foi possível carregar as palavras. Tente abrir esta aba novamente.")
      } finally {
        if (active) setWordsLoading(false)
      }
    }
    loadWords()
    return () => {
      active = false
    }
  }, [uid])

  return (
    <section
      className="word-history-pane"
      aria-labelledby="word-history-title"
      aria-busy={wordsLoading}
    >
      <h3 id="word-history-title">Maior média de tentativas</h3>
      <p>
        Até 10 palavras das suas partidas concluídas no modo Clássico. Derrotas contam como 7
        tentativas nesta média.
      </p>
      {wordsLoading && <p role="status">Carregando palavras…</p>}
      {wordsError && <p role="alert">{wordsError}</p>}
      {!wordsLoading && !wordsError && hardestWords.length === 0 && (
        <p>Conclua partidas do modo Clássico para começar seu histórico por palavra.</p>
      )}
      {hardestWords.length > 0 && (
        <table className="word-history-table">
          <thead>
            <tr>
              <th scope="col">Palavra</th>
              <th scope="col">Média</th>
              <th scope="col">Partidas</th>
            </tr>
          </thead>
          <tbody>
            {hardestWords.map((word) => (
              <tr key={word.word}>
                <th scope="row">{word.word}</th>
                <td>
                  {word.mediaTentativas.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </td>
                <td>{word.vezesVista.toLocaleString("pt-BR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="profile-actions">
        <button className="close-profile-btn" onClick={onClose}>
          Fechar
        </button>
      </div>
    </section>
  )
}
