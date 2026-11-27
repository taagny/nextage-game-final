import AccountDataSection from "../AccountDataSection"
import { NICKNAME_MIN, NICKNAME_MAX } from "../../utils/constants"

export default function ProfileSettings({
  user,
  nickname,
  nicknameDraft,
  setNicknameDraft,
  setNicknameTouched,
  nicknameTouched,
  nicknameError,
  profileLoading,
  savingNickname,
  accountBusy,
  setAccountBusy,
  handleSave,
  onClose
}) {
  return (
    <div className="settings-section">
      <label className="settings-label" htmlFor="nickname-input">
        Apelido público:
      </label>

      <input
        id="nickname-input"
        type="text"
        value={nicknameDraft}
        onChange={(e) => {
          setNicknameDraft(e.target.value)
          setNicknameTouched(true)
        }}
        minLength={NICKNAME_MIN}
        maxLength={NICKNAME_MAX}
        pattern="[A-Za-z0-9_-]+"
        required
        disabled={profileLoading || savingNickname || accountBusy}
        aria-invalid={nicknameTouched && Boolean(nicknameError)}
        aria-describedby="nickname-help nickname-error"
        className="settings-input-modern"
      />
      <p id="nickname-help">
        De {NICKNAME_MIN} a {NICKNAME_MAX} caracteres: letras sem acento, números, _ e -. Seu
        apelido aparece nos rankings públicos.
      </p>
      <p id="nickname-error" role="alert">
        {nicknameTouched ? nicknameError : ""}
      </p>

      <div className="settings-actions">
        <button
          className="modal-btn green"
          onClick={handleSave}
          disabled={
            profileLoading ||
            savingNickname ||
            accountBusy ||
            Boolean(nicknameError) ||
            nicknameDraft === nickname
          }
        >
          {savingNickname ? "Salvando…" : "Salvar"}
        </button>

        <button className="modal-btn red" onClick={onClose} disabled={accountBusy}>
          Cancelar
        </button>
      </div>
      <AccountDataSection
        user={user}
        onBusyChange={setAccountBusy}
        disabled={savingNickname || profileLoading}
      />
    </div>
  )
}
