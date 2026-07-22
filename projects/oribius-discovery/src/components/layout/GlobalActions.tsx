import { Button } from "@/components/ui/button"
import { Search, Bell, User, ChevronDown } from "lucide-react"

export function GlobalActions() {
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar juegos..."
          className="h-9 w-48 rounded-lg bg-dark-800/50 border border-dark-700/50 pl-9 pr-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 transition-colors"
        />
      </div>
      <Button variant="ghost" size="icon" className="text-gray-400">
        <Bell className="h-5 w-5" />
      </Button>
      <div className="flex items-center gap-2 pl-2 border-l border-dark-700/50">
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
          <User className="h-4 w-4 text-white" />
        </div>
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </div>
    </div>
  )
}
