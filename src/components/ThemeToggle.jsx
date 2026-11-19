import { useEffect, useState } from "react"

const storageKey = "nextage:theme"

export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || "dark")
  const isLight = theme === "light"

  useEffect(() => {
    function syncTheme(event) {
      if (event.key !== storageKey && event.key !== null) return
      const next = event.key === storageKey && event.newValue === "light" ? "light" : "dark"
      document.documentElement.dataset.theme = next
      setTheme(next)
    }
    window.addEventListener("storage", syncTheme)
    return () => window.removeEventListener("storage", syncTheme)
  }, [])

  function toggleTheme() {
    const next = isLight ? "dark" : "light"
    document.documentElement.dataset.theme = next
    setTheme(next)
    try {
      localStorage.setItem(storageKey, next)
    } catch {
      // A troca continua funcionando quando o navegador bloqueia o armazenamento.
    }
  }

  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label="Modo claro"
      aria-pressed={isLight}
      title={isLight ? "Ativar modo escuro" : "Ativar modo claro"}
      onClick={toggleTheme}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") event.stopPropagation()
      }}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        aria-hidden="true"
      >
        {isLight ? (
          <path d="M20.5 14A8.5 8.5 0 0 1 10 3.5 8.5 8.5 0 1 0 20.5 14Z" />
        ) : (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" />
          </>
        )}
      </svg>
    </button>
  )
}
