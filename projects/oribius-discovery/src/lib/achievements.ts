import type { SupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@supabase/supabase-js"

export interface Achievement {
  key: string
  title: string
  description: string
  icon: string
  xpReward: number
}

export const ALL_ACHIEVEMENTS: Achievement[] = [
  { key: "primer_favorito", title: "Primer favorito", description: "Agrega tu primer juego a favoritos", icon: "⭐", xpReward: 25 },
  { key: "coleccionista_5", title: "Coleccionista inicial", description: "Agrega 5 juegos a tu colección", icon: "📦", xpReward: 50 },
  { key: "coleccionista_15", title: "Coleccionista experto", description: "Agrega 15 juegos a tu colección", icon: "📚", xpReward: 100 },
  { key: "primer_resena", title: "Crítico novato", description: "Escribe tu primera reseña", icon: "✍️", xpReward: 25 },
  { key: "resenas_5", title: "Crítico activo", description: "Escribe 5 reseñas", icon: "🎙️", xpReward: 75 },
  { key: "explorador_10", title: "Explorador", description: "Visita 10 juegos diferentes", icon: "🌍", xpReward: 50 },
  { key: "explorador_30", title: "Aventurero", description: "Visita 30 juegos diferentes", icon: "🗺️", xpReward: 100 },
  { key: "nivel_5", title: "Subiendo de nivel", description: "Alcanza el nivel 5", icon: "⬆️", xpReward: 100 },
  { key: "perfil_completo", title: "Identidad", description: "Completa tu perfil (avatar + nombre + bio)", icon: "🪪", xpReward: 50 },
]

export const XP_REWARDS = {
  FAVORITE: 15,
  COLLECTION: 15,
  REVIEW: 25,
  VISIT: 5,
  SET_AVATAR: 10,
  COMPLETE_PROFILE: 15,
}

export function calcLevel(totalXp: number): number {
  return Math.floor(Math.sqrt(Math.max(0, totalXp) / 100)) + 1
}

export function xpForNextLevel(level: number): number {
  return level * level * 100
}

export function levelProgress(totalXp: number): { currentLevel: number; currentXp: number; nextLevelXp: number; progress: number } {
  const safeXp = Math.max(0, totalXp)
  const currentLevel = calcLevel(safeXp)
  const currentLevelXp = (currentLevel - 1) * (currentLevel - 1) * 100
  const nextLevelXp = currentLevel * currentLevel * 100
  const xpInLevel = safeXp - currentLevelXp
  const xpNeeded = nextLevelXp - currentLevelXp
  return {
    currentLevel,
    currentXp: xpInLevel,
    nextLevelXp: xpNeeded,
    progress: xpNeeded > 0 ? Math.min(xpInLevel / xpNeeded, 1) : 0,
  }
}

export async function awardXp(supabase: SupabaseClient, userId: string, amount: number, knownXp?: number) {
  const currentXp = knownXp ?? (await supabase.from("profiles").select("xp").eq("id", userId).single()).data?.xp ?? 0
  const newXp = Math.max(0, currentXp + amount)
  const newLevel = calcLevel(newXp)

  // Usar service_role para bypassear RLS (xp/level no modificables por el usuario)
  const supabaseAdmin = createClient(
    (import.meta as any).env.SUPABASE_URL,
    (import.meta as any).env.SUPABASE_SERVICE_KEY
  )
  await supabaseAdmin
    .from("profiles")
    .update({ xp: newXp, level: newLevel })
    .eq("id", userId)
}

export async function checkAndUnlockAchievements(supabase: SupabaseClient, userId: string, action?: keyof typeof XP_REWARDS) {
  const [userAchievements, profile] = await Promise.all([
    supabase.from("achievements").select("achievement_key").eq("user_id", userId),
    supabase.from("profiles").select("avatar_url, display_name, bio, xp").eq("id", userId).single(),
  ])

  const unlockedKeys = new Set((userAchievements.data || []).map((a: any) => a.achievement_key))

  // Early return si ya tiene todos los logros
  if (unlockedKeys.size >= ALL_ACHIEVEMENTS.length) return []

  // Contar datos necesarios solo para logros no desbloqueados
  const needsFav = !unlockedKeys.has("primer_favorito")
  const needsCol = !unlockedKeys.has("coleccionista_5") || !unlockedKeys.has("coleccionista_15")
  const needsRev = !unlockedKeys.has("primer_resena") || !unlockedKeys.has("resenas_5")
  const needsRec = !unlockedKeys.has("explorador_10") || !unlockedKeys.has("explorador_30")

  const [favCount, colCount, revCount, recCount] = await Promise.all([
    needsFav ? supabase.from("favorites").select("id", { count: "exact", head: true }).eq("user_id", userId) : { count: 0 },
    needsCol ? supabase.from("collection").select("id", { count: "exact", head: true }).eq("user_id", userId) : { count: 0 },
    needsRev ? supabase.from("reviews").select("id", { count: "exact", head: true }).eq("user_id", userId) : { count: 0 },
    needsRec ? supabase.from("recent").select("id", { count: "exact", head: true }).eq("user_id", userId) : { count: 0 },
  ])

  const newUnlocks: Achievement[] = []
  const toInsert: { user_id: string; achievement_key: string }[] = []
  let currentXp = profile.data?.xp ?? 0

  const checks = [
    { key: "primer_favorito", condition: (favCount.count || 0) >= 1 },
    { key: "coleccionista_5", condition: (colCount.count || 0) >= 5 },
    { key: "coleccionista_15", condition: (colCount.count || 0) >= 15 },
    { key: "primer_resena", condition: (revCount.count || 0) >= 1 },
    { key: "resenas_5", condition: (revCount.count || 0) >= 5 },
    { key: "explorador_10", condition: (recCount.count || 0) >= 10 },
    { key: "explorador_30", condition: (recCount.count || 0) >= 30 },
    { key: "nivel_5", condition: calcLevel(currentXp) >= 5 },
    { key: "perfil_completo", condition: !!(profile.data?.avatar_url && profile.data?.display_name && profile.data?.bio) },
  ]

  for (const { key, condition } of checks) {
    if (condition && !unlockedKeys.has(key)) {
      const achievement = ALL_ACHIEVEMENTS.find((a) => a.key === key)
      if (achievement) {
        newUnlocks.push(achievement)
        toInsert.push({ user_id: userId, achievement_key: key })
        currentXp += achievement.xpReward
      }
    }
  }

  // Batch inserts + XP update en una operación
  if (toInsert.length > 0) {
    await supabase.from("achievements").insert(toInsert)
    const newXp = Math.max(0, currentXp)
    const newLevel = calcLevel(newXp)
    const supabaseAdmin = createClient(
      (import.meta as any).env.SUPABASE_URL,
      (import.meta as any).env.SUPABASE_SERVICE_KEY
    )
    await supabaseAdmin.from("profiles").update({ xp: newXp, level: newLevel }).eq("id", userId)
  }

  return newUnlocks
}
