import { getIdTokenResult } from "firebase/auth"

export async function getAdminStatus(user) {
  const token = await getIdTokenResult(user)
  return token.claims.admin === true
}
