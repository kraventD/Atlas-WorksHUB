import { useState, useEffect, useCallback } from "react"

interface Toast {
  message: string
  id: number
  phase: "entering" | "visible" | "flying"
}

export function XpToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((message: string) => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { message, id, phase: "entering" }])

    setTimeout(() => {
      setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, phase: "visible" } : t)))
    }, 350)

    setTimeout(() => {
      setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, phase: "flying" } : t)))
    }, 2500)

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }, [])

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      addToast(detail?.message || "+XP")
    }
    window.addEventListener("xp-toast", handler)
    return () => window.removeEventListener("xp-toast", handler)
  }, [addToast])

  return (
    <>
      {toasts.map((t) => (
        <div
          key={t.id}
          class={`fixed left-1/2 z-[100] pointer-events-none px-5 py-2.5 rounded-lg bg-orange-500/90 text-black text-xs font-bold shadow-lg shadow-orange-500/20 whitespace-nowrap ${
            t.phase === "entering" ? "animate-toast-in" : ""
          } ${t.phase === "flying" ? "animate-toast-fly" : ""}`}
          style={{ top: t.phase === "flying" ? "80px" : "80px" }}
        >
          {t.message}
        </div>
      ))}
    </>
  )
}
