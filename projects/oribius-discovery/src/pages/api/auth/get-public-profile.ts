import type { APIRoute } from "astro"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"
import { levelProgress } from "@/lib/achievements"
import { ADMIN_EMAIL } from "@/lib/constants"

export const GET: APIRoute = async ({ url, cookies }) => {
  const profileId = url.searchParams.get("id")
  if (!profileId) return new Response(JSON.stringify({ error: "id requerido" }), { status: 400 })

  const supabase = createSupabaseServerClient(cookies)
  const { data: { session } } = await supabase.auth.getSession()
  const isAdmin = session?.user?.email === ADMIN_EMAIL

  const supabaseAdmin = createClient(import.meta.env.SUPABASE_URL, import.meta.env.SUPABASE_SERVICE_KEY)

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id, display_name, avatar_url, bio, level, xp, profile_public")
    .eq("id", profileId)
    .single()

  if (!profile) return new Response(JSON.stringify({ error: "Perfil no encontrado" }), { status: 404 })

  // Privacy check: admin can see all, others only public profiles
  if (!profile.profile_public && !isAdmin && session?.user?.id !== profileId) {
    return new Response(JSON.stringify({ error: "Perfil privado" }), { status: 403 })
  }

  const [favCount, colCount, revCount, achCount] = await Promise.all([
    supabaseAdmin.from("favorites").select("id", { count: "exact", head: true }).eq("user_id", profileId),
    supabaseAdmin.from("collection").select("id", { count: "exact", head: true }).eq("user_id", profileId),
    supabaseAdmin.from("reviews").select("id", { count: "exact", head: true }).eq("user_id", profileId),
    supabaseAdmin.from("achievements").select("id", { count: "exact", head: true }).eq("user_id", profileId),
  ])

  const level = levelProgress(profile.xp || 0)

  return new Response(JSON.stringify({
    id: profile.id,
    display_name: profile.display_name,
    avatar_url: profile.avatar_url,
    bio: profile.bio,
    level: level.currentLevel,
    xp: profile.xp,
    currentXp: level.currentXp,
    nextLevelXp: level.nextLevelXp,
    progress: level.progress,
    stats: {
      favorites: favCount.count || 0,
      collection: colCount.count || 0,
      reviews: revCount.count || 0,
      achievements: achCount.count || 0,
    },
  }), {
    headers: { "content-type": "application/json" },
  })
}
