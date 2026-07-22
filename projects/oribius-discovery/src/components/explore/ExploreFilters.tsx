import { useState, useMemo, useEffect } from "react"
import { Shuffle, SlidersHorizontal, X } from "lucide-react"
import { gameImg } from "@/lib/images"

interface GameData {
  _id: string
  title: string
  slug: string
  rating?: number
  ratings_count?: number
  year?: string
  release_date?: string
  image?: string
  cover_url?: string
  genre_names?: string[]
  platforms?: string[]
}

const GENRE_MAP: Record<string, string> = {
  "Acción": "Action",
  "Aventura": "Adventure",
  "Arcade": "Arcade",
  "Casual": "Casual",
  "Disparos": "Shooter",
  "Indie": "Indie",
  "Multijugador": "Massively Multiplayer",
  "Plataformas": "Platformer",
  "Puzzle": "Puzzle",
  "RPG": "RPG",
  "Simulación": "Simulation",
  "Estrategia": "Strategy",
}
const GENEROS = Object.keys(GENRE_MAP)

const PLATFORM_MAP: Record<string, string> = {
  "PlayStation 5": "PlayStation 5",
  "PlayStation 4": "PlayStation 4",
  "Xbox Series X|S": "Xbox Series S/X",
  "Nintendo Switch": "Nintendo Switch",
  "PC": "PC",
}
const PLATAFORMAS = Object.keys(PLATFORM_MAP)
const SORT_OPTIONS = [
  { label: "Más populares", value: "ratings_count-desc" },
  { label: "Mejor valorados", value: "rating-desc" },
  { label: "Más recientes", value: "year-desc" },
  { label: "A-Z", value: "title-asc" },
]
const ITEMS_PER_PAGE = 15

