
import { useEffect } from "react"

function Modal({ children, isOpen, onClose, closeDisabled = false }) {
  useEffect(() => {
    if (!isOpen || !onClose || closeDisabled) return
    function handleKey(event) {
      if (event.key !== "Escape" || event.defaultPrevented) return
      event.preventDefault()
      onClose()
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [isOpen, onClose, closeDisabled])

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={event => {
      if (event.target === event.currentTarget && !closeDisabled) onClose?.()
    }}>
      {children}
    </div>
  )
}

export default Modal
