import type { APIRoute } from "astro"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { awardXp, checkAndUnlockAchievements, XP_REWARDS } from "@/lib/achievements"

export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = createSupabaseServerClient(cookies)
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return new Response(JSON.stringify({ error: "No autorizado" }), { status: 401 })

  const { game_slug } = await request.json()
  if (!game_slug) return new Response(JSON.stringify({ error: "Falta game_slug" }), { status: 400 })

  const { data: existing } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", session.user.id)
    .eq("game_slug", game_slug)
    .single()

  if (existing) {
    await supabase.from("favorites").delete().eq("id", existing.id)
    await awardXp(supabase, session.user.id, -XP_REWARDS.FAVORITE)
    return new Response(JSON.stringify({ favorited: false }), { headers: { "content-type": "application/json" } })
  }

  await supabase.from("favorites").insert({ user_id: session.user.id, game_slug })

  await awardXp(supabase, session.user.id, XP_REWARDS.FAVORITE)
  const newAchievements = await checkAndUnlockAchievements(supabase, session.user.id)
  if (newAchievements.length > 0) awardXp(supabase, session.user.id, 5)

  return new Response(JSON.stringify({ favorited: true }), { headers: { "content-type": "application/json" } })
}
