import { useState } from "react"
import { registerWithPassword, loginWithPassword } from "../services/authService"
import { authErrorMessage, firebaseErrorCode } from "../utils/firebaseErrors.js"
import "../styles/auth.css"

function Auth() {

  const [isLogin, setIsLogin] = useState(true)

  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [confirmSenha, setConfirmSenha] = useState("")

  const [errors, setErrors] = useState({})

  function validate() {
    const newErrors = {}

    const emailRegex = /^\S+@\S+\.\S+$/

    if (!emailRegex.test(email)) {
      newErrors.email = "Digite um email válido"
    }

    if (senha.length < 6) {
      newErrors.senha = "Senha deve ter no mínimo 6 caracteres"
    }

    if (!isLogin) {
      if (!nome.trim()) {
        newErrors.nome = "Digite seu nome"
      }

      if (senha !== confirmSenha) {
        newErrors.confirmSenha = "As senhas não coincidem"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (!validate()) return

    try {
      if (isLogin) {
        await loginWithPassword(email, senha)
      } else {
        await registerWithPassword(email, senha)
      }
    } catch (error) {
      console.error("Falha na autenticação:", firebaseErrorCode(error))
      setErrors({ firebase: authErrorMessage(error) })
    }
  }

  const isFormValid = Object.keys(errors).length === 0 &&
    email &&
    senha &&
    (isLogin || (nome && confirmSenha))

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>{isLogin ? "Entrar" : "Criar Conta"}</h2>

        <form onSubmit={handleSubmit}>

          {!isLogin && (
            <>
              <input
                type="text"
                placeholder="Nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
              {errors.nome && <span className="error">{errors.nome}</span>}
            </>
          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {errors.email && <span className="error">{errors.email}</span>}

          <input
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
          {errors.senha && <span className="error">{errors.senha}</span>}

          {!isLogin && (
            <>
              <input
                type="password"
                placeholder="Confirmar senha"
                value={confirmSenha}
                onChange={(e) => setConfirmSenha(e.target.value)}
              />
              {errors.confirmSenha && <span className="error">{errors.confirmSenha}</span>}
            </>
          )}

          {errors.firebase && <span className="error">{errors.firebase}</span>}

          <button type="submit" disabled={!isFormValid}>
            {isLogin ? "Entrar" : "Criar Conta"}
          </button>

        </form>

        <p onClick={() => setIsLogin(!isLogin)} className="switch">
          {isLogin ? "Não tem conta? Criar conta" : "Já tem conta? Entrar"}
        </p>
      </div>
    </div>
  )
}

export default Auth
