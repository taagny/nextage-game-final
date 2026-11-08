const pending = new Map()
const blocked = new Set()
const deleting = new Set()

function deletionInProgress() {
  const error = new Error("A exclusão desta conta está em andamento ou precisa ser concluída.")
  error.code = "account/deleting"
  return error
}

export function withPlayerWrite(uid, write) {
  if (blocked.has(uid)) return Promise.reject(deletionInProgress())
  const writes = pending.get(uid) ?? new Set()
  pending.set(uid, writes)
  const operation = Promise.resolve().then(write)
  writes.add(operation)
  const clear = () => {
    writes.delete(operation)
    if (writes.size === 0) pending.delete(uid)
  }
  operation.then(clear, clear)
  return operation
}

export async function beginAccountDeletion(uid) {
  if (deleting.has(uid)) throw deletionInProgress()
  blocked.add(uid)
  deleting.add(uid)
  await Promise.allSettled([...(pending.get(uid) ?? [])])
}

export function finishAccountDeletion(uid, complete) {
  deleting.delete(uid)
  // Em falhas parciais, novas gravações ficam bloqueadas neste cliente até tentar
  // concluir a exclusão. Isso não coordena outras abas/dispositivos.
  if (complete) blocked.delete(uid)
}
