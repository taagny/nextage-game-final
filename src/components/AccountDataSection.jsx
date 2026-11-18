import { useRef, useState } from "react"
import { createPortal } from "react-dom"
import { deleteMyAccount, exportMyDataJSON, exportMyMatchesCSV } from "../services/accountService"
import { reauthenticationMethod } from "../utils/accountDeletion"
import { downloadFile } from "../utils/download"
import { useAuth } from "../context/useAuth"
import { hasResearchConsent } from "../utils/researchConsent"
import TermsModal from "./TermsModal"

function accountError(error) {
  const messages = {
    "auth/popup-blocked":
      "O navegador bloqueou a janela do Google. Permita sua abertura e tente novamente.",
    "auth/popup-closed-by-user":
      "A confirmação com o Google foi cancelada. A exclusão não foi iniciada nesta tentativa.",
    "auth/cancelled-popup-request": "A confirmação com o Google foi cancelada. Tente novamente.",
    "auth/invalid-credential": "A senha não foi aceita. Confira a senha e tente novamente.",
    "auth/wrong-password": "A senha não foi aceita. Confira a senha e tente novamente.",
    "auth/user-mismatch": "Confirme a mesma conta que está conectada ao NEXTAGE.",
    "auth/requires-recent-login": "Entre novamente na conta antes de repetir a solicitação.",
    "auth/network-request-failed":
      "Não foi possível conectar. Verifique sua conexão e tente novamente.",
    "permission-denied": "Não foi possível acessar seus dados. Entre novamente e tente outra vez."
  }
  return (
    messages[error?.code] ??
    error?.message ??
    "Não foi possível concluir a operação. Tente novamente."
  )
}

export default function AccountDataSection({ user, onBusyChange, disabled = false }) {
  const [action, setAction] = useState("")
  const [confirming, setConfirming] = useState(false)
  const [confirmation, setConfirmation] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [reviewResearch, setReviewResearch] = useState(false)
  const { researchPlayer, changeResearchConsent } = useAuth()
  const researchActive = hasResearchConsent(researchPlayer)
  const busy = useRef(false)
  const method = reauthenticationMethod(user)
  const canDelete =
    confirmation === "EXCLUIR" && method && (method !== "password" || password.length > 0)
  const unavailable = disabled || Boolean(action)

  async function execute(name, operation) {
    if (busy.current || disabled) return
    busy.current = true
    setAction(name)
    setError("")
    setMessage("")
    onBusyChange(true)
    try {
      await operation()
      if (name === "research") {
        setMessage("Participação atualizada. Sua conta e seu progresso foram mantidos.")
        setReviewResearch(false)
      } else if (name !== "delete") setMessage("Arquivo gerado para download.")
      return true
    } catch (error) {
      console.error("Falha na operação da conta.", error?.code ?? error?.name)
      setError(accountError(error))
      return false
    } finally {
      setPassword("")
      setAction("")
      busy.current = false
      onBusyChange(false)
    }
  }

  function closeConfirmation() {
    setConfirming(false)
    setConfirmation("")
    setPassword("")
    setError("")
  }

  return (
    <section className="account-data" aria-labelledby="account-data-title">
      <section className="account-research" aria-labelledby="account-research-title">
        <h3 id="account-research-title">Participação na pesquisa</h3>
        <p>
          {!researchPlayer
            ? "Não foi possível consultar sua participação. Tente novamente mais tarde."
            : researchActive
              ? "Ativa. Seus dados podem integrar as exportações acadêmicas."
              : "Não autorizada. Seus dados ficam fora das exportações acadêmicas."}
        </p>
        <p>
          Essa escolha não altera sua conta, histórico ou ranking. Revogar impede novas exportações;
          para arquivos já exportados, contate o responsável informado no termo.
        </p>
        <button
          type="button"
          className="modal-btn"
          disabled={unavailable || !researchPlayer}
          onClick={() => {
            if (researchActive) execute("research", () => changeResearchConsent(false))
            else {
              setReviewResearch(true)
              onBusyChange(true)
            }
          }}
        >
          {action === "research"
            ? "Atualizando…"
            : researchActive
              ? "Revogar participação"
              : "Ler termo e participar"}
        </button>
        {reviewResearch &&
          createPortal(
            <TermsModal
              isOpen
              researchOnly
              onAccept={async () => {
                if (!(await execute("research", () => changeResearchConsent(true)))) {
                  onBusyChange(true)
                  throw new Error("Não foi possível atualizar a participação.")
                }
              }}
              onReject={() => {
                setReviewResearch(false)
                onBusyChange(false)
              }}
            />,
            document.body
          )}
      </section>
      <h3 id="account-data-title">Meus dados</h3>
      <p>Exporte os dados registrados na plataforma em JSON ou o histórico de partidas em CSV.</p>
      <div className="account-data-actions">
        <button
          type="button"
          className="modal-btn green"
          disabled={unavailable}
          onClick={() =>
            execute("json", async () => {
              const data = await exportMyDataJSON(user.uid)
              downloadFile(
                JSON.stringify(data, null, 2),
                "nextage_meus_dados.json",
                "application/json;charset=utf-8"
              )
            })
          }
        >
          {action === "json" ? "Gerando JSON…" : "Exportar meus dados (JSON)"}
        </button>
        <button
          type="button"
          className="modal-btn green"
          disabled={unavailable}
          onClick={() =>
            execute("csv", async () => {
              const csv = await exportMyMatchesCSV(user.uid)
              downloadFile(csv, "nextage_minhas_partidas.csv", "text/csv;charset=utf-8")
            })
          }
        >
          {action === "csv" ? "Gerando CSV…" : "Exportar partidas (CSV)"}
        </button>
      </div>
      <button
        type="button"
        className="modal-btn red"
        disabled={unavailable}
        onClick={() => {
          setConfirming(true)
          setError("")
          setMessage("")
        }}
      >
        Excluir minha conta
      </button>

      {confirming && (
        <div className="account-delete-panel">
          <p id="account-delete-description">
            Esta ação apaga partidas, histórico por palavra, perfil público, estatísticas e seu
            cadastro de acesso. Não é possível desfazer as exclusões.
          </p>
          <p>Mantenha esta tela aberta até o término.</p>
          <label htmlFor="account-delete-confirmation">Digite EXCLUIR para confirmar:</label>
          <input
            id="account-delete-confirmation"
            className="settings-input-modern"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            autoComplete="off"
            maxLength={7}
            disabled={unavailable}
            aria-describedby="account-delete-description"
          />
          {method === "password" && (
            <>
              <label htmlFor="account-delete-password">Senha da conta:</label>
              <input
                id="account-delete-password"
                type="password"
                className="settings-input-modern"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={unavailable}
              />
            </>
          )}
          {method === "google" && <p>Você confirmará sua identidade em uma janela do Google.</p>}
          {!method && (
            <p>Entre novamente com Google ou e-mail e senha para confirmar a exclusão.</p>
          )}
          <div className="account-data-actions">
            <button
              type="button"
              className="modal-btn red"
              disabled={unavailable || !canDelete}
              onClick={() => execute("delete", () => deleteMyAccount(user, { password }))}
            >
              {action === "delete" ? "Excluindo conta…" : "Confirmar exclusão"}
            </button>
            <button
              type="button"
              className="modal-btn"
              disabled={unavailable}
              onClick={closeConfirmation}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
      {error && <p role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}
    </section>
  )
}
