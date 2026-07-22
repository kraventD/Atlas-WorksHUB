import type { APIRoute } from "astro"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { awardXp, checkAndUnlockAchievements, XP_REWARDS } from "@/lib/achievements"

export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = createSupabaseServerClient(cookies)
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return new Response(JSON.stringify({ error: "No autorizado" }), { status: 401 })

  const { game_slug, rating, content } = await request.json()
  if (!game_slug || !rating || !content) {
    return new Response(JSON.stringify({ error: "Faltan campos" }), { status: 400 })
  }
  if (rating < 1 || rating > 5) {
    return new Response(JSON.stringify({ error: "Rating debe ser 1-5" }), { status: 400 })
  }

  // Verificar si ya existe una reseña (para no dar XP duplicado)
  const { data: existing } = await supabase
    .from("reviews")
    .select("id")
    .eq("user_id", session.user.id)
    .eq("game_slug", game_slug)
    .single()

  const isNew = !existing

  if (isNew) {
    const { error } = await supabase.from("reviews").insert({ user_id: session.user.id, game_slug, rating, content })
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })

    await awardXp(supabase, session.user.id, XP_REWARDS.REVIEW)
    const newAchievements = await checkAndUnlockAchievements(supabase, session.user.id)
    if (newAchievements.length > 0) awardXp(supabase, session.user.id, 5)
  } else {
    const { error } = await supabase.from("reviews").update({ rating, content }).eq("id", existing.id)
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { "content-type": "application/json" },
  })
}
