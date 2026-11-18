import { useState } from "react"
import Modal from "./Modal"
import { CONTACT_EMAIL, TERMS_VERSION } from "../utils/constants"

function TermsModal({ isOpen, onAccept, onReject, researchOnly = false }) {
  const [decision, setDecision] = useState("")
  const [error, setError] = useState("")
  const [participate, setParticipate] = useState(false)

  async function decide(name, callback) {
    if (decision) return
    setDecision(name)
    setError("")
    try {
      await callback()
      setParticipate(false)
    } catch (error) {
      console.error(
        "Não foi possível registrar a decisão sobre o termo.",
        error?.code ?? error?.name
      )
      setError("Não foi possível concluir sua solicitação. Tente novamente.")
    } finally {
      setDecision("")
    }
  }

  return (
    <Modal isOpen={isOpen}>
      <section
        className="modal-card terms-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="terms-title"
      >
        <h2 id="terms-title" className="terms-title">
          {researchOnly ? "Participação na pesquisa" : "Privacidade e uso da conta"}
        </h2>
        <p className="terms-version">Versão {TERMS_VERSION}</p>
        <div className="terms-content">
          <p>
            O NEXTAGE é um jogo de palavras desenvolvido como Trabalho de Conclusão de Curso. Os
            dados da conta permitem salvar seu progresso e apresentar seu perfil e ranking.
            Autorizar seu uso em pesquisa acadêmica é uma escolha separada e opcional.
          </p>
          <p>Ao utilizar uma conta, são registrados:</p>
          <ul>
            <li>
              Identificador da conta, apelido e datas de criação do perfil e de aceite da versão do
              termo;
            </li>
            <li>
              Palavras jogadas no modo Clássico, tentativas, vitórias, derrotas, abandonos ao sair
              da conta e tempo de jogo;
            </li>
            <li>
              Sequências de vitórias e sequências perdidas, distribuição de acertos, médias e nível
              de experiência calculado a partir das vitórias;
            </li>
            <li>Melhores pontuações do Runner para cada duração.</li>
          </ul>
          <p>
            Nome e e-mail ficam no Firebase Authentication para acesso à conta e não são copiados
            para os documentos de jogo. Na pesquisa, o identificador é substituído por um código
            pseudonimizado, sem nome, e-mail ou apelido. Dados pseudonimizados continuam podendo ser
            relacionados à conta por quem dispõe das informações necessárias.
          </p>
          <p>
            O ranking é público e mostra seu apelido, sequência atual, sequências perdidas e
            pontuações do Runner. Você pode alterar o apelido nas configurações do perfil.
          </p>
          <p>
            Você pode exportar seus dados e o histórico de partidas e excluir sua conta nas
            configurações do perfil. A exclusão pede confirmação e nova autenticação.
          </p>
          <p className="terms-highlight">
            A pesquisa avalia o uso e o desempenho do NEXTAGE a partir das estatísticas e do
            histórico da conta, inclusive partidas anteriores à autorização. A participação é
            voluntária e não é necessária para usar a conta, salvar partidas ou aparecer no ranking.
            Você pode revogar a autorização nas configurações e continuar jogando normalmente. Após
            a revogação, seus dados deixam de integrar as próximas exportações de pesquisa.
          </p>
          <p>
            A revogação não recolhe arquivos já exportados. Para solicitar o tratamento desses
            arquivos ou a eliminação de dados da pesquisa, entre em contato com o responsável. A
            exclusão da conta é uma opção independente. Uma nova versão da autorização de pesquisa
            exige nova escolha explícita.
          </p>
          <p>
            Contato do responsável:{" "}
            {CONTACT_EMAIL ? (
              <a href={"mailto:" + CONTACT_EMAIL}>{CONTACT_EMAIL}</a>
            ) : (
              "temporariamente indisponível. Tente novamente mais tarde."
            )}
          </p>
        </div>
        {!researchOnly && (
          <label className="terms-research-choice">
            <input
              type="checkbox"
              checked={participate}
              disabled={Boolean(decision) || !CONTACT_EMAIL}
              onChange={(event) => setParticipate(event.target.checked)}
            />
            Autorizo, opcionalmente, o uso das estatísticas e do histórico da minha conta na
            pesquisa descrita acima.
          </label>
        )}
        {error && <p role="alert">{error}</p>}
        <div className="terms-actions">
          <button
            className="terms-btn accept"
            disabled={Boolean(decision) || !CONTACT_EMAIL}
            onClick={() => decide("accept", () => onAccept(researchOnly || participate))}
          >
            {decision === "accept"
              ? "Registrando…"
              : researchOnly
                ? "Autorizar participação"
                : "Aceitar uso da conta e continuar"}
          </button>
          <button
            className="terms-btn reject"
            disabled={Boolean(decision)}
            onClick={() => decide("reject", onReject)}
          >
            {decision === "reject"
              ? "Aguarde…"
              : researchOnly
                ? "Cancelar"
                : "Sair e jogar como visitante"}
          </button>
        </div>
      </section>
    </Modal>
  )
}

export default TermsModal