export function ExploreFilters({ games }: { games: GameData[] }) {
  const [selectedGenres, setSelectedGenres] = useState<Set<string>>(new Set())
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(new Set())
  const [sort, setSort] = useState("ratings_count-desc")
  const [page, setPage] = useState(1)

  // Year range
  const years = games.map((g) => parseInt(g.year || g.release_date?.slice(0, 4) || "0")).filter((y) => y > 0)
  const minDataYear = Math.min(...years, 2010)
  const maxDataYear = Math.max(...years, 2026)
  const [yearMin, setYearMin] = useState(minDataYear)
  const [yearMax, setYearMax] = useState(maxDataYear)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterOpen, setFilterOpen] = useState(false)

  // Leer ?genero=X o ?q= de la URL al montar y preseleccionar
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const genreParam = params.get("genero")
    const queryParam = params.get("q")
    if (genreParam) {
      const match = GENEROS.find((g) => g.toLowerCase() === genreParam.toLowerCase())
      if (match) setSelectedGenres(new Set([match]))
    }
    if (queryParam) setSearchQuery(queryParam)
  }, [])

  const toggleGenre = (g: string) => {
    const next = new Set(selectedGenres)
    next.has(g) ? next.delete(g) : next.add(g)
    setSelectedGenres(next)
    setPage(1)
  }

  const togglePlatform = (p: string) => {
    const next = new Set(selectedPlatforms)
    next.has(p) ? next.delete(p) : next.add(p)
    setSelectedPlatforms(next)
    setPage(1)
  }

  const clearFilters = () => {
    setSelectedGenres(new Set())
    setSelectedPlatforms(new Set())
    setYearMin(minDataYear)
    setYearMax(maxDataYear)
    setSearchQuery("")
    setPage(1)
  }

  const hasFilters = selectedGenres.size > 0 || selectedPlatforms.size > 0 || yearMin !== minDataYear || yearMax !== maxDataYear || searchQuery

  const filtered = useMemo(() => {
    const [sortBy, sortDir] = sort.split("-") as [string, "asc" | "desc"]
    const selectedGenreValues = new Set([...selectedGenres].map((g) => GENRE_MAP[g] || g))
    const selectedPlatformValues = new Set([...selectedPlatforms].map((p) => PLATFORM_MAP[p] || p))

    let result = games.filter((g) => {
      if (selectedGenres.size > 0 && !g.genre_names?.some((genre) => selectedGenreValues.has(genre))) return false
      if (selectedPlatforms.size > 0 && !g.platforms?.some((p) => selectedPlatformValues.has(p))) return false
      const y = parseInt(g.year || g.release_date?.slice(0, 4) || "0")
      if (y && (y < yearMin || y > yearMax)) return false
      if (searchQuery && !g.title?.toLowerCase().includes(searchQuery.toLowerCase())) return false
      return true
    })

    result.sort((a, b) => {
      let va: any, vb: any
      if (sortBy === "rating") { va = a.rating || 0; vb = b.rating || 0 }
      else if (sortBy === "ratings_count") { va = a.ratings_count || 0; vb = b.ratings_count || 0 }
      else if (sortBy === "year") { va = a.year || "0"; vb = b.year || "0" }
      else { va = a.title?.toLowerCase() || ""; vb = b.title?.toLowerCase() || "" }
      if (va < vb) return sortDir === "asc" ? -1 : 1
      if (va > vb) return sortDir === "asc" ? 1 : -1
      return 0
    })

    return result
  }, [games, selectedGenres, selectedPlatforms, yearMin, yearMax, sort, searchQuery])

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paged = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  const goToRandom = () => {
    const i = Math.floor(Math.random() * games.length)
    window.location.href = "/juego/" + games[i].slug
  }

  const minRange = Math.max(minDataYear - 5, 2000)
  const maxRange = Math.min(maxDataYear + 2, 2030)

  // Slider track percentage
  const range = maxRange - minRange
  const minPct = ((yearMin - minRange) / range) * 100
  const maxPct = ((yearMax - minRange) / range) * 100

  return (
    <div class="flex flex-col md:flex-row gap-6 md:gap-10 px-4 md:px-8 pb-16">
      {/* Mobile filter toggle */}
      <div class="flex items-center gap-3 md:hidden pt-4">
        <button
          onClick={() => setFilterOpen(true)}
          class="flex items-center gap-2 px-4 py-2 rounded-lg bg-dark-800 border border-dark-700 text-gray-300 text-sm"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtros
          {hasFilters && <span class="w-2 h-2 rounded-full bg-orange-500" />}
        </button>
        {hasFilters && (
          <button onClick={clearFilters} class="text-gray-500 hover:text-white text-xs transition-colors">
            Limpiar
          </button>
        )}
      </div>

      {/* LEFT: Filters — desktop always visible, mobile in drawer */}
      <aside class={`w-full md:w-[240px] md:shrink-0 pt-4 md:pt-8 ${filterOpen ? "block" : "hidden md:block"}`}>
        {/* Mobile drawer header */}
        <div class="flex items-center justify-between md:hidden mb-4">
          <h2 class="text-white font-semibold">Filtros</h2>
          <button onClick={() => setFilterOpen(false)} class="text-gray-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        {/* Mobile backdrop */}
        {filterOpen && <div class="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setFilterOpen(false)} />}
        <div class={`relative z-50 ${filterOpen ? "fixed inset-0 top-14 bg-dark-950 p-4 overflow-y-auto md:static md:bg-transparent md:p-0" : ""}`}>
        <h1 class="hidden md:block font-display text-2xl font-bold text-white mb-8">Explorar</h1>

        {/* Género */}
        <div class="mb-8">
          <h3 class="text-white text-sm font-medium mb-3">Género</h3>
          <div class="flex flex-wrap gap-2">
            {GENEROS.map((g) => {
              const active = selectedGenres.has(g)
              return (
                <button
                  key={g}
                  onClick={() => toggleGenre(g)}
                  class={`px-3 py-1.5 rounded-full text-xs border transition-all duration-200 ${
                    active
                      ? "bg-orange-500/10 border-orange-500/50 text-orange-400"
                      : "bg-dark-800 border-dark-700 text-gray-400 hover:border-gray-500"
                  }`}
                >
                  {g}
                </button>
              )
            })}
          </div>
        </div>

        {/* Plataforma */}
        <div class="mb-8">
          <h3 class="text-white text-sm font-medium mb-3">Plataforma</h3>
          <div class="flex flex-wrap gap-2">
            {PLATAFORMAS.map((p) => {
              const active = selectedPlatforms.has(p)
              return (
                <button
                  key={p}
                  onClick={() => togglePlatform(p)}
                  class={`px-3 py-2 md:py-1.5 rounded-full text-xs border transition-all duration-200 ${
                    active
                      ? "bg-orange-500/10 border-orange-500/50 text-orange-400"
                      : "bg-dark-800 border-dark-700 text-gray-400 hover:border-gray-500"
                  }`}
                >
                  {p}
                </button>
              )
            })}
          </div>
        </div>

        {/* Año — Range Slider */}
        <div class="mb-8">
          <h3 class="text-white text-sm font-medium mb-3">Año</h3>
          <div class="text-center mb-2">
            <span class="text-orange-400 text-sm font-semibold">{yearMin}</span>
            <span class="text-gray-600 mx-2">—</span>
            <span class="text-orange-400 text-sm font-semibold">{yearMax}</span>
          </div>
          <div class="relative h-6 flex items-center">
            {/* Track background */}
            <div class="absolute left-0 right-0 h-1 rounded-full bg-dark-700" />
            {/* Track fill */}
            <div
              class="absolute h-1 rounded-full bg-orange-500"
              style={{ left: `${minPct}%`, right: `${100 - maxPct}%` }}
            />
            {/* Min range input */}
            <input
              type="range"
              min={minRange}
              max={maxRange}
              value={yearMin}
              onChange={(e) => {
                const v = Math.min(Number(e.target.value), yearMax - 1)
                setYearMin(v)
                setPage(1)
              }}
              class="absolute w-full h-1 appearance-none bg-transparent pointer-events-auto z-10
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-orange-500
                [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-dark-900
                [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md
                [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:bg-orange-500 [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-dark-900
                [&::-moz-range-thumb]:cursor-pointer"
            />
            {/* Max range input */}
            <input
              type="range"
              min={minRange}
              max={maxRange}
              value={yearMax}
              onChange={(e) => {
                const v = Math.max(Number(e.target.value), yearMin + 1)
                setYearMax(v)
                setPage(1)
              }}
              class="absolute w-full h-1 appearance-none bg-transparent pointer-events-auto z-20
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-orange-500
                [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-dark-900
                [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md
                [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:bg-orange-500 [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-dark-900
                [&::-moz-range-thumb]:cursor-pointer"
            />
          </div>
        </div>

        {/* Random Game */}
        <button
          onClick={goToRandom}
          class="w-full py-3 rounded-xl border-2 border-dashed border-orange-500/40 flex items-center justify-center gap-2 text-orange-400 text-sm font-medium hover:border-orange-500 hover:bg-orange-500/5 transition-all duration-200 mb-6"
        >
          <Shuffle class="h-4 w-4" />
          JUEGO ALEATORIO
        </button>

        {/* Clear filters */}
        {hasFilters && (
          <button onClick={clearFilters} class="text-gray-500 hover:text-white text-xs transition-colors">
            Limpiar filtros
          </button>
        )}
        </div>
      </aside>

      {/* RIGHT: Game grid */}
      <div class="flex-1 pt-8">
        <div class="flex items-center justify-between mb-6">
          <p class="text-sm text-gray-400">
            <span class="text-white font-medium">{filtered.length}</span> juego{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}
          </p>
          <div class="flex items-center gap-2">
            <span class="text-xs text-gray-500">Ordenar por:</span>
            <select
              value={sort}
              onChange={(e) => { setSort(e.target.value); setPage(1) }}
              class="rounded-lg bg-dark-800 border border-dark-700 text-white text-xs py-1.5 px-2 focus:outline-none focus:border-orange-500/50"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {paged.length === 0 ? (
          <div class="text-center py-20">
            <p class="text-gray-500 text-sm">No se encontraron juegos con esos filtros</p>
          </div>
        ) : (
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 py-7 px-4 card-grid">
            {paged.map((juego) => (
              <a key={juego._id} href={`/juego/${juego.slug}`} class="game-card group cursor-pointer m-1.5">
                <div class="relative aspect-[3/4] rounded-xl bg-dark-900 border border-dark-800/50 transition-all duration-300 group-hover:border-orange-500/30 group-hover:shadow-lg group-hover:shadow-orange-500/10">
                  <div class="absolute inset-0 rounded-xl overflow-hidden">
                    {(juego.cover_url || juego.image) && (
                       <img src={gameImg(juego, 400)} alt={juego.title} class="h-full w-full object-cover" />
                    )}
                    <div class="absolute bottom-0 left-0 right-0 h-[40%] bg-gradient-to-t from-dark-950/90 via-dark-950/40 to-transparent" />
                  </div>
                  <div class="absolute bottom-0 left-0 right-0 p-4">
                    <p class="text-sm font-bold text-white group-hover:text-orange-400 transition-colors line-clamp-2">{juego.title}</p>
                    <div class="flex items-center gap-1 mt-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="#EAB308" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                      <span class="text-xs text-gray-400">{juego.rating?.toFixed(1) || "N/A"}</span>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div class="flex items-center justify-center gap-2 mt-10">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              class="h-9 w-9 rounded-lg border border-dark-700 flex items-center justify-center text-gray-400 hover:text-white hover:bg-dark-800 transition-all disabled:opacity-30"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let pageNum: number
              if (totalPages <= 7) {
                pageNum = i + 1
              } else if (page <= 4) {
                pageNum = i + 1
              } else if (page >= totalPages - 3) {
                pageNum = totalPages - 6 + i
              } else {
                pageNum = page - 3 + i
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  class={`h-9 min-w-9 rounded-lg text-sm font-medium transition-all ${
                    pageNum === page
                      ? "bg-orange-500 text-white"
                      : "text-gray-400 hover:text-white hover:bg-dark-800 border border-dark-700"
                  }`}
                >
                  {pageNum}
                </button>
              )
            })}
            {totalPages > 7 && page < totalPages - 3 && <span class="text-gray-600 text-sm px-1">...</span>}
            {totalPages > 7 && page >= totalPages - 3 ? null : totalPages > 7 && (
              <button
                onClick={() => setPage(totalPages)}
                class="h-9 min-w-9 rounded-lg border border-dark-700 text-sm text-gray-400 hover:text-white hover:bg-dark-800 transition-all"
              >
                {totalPages}
              </button>
            )}
            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              class="h-9 w-9 rounded-lg border border-dark-700 flex items-center justify-center text-gray-400 hover:text-white hover:bg-dark-800 transition-all disabled:opacity-30"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
