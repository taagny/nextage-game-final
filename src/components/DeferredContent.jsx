import { Component, Suspense } from "react"

class LoadBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error) {
    console.error("Falha ao carregar a interface.", error?.name)
  }
  render() {
    if (!this.state.failed) return this.props.children
    const content = (
      <section className="modal-card" role="alert">
        <p>Não foi possível carregar esta tela. Verifique sua conexão e recarregue a página.</p>
        <button className="modal-btn" onClick={() => window.location.reload()}>
          Recarregar página
        </button>
      </section>
    )
    return this.props.modal ? <div className="modal-overlay">{content}</div> : content
  }
}

export default function DeferredContent({ children, modal = false }) {
  const status = <p role="status">Carregando…</p>
  return (
    <LoadBoundary modal={modal}>
      <Suspense fallback={modal ? <div className="modal-overlay">{status}</div> : status}>
        {children}
      </Suspense>
    </LoadBoundary>
  )
}
