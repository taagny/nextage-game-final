// Preload exclusivo do processo filho do Firebase CLI. Não inicializa Firebase.
let signalReceived = false
process.on("SIGINT", () => { signalReceived = true })
process.on("SIGTERM", () => { signalReceived = true })
process.on("message", message => {
  if (message?.type !== "nextage:shutdown" || signalReceived) return
  // Aguarda o CLI registrar o handler que exporta os dados e encerra o Java.
  const timer = setInterval(() => {
    if (signalReceived) return clearInterval(timer)
    if (process.listenerCount("SIGINT") > 1) {
      clearInterval(timer)
      process.emit("SIGINT")
    }
  }, 25)
})
// O canal de controle não deve impedir a saída natural do CLI após os testes.
process.channel?.unref()
