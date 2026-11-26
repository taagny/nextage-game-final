import { useEffect, useEffectEvent } from "react"

export function useBoardKeyboard(onKey, enabled = true) {
  const handleKey = useEffectEvent((event) => {
    if (
      !enabled ||
      event.defaultPrevented ||
      event.isComposing ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      event.target?.closest?.(
        "input, textarea, select, [contenteditable]:not([contenteditable='false'])"
      ) ||
      document.querySelector(".modal-overlay")
    )
      return

    const key = event.key?.toUpperCase() ?? ""
    if (!["ENTER", "BACKSPACE", "ARROWLEFT", "ARROWRIGHT"].includes(key) && !/^[A-Z]$/.test(key))
      return

    event.preventDefault()
    onKey(key)
  })

  useEffect(() => {
    const listener = (event) => handleKey(event)
    window.addEventListener("keydown", listener)
    return () => window.removeEventListener("keydown", listener)
  }, [])
}
