export function downloadFile(content, filename, mimeType) {
  const blob = new Blob([mimeType.startsWith("text/csv") ? "\uFEFF" : "", content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  try {
    link.click()
  } finally {
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
}
