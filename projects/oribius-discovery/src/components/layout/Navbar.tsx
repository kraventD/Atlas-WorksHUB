import * as React from "react"
import { Search, ChevronDown, User, Trophy, Settings, LogOut, Heart, Bookmark, Menu, X } from "lucide-react"

const navItems = [
  { label: "Inicio", href: "/" },
  { label: "Explorar", href: "/explorar" },
  { label: "Guardados", href: "/guardados" },
]

interface NavbarProps {
  currentPath?: string
  user?: { id: string; email: string; displayName: string; avatarUrl: string } | null
}

export function Navbar({ currentPath = "/", user = null }: NavbarProps) {
  const [searchValue, setSearchValue] = React.useState("")
  const [profileOpen, setProfileOpen] = React.useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const searchRef = React.useRef<HTMLInputElement>(null)
  const profileRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [])

  const handleLogout = React.useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    window.location.href = "/"
  }, [])

  React.useEffect(() => {
    if (!profileOpen) return
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [profileOpen])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = searchValue.trim()
    if (q) window.location.href = `/explorar?q=${encodeURIComponent(q)}`
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-14 bg-dark-950/80 backdrop-blur-xl border-b border-dark-800/50 flex items-center px-4 md:px-6 gap-2 md:gap-4">
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="md:hidden shrink-0 text-gray-400 hover:text-white transition-colors"
        aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
      >
        {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Logo */}
      <a href="/" className="shrink-0">
        <img src="/images/logo.png" alt="Oribius Discovery" className="h-8 md:h-9 w-auto object-contain" />
      </a>

      {/* Nav items — desktop */}
      <div className="hidden md:flex items-center gap-1">
        {navItems.map((item) => {
          const isActive = currentPath.replace(/\/$/, "") === item.href.replace(/\/$/, "")
          return (
            <a
              key={item.href}
              href={item.href}
              className={`relative px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                isActive ? "text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              {item.label}
              {isActive && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-orange-500 rounded-full" />
              )}
            </a>
          )
        })}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search bar */}
      <form onSubmit={handleSearch} className="relative max-w-[160px] md:max-w-xs w-full">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        <input
          ref={searchRef}
          type="text"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder="Buscar..."
          className="h-8 md:h-9 w-full rounded-lg bg-dark-800/50 border border-dark-700/50 pl-8 pr-8 md:pr-20 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 transition-colors"
        />
        <kbd className="hidden md:block absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-dark-700 text-[10px] text-gray-400 font-mono pointer-events-none">
          ⌘K
        </kbd>
      </form>

      {/* Profile */}
      <div className="relative shrink-0" ref={profileRef}>
        {user ? (
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 pl-2 md:pl-3 border-l border-dark-700/50 text-gray-400 hover:text-white transition-colors"
          >
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="h-7 w-7 md:h-8 md:w-8 rounded-full object-cover border border-orange-500/50" />
            ) : (
              <div className="h-7 w-7 md:h-8 md:w-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-xs font-bold text-white">
                {user.displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="hidden md:inline text-sm">{user.displayName}</span>
            <ChevronDown className={`hidden md:block h-3.5 w-3.5 transition-transform ${profileOpen ? "rotate-180" : ""}`} />
          </button>
        ) : (
          <a href="/login" className="flex items-center gap-1 md:gap-2 pl-2 md:pl-3 border-l border-dark-700/50 text-gray-400 hover:text-white transition-colors text-sm font-medium">
            <User className="h-4 w-4" />
            <span className="hidden md:inline">Iniciar sesión</span>
          </a>
        )}

        {profileOpen && user && (
          <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-dark-900 border border-dark-800/50 shadow-xl shadow-black/50 py-2 z-50">
            <div className="px-4 py-2 border-b border-dark-800/50 mb-1">
              <p className="text-white text-sm font-medium truncate">{user.displayName}</p>
              <p className="text-gray-500 text-xs truncate">{user.email}</p>
            </div>
            <a href="/perfil" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-dark-800/50 transition-colors">
              <User className="h-4 w-4 text-orange-500" />
              Ver perfil
            </a>
            <a href="/guardados" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-dark-800/50 transition-colors">
              <Heart className="h-4 w-4 text-red-400" />
              Guardados
            </a>
            <a href="/coleccion" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-dark-800/50 transition-colors">
              <Bookmark className="h-4 w-4 text-orange-500" />
              Colección
            </a>
            <a href="/logros" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-dark-800/50 transition-colors">
              <Trophy className="h-4 w-4 text-yellow-500" />
              Logros
            </a>
            <a href="/ajustes" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-dark-800/50 transition-colors">
              <Settings className="h-4 w-4 text-gray-400" />
              Ajustes
            </a>
            <hr className="border-dark-800/50 my-1" />
            <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-dark-800/50 transition-colors w-full text-left">
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </button>
          </div>
        )}
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-14 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative bg-dark-900 border-t border-dark-800/50 px-4 py-4 space-y-1">
            {navItems.map((item) => {
              const isActive = currentPath.replace(/\/$/, "") === item.href.replace(/\/$/, "")
              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? "text-white bg-dark-800" : "text-gray-400 hover:text-white hover:bg-dark-800/50"
                  }`}
                >
                  {item.label}
                </a>
              )
            })}
          </div>
        </div>
      )}
    </nav>
  )
}
