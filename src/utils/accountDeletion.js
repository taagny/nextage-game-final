export function reauthenticationMethod(user) {
  const providers = user.providerData.map(provider => provider.providerId)
  if (providers.includes("google.com")) return "google"
  if (providers.includes("password")) return "password"
  return null
}

export async function deleteInBatches(fetchBatch, commitBatch) {
  while (true) {
    const documents = await fetchBatch(400)
    if (documents.length === 0) return
    if (documents.length > 400) throw new Error("Lote de exclusão excede 400 documentos.")
    await commitBatch(documents)
  }
}

export async function deleteAccountInOrder(steps) {
  // Falhar na reautenticação nunca deve apagar dados.
  await steps.reauthenticate()
  await steps.begin()
  try {
    await steps.removeMatches()
    await steps.removeWords()
    await steps.removeProfiles()
    await steps.removeAuth()
    steps.finish(true)
  } catch (cause) {
    steps.finish(false)
    const error = new Error(
      "A exclusão foi interrompida. Alguns dados podem já ter sido apagados. Tente excluir a conta novamente para concluir.",
      { cause }
    )
    error.code = "account/deletion-incomplete"
    throw error
  }
}
