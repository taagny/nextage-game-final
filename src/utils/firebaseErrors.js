const authMessages = {
  "auth/invalid-credential": "Email ou senha incorretos.",
  "auth/user-not-found": "Email ou senha incorretos.",
  "auth/wrong-password": "Email ou senha incorretos.",
  "auth/email-already-in-use": "Este email já está cadastrado.",
  "auth/invalid-email": "Email inválido.",
  "auth/weak-password": "Senha muito fraca. Use pelo menos 6 caracteres.",
  "auth/too-many-requests": "Muitas tentativas. Tente novamente mais tarde.",
  "auth/network-request-failed":
    "Não foi possível conectar ao serviço de login. Verifique sua conexão e tente novamente.",
  "auth/user-disabled": "Esta conta está desativada. Entre em contato com o responsável.",
  "auth/operation-not-allowed": "Esta forma de login está indisponível no momento.",
  "auth/unauthorized-domain": "O login não está disponível neste endereço do site.",
  "auth/invalid-api-key": "O serviço de login está indisponível neste ambiente.",
  "auth/app-not-authorized": "O serviço de login está indisponível neste ambiente.",
  "auth/internal-error": "O serviço de login está indisponível neste ambiente.",
  "auth/popup-blocked":
    "O navegador bloqueou a janela de login. Permita a abertura e tente novamente.",
  "auth/popup-closed-by-user": "O login foi cancelado. Você pode tentar novamente.",
  "auth/cancelled-popup-request":
    "Outra tentativa de login foi iniciada. Aguarde e tente novamente."
}

// Não retornar error.message: respostas brutas podem conter dados da requisição.
export function authErrorMessage(error) {
  return authMessages[error?.code] ?? "Não foi possível entrar agora. Tente novamente em instantes."
}

export function rankingErrorMessage(error) {
  if (["unavailable", "deadline-exceeded"].includes(error?.code)) {
    return "Não foi possível conectar ao ranking. Verifique sua conexão e tente novamente."
  }
  if (["permission-denied", "failed-precondition", "unauthenticated"].includes(error?.code)) {
    return "O ranking está indisponível neste ambiente. Tente novamente mais tarde."
  }
  return "Não foi possível carregar o ranking. Tente novamente."
}

export function firebaseErrorCode(error) {
  return typeof error?.code === "string" && /^(auth\/)?[a-z-]+$/.test(error.code)
    ? error.code
    : "unknown"
}
