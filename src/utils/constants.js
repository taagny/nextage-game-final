export const TERMS_VERSION = "2"
export const NICKNAME_MIN = 3
export const NICKNAME_MAX = 20
export const LOSS_ATTEMPTS = 7
export const CONTACT_EMAIL = import.meta.env?.VITE_CONTACT_EMAIL ?? ""

// Configuração local/de publicação; não gravar UIDs reais em arquivos versionados.
export const EXCLUDED_FROM_RESEARCH_UIDS = (import.meta.env?.VITE_EXCLUDED_FROM_RESEARCH_UIDS ?? "")
  .split(",").map(uid => uid.trim()).filter(Boolean)
