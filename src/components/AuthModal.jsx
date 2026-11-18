import { useState } from "react"
import {
  registerWithPassword,
  loginWithPassword,
  loginWithGoogle,
  requestPasswordReset
} from "../services/authService"
import { authErrorMessage, firebaseErrorCode } from "../utils/firebaseErrors.js"
import Modal from "./Modal"
import "../styles/auth.css"

function AuthModal({ isOpen, onClose }) {
  const [isLogin, setIsLogin] = useState(true)

  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [confirmSenha, setConfirmSenha] = useState("")
  const [submissionErrors, setErrors] = useState({})
  const [infoMessage, setInfoMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fieldErrors = (() => {
    const newErrors = {}
    const emailRegex = /^\S+@\S+\.\S+$/

    if (email && !emailRegex.test(email)) {
      newErrors.email = "Digite um email válido"
    }

    if (senha && senha.length < 6) {
      newErrors.senha = "Senha deve ter no mínimo 6 caracteres"
    }

    if (!isLogin && confirmSenha && senha !== confirmSenha) {
      newErrors.confirmSenha = "As senhas não coincidem"
    }

    return newErrors
  })()
  const errors = { ...submissionErrors, ...fieldErrors }

  async function handleSubmit(e) {
    e.preventDefault()
    setInfoMessage("")
    if (isSubmitting || Object.keys(fieldErrors).length > 0) return
    setErrors({})
    setIsSubmitting(true)

    try {
      if (isLogin) {
        await loginWithPassword(email, senha)
      } else {
        if (!nome.trim()) {
          setErrors((prev) => ({ ...prev, nome: "Digite seu nome" }))
          return
        }

        await registerWithPassword(email, senha)
      }

      handleClose()
    } catch (error) {
      console.error("Falha na autenticação:", firebaseErrorCode(error))
      setErrors({ firebase: authErrorMessage(error) })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleGoogle() {
    if (isSubmitting) return
    setInfoMessage("")
    setErrors({})
    setIsSubmitting(true)
    try {
      await loginWithGoogle()
      handleClose()
    } catch (error) {
      console.error("Falha na autenticação Google:", firebaseErrorCode(error))
      setErrors({ firebase: authErrorMessage(error) })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleResetPassword() {
    setErrors({})
    setInfoMessage("")

    if (!email) {
      setErrors({ email: "Digite seu email para recuperar a senha" })
      return
    }

    try {
      await requestPasswordReset(email)
      setInfoMessage("Se o email estiver cadastrado, você receberá as instruções de recuperação.")
    } catch {
      setInfoMessage("Se o email estiver cadastrado, você receberá as instruções de recuperação.")
    }
  }

  function handleClose() {
    setNome("")
    setEmail("")
    setSenha("")
    setConfirmSenha("")
    setErrors({})
    setInfoMessage("")
    onClose()
  }

  const isFormValid =
    email &&
    senha &&
    (isLogin || (nome && confirmSenha)) &&
    Object.keys(fieldErrors).length === 0 &&
    !isSubmitting

  return (
    <Modal isOpen={isOpen}>
      <div className="auth-card">
        <button className="close-btn" onClick={handleClose}>
          ×
        </button>

        <h2>{isLogin ? "Entrar" : "Criar Conta"}</h2>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <input
                type="text"
                placeholder="Nome"
                value={nome}
                onChange={(e) => {
                  setNome(e.target.value)
                  setErrors({})
                }}
                className={errors.nome ? "error-input" : ""}
              />
              {errors.nome && <span className="error">{errors.nome}</span>}
            </>
          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setErrors({})
            }}
            className={errors.email ? "error-input" : ""}
          />
          {errors.email && <span className="error">{errors.email}</span>}

          <input
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={(e) => {
              setSenha(e.target.value)
              setErrors({})
            }}
            className={errors.senha ? "error-input" : ""}
          />
          {errors.senha && <span className="error">{errors.senha}</span>}

          {!isLogin && (
            <>
              <input
                type="password"
                placeholder="Confirmar senha"
                value={confirmSenha}
                onChange={(e) => {
                  setConfirmSenha(e.target.value)
                  setErrors({})
                }}
                className={errors.confirmSenha ? "error-input" : ""}
              />
              {errors.confirmSenha && <span className="error">{errors.confirmSenha}</span>}
            </>
          )}

          {errors.firebase && <span className="error">{errors.firebase}</span>}
          {infoMessage && <span className="info-message">{infoMessage}</span>}

          <button type="submit" disabled={!isFormValid}>
            {isLogin ? "Entrar" : "Criar Conta"}
          </button>
        </form>

        <button className="google-btn" onClick={handleGoogle}>
          <span className="google-icon">
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path
                fill="#FFC107"
                d="M43.6 20H42V20H24v8h11.3C33.9 32.7 29.4 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-4z"
              />
              <path
                fill="#FF3D00"
                d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.7 1.1 7.8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
              />
              <path
                fill="#4CAF50"
                d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"
              />
              <path
                fill="#1976D2"
                d="M43.6 20H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.7-.4-4z"
              />
            </svg>
          </span>
          <span>Entrar com Google</span>
        </button>

        {isLogin && (
          <p className="forgot-password" onClick={handleResetPassword}>
            Esqueci a senha
          </p>
        )}

        <p
          className="switch"
          onClick={() => {
            setIsLogin(!isLogin)
            setNome("")
            setEmail("")
            setSenha("")
            setConfirmSenha("")
            setErrors({})
            setInfoMessage("")
          }}
        >
          {isLogin ? "Não tem conta? Criar conta" : "Já tem conta? Entrar"}
        </p>
      </div>
    </Modal>
  )
}

export default AuthModal
