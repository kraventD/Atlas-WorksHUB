import type { APIRoute } from "astro"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { awardXp, checkAndUnlockAchievements, XP_REWARDS } from "@/lib/achievements"

export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = createSupabaseServerClient(cookies)
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return new Response(JSON.stringify({ error: "No autorizado" }), { status: 401 })

  const { slug } = await request.json()
  if (!slug) return new Response(JSON.stringify({ error: "Falta slug" }), { status: 400 })

  // Verificar si ya visitó este juego antes
  const { data: prevVisit } = await supabase
    .from("recent")
    .select("id")
    .eq("user_id", session.user.id)
    .eq("game_slug", slug)
    .single()

  if (!prevVisit) {
    await supabase.from("recent").insert({ user_id: session.user.id, game_slug: slug, visited_at: new Date().toISOString() })
    await awardXp(supabase, session.user.id, XP_REWARDS.VISIT)
    await checkAndUnlockAchievements(supabase, session.user.id)
  } else {
    await supabase.from("recent").update({ visited_at: new Date().toISOString() }).eq("id", prevVisit.id)
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { "content-type": "application/json" },
  })
}
