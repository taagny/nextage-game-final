import { useEffect } from "react"

function Modal({ children, isOpen }) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      {children}
    </div>
  )
}

export default Modal