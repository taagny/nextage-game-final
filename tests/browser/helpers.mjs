import { setTimeout as delay } from "node:timers/promises"

export async function until(check, timeout = 30000) {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    if (await check()) return
    await delay(100)
  }
  throw new Error("Tempo esgotado aguardando navegador/aplicativo.")
}

export function debuggerClient(url) {
  const socket = new WebSocket(url)
  let sequence = 0
  const pending = new Map()
  const opened = new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true })
    socket.addEventListener("error", reject, { once: true })
  })
  socket.addEventListener("message", (event) => {
    const response = JSON.parse(event.data)
    const request = pending.get(response.id)
    if (!request) return
    pending.delete(response.id)
    if (response.error) request.reject(new Error(JSON.stringify(response.error)))
    else request.resolve(response.result)
  })
  return {
    async send(method, params = {}) {
      await opened
      const id = ++sequence
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject })
        socket.send(JSON.stringify({ id, method, params }))
      })
    },
    close: () => socket.close()
  }
}
