import { useState, useEffect, type ReactNode } from "react"
import { Star, Monitor, Trophy, Info, Cpu, HardDrive, Tv, Globe, Users, Clock, Calendar, Tag } from "lucide-react"

interface GameData {
  title: string
  description: string
  rating: number
  year?: number
  release_date?: string
  developer: string
  publisher: string
  duration: string
  players: string
  mode: string
  size: string
  languages: string
  platforms: string[]
  tags: string[]
  genre_names: string[]
  rating: number
  ratings_count?: number
  pc_requirements_min?: string
  pc_requirements_rec?: string
  features: { title: string; description: string }[]
}

function cleanHtml(html: string): string {
  return html?.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ") || ""
}

function SpecRow({ icon, label, value }: { icon: ReactNode; label: string; value?: string }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3 py-2 border-b border-white/5 last:border-0">
      <div className="mt-0.5 shrink-0 text-orange-500">{icon}</div>
      <div>
        <p className="text-gray-500 text-[10px] tracking-wide">{label}</p>
        <p className="text-white text-[13px] font-medium">{value}</p>
      </div>
    </div>
  )
}

export function GameTabs({ game, slug, userId, isAdmin }: { game: GameData; slug?: string; userId?: string | null; isAdmin?: boolean }) {
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.replace("#", "")
      if (hash === "detalles") return 1
      if (hash === "requisitos") return 2
      if (hash === "resenas") return 3
    }
    return 0
  })

  const tabs = [
    { label: "DESCRIPCIÓN", id: "descripcion" },
    { label: "DETALLES", id: "detalles" },
    { label: "REQUISITOS", id: "requisitos" },
    { label: "RESEÑAS", id: "resenas" },
  ]

  // Reviews state
  const [reviews, setReviews] = useState<any[]>([])
  const [newRating, setNewRating] = useState(0)
  const [newContent, setNewContent] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [reviewError, setReviewError] = useState("")
  const [editingReview, setEditingReview] = useState<any>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return
    fetch("/api/auth/get-reviews?slug=" + slug)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setReviews(data) })
      .catch(() => {})
  }, [slug])

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace("#", "")
      if (hash === "detalles") setActiveTab(1)
      else if (hash === "requisitos") { setActiveTab(2); scrollToTabs() }
      else if (hash === "resenas") { setActiveTab(3); scrollToTabs() }
      else if (hash === "descripcion" || hash === "lore-section") { setActiveTab(0); scrollToTabs() }
      else setActiveTab(0)
    }
    const scrollToTabs = () => {
      const el = document.getElementById("game-tabs")
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
    }
    if (window.location.hash.replace("#", "") === "descripcion") scrollToTabs()
    window.addEventListener("hashchange", onHashChange)
    return () => window.removeEventListener("hashchange", onHashChange)
  }, [])

  const handleTabClick = (i: number) => {
    setActiveTab(i)
    window.history.replaceState(null, "", `#${tabs[i].id}`)
  }

  const renderContent = () => {
    switch (activeTab) {
      case 0: // DESCRIPCIÓN
        return (
          <div className="grid grid-cols-1 md:grid-cols-[1.1fr_0.9fr_0.9fr] gap-8">
            <div className="order-3 md:order-1">
              <h3 className="font-display text-lg mb-3 text-[#E0A45C]">{game.title}</h3>
              <div className="overflow-y-auto scrollbar-orange max-h-[240px] pr-2">
                <p className="text-gray-400 text-[13px] leading-relaxed whitespace-pre-line">{game.description}</p>
              </div>
            </div>
            <div className="space-y-5 order-2">
              {(game.features || []).slice(0, 3).map((feat, i) => (
                <div className="flex items-start gap-3" key={i}>
                  {i === 0 && <Globe className="h-[18px] w-[18px] text-orange-500 mt-0.5 shrink-0" />}
                  {i === 1 && <Monitor className="h-[18px] w-[18px] text-orange-500 mt-0.5 shrink-0" />}
                  {i === 2 && <Trophy className="h-[18px] w-[18px] text-orange-500 mt-0.5 shrink-0" />}
                  <div>
                    <p className="text-white text-sm font-semibold">{feat.title}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{feat.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-[#141414] border border-white/5 rounded-xl p-5 order-1 md:order-3">
              <p className="text-5xl font-bold text-white text-center">{game.rating}</p>
              <p className="text-gray-500 text-[10px] text-center tracking-wide mt-1">PUNTUACIÓN GLOBAL</p>
              <div className="flex items-center justify-center gap-0.5 mt-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < Math.round(game.rating / 2) ? "fill-yellow-500 text-yellow-500" : "text-gray-600"}`} />
                ))}
              </div>
              <p className="text-gray-500 text-[11px] text-center mt-1">
                {game.ratings_count ? `${(game.ratings_count / 1000).toFixed(1)}K valoraciones` : "Basado en 152K valoraciones"}
              </p>
              <div className="space-y-1.5 mt-4">
                {[5, 4, 3, 2, 1].map((stars) => (
                  <div className="flex items-center gap-2" key={stars}>
                    <span className="text-gray-500 text-[10px] w-4">{stars}★</span>
                    <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full rounded-full bg-orange-500" style={{ width: `${stars === 5 ? 88 : stars === 4 ? 8 : 2}%` }} />
                    </div>
                    <span className="text-gray-500 text-[10px] w-7 text-right">
                      {stars === 5 ? `${(game.ratings_count ? Math.round(game.ratings_count * 0.88 / 1000) : 134)}K` : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case 1: // DETALLES
        return (
          <div className="max-w-lg">
            <SpecRow icon={<Info className="h-4 w-4" />} label="DESARROLLADOR" value={game.developer} />
            <SpecRow icon={<Info className="h-4 w-4" />} label="EDITOR" value={game.publisher} />
            <SpecRow icon={<Calendar className="h-4 w-4" />} label="LANZAMIENTO" value={game.release_date} />
            <SpecRow icon={<Tag className="h-4 w-4" />} label="GÉNERO" value={game.genre_names?.join(", ")} />
            <SpecRow icon={<Tv className="h-4 w-4" />} label="PLATAFORMAS" value={game.platforms?.join(", ")} />
            <SpecRow icon={<Clock className="h-4 w-4" />} label="DURACIÓN" value={game.duration} />
            <SpecRow icon={<Users className="h-4 w-4" />} label="JUGADORES" value={game.players} />
            <SpecRow icon={<Monitor className="h-4 w-4" />} label="MODO" value={game.mode} />
            <SpecRow icon={<Globe className="h-4 w-4" />} label="IDIOMAS" value={game.languages} />
            <SpecRow icon={<HardDrive className="h-4 w-4" />} label="TAMAÑO" value={game.size} />
          </div>
        )

      case 2: // REQUISITOS
        return (
          <div className="grid grid-cols-2 gap-8 max-w-3xl">
            <div className="bg-[#141414] border border-white/5 rounded-xl p-5">
              <h4 className="text-white text-sm font-semibold mb-3 flex items-center gap-2">
                <Cpu className="h-4 w-4 text-orange-500" />
                MÍNIMOS
              </h4>
              <div className="text-gray-400 text-[13px] leading-relaxed space-y-1">
                {game.pc_requirements_min ? (
                  game.pc_requirements_min.split("<br>").map((line, i) => (
                    <p key={i}>{cleanHtml(line)}</p>
                  ))
                ) : (
                  <p className="text-gray-500">No disponible</p>
                )}
              </div>
            </div>
            <div className="bg-[#141414] border border-white/5 rounded-xl p-5">
              <h4 className="text-white text-sm font-semibold mb-3 flex items-center gap-2">
                <Cpu className="h-4 w-4 text-green-500" />
                RECOMENDADOS
              </h4>
              <div className="text-gray-400 text-[13px] leading-relaxed space-y-1">
                {game.pc_requirements_rec ? (
                  game.pc_requirements_rec.split("<br>").map((line, i) => (
                    <p key={i}>{cleanHtml(line)}</p>
                  ))
                ) : (
                  <p className="text-gray-500">No disponible</p>
                )}
              </div>
            </div>
          </div>
        )

      case 3: // RESEÑAS
        const avgRating = reviews.length > 0
          ? (reviews.reduce((a: any, r: any) => a + r.rating, 0) / reviews.length).toFixed(1)
          : "—"

        const submitReview = async () => {
          if (newRating === 0 || !newContent.trim()) return
          setSubmitting(true); setReviewError("")
          try {
            const res = await fetch("/api/auth/submit-review", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ game_slug: slug, rating: newRating, content: newContent }),
            })
            if (!res.ok) { setReviewError("Error al enviar reseña"); return }
            setNewRating(0); setNewContent(""); setEditingReview(null)
            if (!editingReview) window.dispatchEvent(new CustomEvent("xp-toast", { detail: { message: "+25 XP · Reseña" } }))
            const data = await (await fetch("/api/auth/get-reviews?slug=" + slug)).json()
            if (Array.isArray(data)) setReviews(data)
          } catch { setReviewError("Error de conexión") }
          finally { setSubmitting(false) }
        }

        const startEdit = (r: any) => {
          setEditingReview(r)
          setNewRating(r.rating)
          setNewContent(r.content)
        }

        const cancelEdit = () => {
          setEditingReview(null)
          setNewRating(0)
          setNewContent("")
        }

        const deleteReview = async (gameSlug: string, targetUserId?: string) => {
          setDeleting(gameSlug)
          try {
            await fetch("/api/auth/delete-review", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ game_slug: gameSlug, user_id: targetUserId }),
            })
            window.dispatchEvent(new CustomEvent("xp-toast", { detail: { message: "-25 XP · Reseña eliminada" } }))
            const data = await (await fetch("/api/auth/get-reviews?slug=" + slug)).json()
            if (Array.isArray(data)) setReviews(data)
          } catch {}
          finally { setDeleting(null) }
        }

        return (
          <div className="max-w-3xl">
            {/* Average rating */}
            <div className="flex items-center gap-6 mb-8">
              <div className="text-center">
                <p className="text-4xl font-bold text-white">{avgRating}</p>
                <p className="text-gray-500 text-[10px] tracking-wide mt-1">PROMEDIO</p>
              </div>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-5 w-5 ${star <= Math.round(Number(avgRating)) ? "fill-yellow-500 text-yellow-500" : "text-gray-600"}`}
                  />
                ))}
              </div>
              <p className="text-gray-500 text-sm">{reviews.length} reseña{reviews.length !== 1 ? "s" : ""}</p>
            </div>

            {/* Submit form — solo usuarios registrados */}
            {userId ? (
              <div className="bg-[#141414] border border-white/5 rounded-xl p-5 mb-8">
                <h4 className="text-white text-sm font-semibold mb-3">{editingReview ? "EDITAR RESEÑA" : "DEJA TU RESEÑA"}</h4>
                <div className="flex items-center gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} onClick={() => setNewRating(star)} className="transition-transform hover:scale-110">
                      <Star className={`h-6 w-6 ${star <= newRating ? "fill-yellow-500 text-yellow-500" : "text-gray-600"}`} />
                    </button>
                  ))}
                  {newRating > 0 && <span className="text-gray-400 text-xs ml-2">{newRating}/5</span>}
                </div>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Escribe tu reseña..."
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-gray-300 text-sm placeholder:text-gray-600 resize-none focus:outline-none focus:border-orange-500/50 transition-colors"
                  rows={3}
                />
                {reviewError && <p className="text-red-500 text-xs mt-1">{reviewError}</p>}
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={submitReview}
                    disabled={newRating === 0 || !newContent.trim() || submitting}
                    className="px-5 py-2 rounded-lg bg-orange-500 text-black font-bold text-xs hover:bg-orange-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed tracking-wide"
                  >
                    {submitting ? "ENVIANDO..." : editingReview ? "ACTUALIZAR" : "ENVIAR RESEÑA"}
                  </button>
                  {editingReview && (
                    <button onClick={cancelEdit} className="px-4 py-2 rounded-lg border border-white/20 text-gray-400 text-xs hover:text-white transition-colors">
                      CANCELAR
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-[#141414] border border-white/5 rounded-xl p-6 mb-8 text-center">
                <p className="text-gray-400 text-sm mb-3">Inicia sesión para dejar tu reseña</p>
                <a href="/login" className="inline-block px-6 py-2.5 rounded-lg bg-orange-500 text-black font-bold text-xs hover:bg-orange-600 transition-colors tracking-wide">INICIAR SESIÓN</a>
              </div>
            )}

            {/* Reviews list */}
            <div className="space-y-4">
              {reviews.length === 0 && (
                <p className="text-gray-600 text-sm text-center py-8">No hay reseñas todavía. ¡Sé el primero!</p>
              )}
              {reviews.map((r: any, i: number) => {
                const isOwn = userId && r.user_id === userId
                const canManage = isOwn || isAdmin
                return (
                  <div key={i} className={`bg-[#141414] border rounded-xl p-5 ${canManage ? "border-orange-500/20" : "border-white/5"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {r.user_id ? (
                          <a href={`/perfil?id=${r.user_id}`} className="text-white text-sm font-semibold hover:text-orange-400 transition-colors">{r.display_name || "Anónimo"}</a>
                        ) : (
                          <p className="text-white text-sm font-semibold">{r.display_name || "Anónimo"}</p>
                        )}
                        {isOwn && <span className="text-[10px] text-orange-500 font-medium">(tú)</span>}
                        {!isOwn && isAdmin && <span className="text-[10px] text-orange-500/60 font-medium">(admin)</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} className={`h-4 w-4 ${star <= r.rating ? "fill-yellow-500 text-yellow-500" : "text-gray-600"}`} />
                          ))}
                        </div>
                        {canManage && (
                          <div className="flex items-center gap-1 ml-2">
                            <button onClick={() => startEdit(r)} className="text-gray-500 hover:text-orange-400 transition-colors" title="Editar">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                            </button>
                          <button
                              onClick={() => setConfirmDelete(r.game_slug || slug)}
                              disabled={deleting === (r.game_slug || slug)}
                              className="text-gray-500 hover:text-red-400 transition-colors disabled:opacity-40"
                              title="Eliminar"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-400 text-[13px] leading-relaxed">{r.content}</p>
                    {r.created_at && (
                      <p className="text-gray-600 text-[11px] mt-2">{new Date(r.created_at).toLocaleDateString("es-ES")}</p>
                    )}
                  </div>
                )
              })}
            </div>

            {confirmDelete && (
              <div className="fixed inset-0 z-[200] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
                <div className="bg-[#1A1A1A] border border-[#ffffff14] rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl">
                  <h3 className="text-white font-semibold text-sm mb-2">Eliminar reseña</h3>
                  <p className="text-gray-400 text-sm mb-5">¿Estás seguro? Esta acción no se puede deshacer. Perderás 25 XP.</p>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 rounded-lg border border-[#ffffff33] text-gray-400 text-xs hover:text-white">CANCELAR</button>
                    <button onClick={() => { deleteReview(confirmDelete); setConfirmDelete(null) }} className="px-4 py-2 rounded-lg bg-red-500 text-white text-xs font-bold hover:bg-red-600">ELIMINAR</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div>
      <div className="flex items-center gap-8 border-b border-white/10 mb-10">
        {tabs.map((tab, i) => (
          <button
            key={i}
            className={`pb-3 text-sm font-medium transition-colors ${
              i === activeTab
                ? "text-orange-500 border-b-2 border-orange-500"
                : "text-gray-500 hover:text-gray-300"
            }`}
            onClick={() => handleTabClick(i)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="min-h-[200px]">
        {renderContent()}
      </div>
    </div>
  )
}
