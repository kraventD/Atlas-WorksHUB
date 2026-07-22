import type { APIRoute } from "astro"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { awardXp, XP_REWARDS } from "@/lib/achievements"
import { ADMIN_EMAIL } from "@/lib/constants"

export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = createSupabaseServerClient(cookies)
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return new Response(JSON.stringify({ error: "No autorizado" }), { status: 401 })

  const { game_slug, user_id } = await request.json()
  if (!game_slug) return new Response(JSON.stringify({ error: "Falta game_slug" }), { status: 400 })

  const isAdmin = session.user.email === ADMIN_EMAIL
  const targetUserId = (isAdmin && user_id) ? user_id : session.user.id

  const { data: existing } = await supabase
    .from("reviews")
    .select("id")
    .eq("user_id", targetUserId)
    .eq("game_slug", game_slug)
    .single()

  if (!existing) return new Response(JSON.stringify({ error: "Reseña no encontrada" }), { status: 404 })

  await supabase.from("reviews").delete().eq("id", existing.id)

  // Solo restar XP si es el propio usuario (no cuando admin elimina de otro)
  if (!user_id || user_id === session.user.id) {
    await awardXp(supabase, session.user.id, -XP_REWARDS.REVIEW)
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { "content-type": "application/json" },
  })
}
