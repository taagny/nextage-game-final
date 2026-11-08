import { useState } from "react"
import Modal from "./Modal"
import { CONTACT_EMAIL, TERMS_VERSION } from "../utils/constants"

function TermsModal({ isOpen, onAccept, onReject }) {
  const [decision, setDecision] = useState("")
  const [error, setError] = useState("")

  async function decide(name, callback) {
    if (decision) return
    setDecision(name)
    setError("")
    try {
      await callback()
    } catch (error) {
      console.error("Não foi possível registrar a decisão sobre o termo.", error?.code ?? error?.name)
      setError("Não foi possível concluir sua solicitação. Tente novamente.")
    } finally {
      setDecision("")
    }
  }

  return (
    <Modal isOpen={isOpen}>
      <section className="modal-card terms-modal" role="dialog" aria-modal="true" aria-labelledby="terms-title">
        <h2 id="terms-title" className="terms-title">Termo de Consentimento</h2>
        <p className="terms-version">Versão {TERMS_VERSION}</p>
        <div className="terms-content">
          <p>
            O NEXTAGE é um jogo de palavras desenvolvido como Trabalho de Conclusão de Curso.
            A finalidade da coleta é avaliar o uso e o desempenho da plataforma para fins acadêmicos.
          </p>
          <p>Ao utilizar uma conta e aceitar este termo, são registrados:</p>
          <ul>
            <li>Identificador da conta, apelido e datas de criação do perfil e de aceite da versão do termo;</li>
            <li>Palavras jogadas no modo Clássico, tentativas, vitórias, derrotas, abandonos ao sair da conta e tempo de jogo;</li>
            <li>Sequências de vitórias e sequências perdidas, distribuição de acertos, médias e nível de experiência calculado a partir das vitórias;</li>
            <li>Melhores pontuações do Runner para cada duração.</li>
          </ul>
          <p>
            Nome e e-mail ficam no Firebase Authentication para acesso à conta e não são copiados
            para os documentos de jogo v2. Na pesquisa, o identificador é substituído por um código
            pseudonimizado, sem nome, e-mail ou apelido. Dados pseudonimizados continuam podendo
            ser relacionados à conta por quem dispõe das informações necessárias.
          </p>
          <p>
            O ranking é público e mostra seu apelido, sequência atual, sequências perdidas
            e pontuações do Runner. Você pode alterar o apelido nas configurações do perfil.
          </p>
          <p>
            Você pode exportar seus dados e o histórico de partidas e excluir sua conta
            nas configurações do perfil. A exclusão pede confirmação e nova autenticação.
          </p>
          <p className="terms-highlight">
            A participação é voluntária. Você pode recusar o termo, encerrar a sessão
            e continuar jogando como visitante; partidas de visitantes não são salvas.
            Uma nova versão do termo exige novo aceite.
          </p>
          <p>
            Contato do responsável: {CONTACT_EMAIL
              ? <a href={"mailto:" + CONTACT_EMAIL}>{CONTACT_EMAIL}</a>
              : "temporariamente indisponível. Tente novamente mais tarde."}
          </p>
        </div>
        {error && <p role="alert">{error}</p>}
        <div className="terms-actions">
          <button className="terms-btn accept" disabled={Boolean(decision) || !CONTACT_EMAIL}
            onClick={() => decide("accept", onAccept)}>
            {decision === "accept" ? "Registrando…" : "Aceito"}
          </button>
          <button className="terms-btn reject" disabled={Boolean(decision)}
            onClick={() => decide("reject", onReject)}>
            {decision === "reject" ? "Saindo…" : "Não aceito"}
          </button>
        </div>
      </section>
    </Modal>
  )
}

export default TermsModal
