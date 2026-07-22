import type { APIRoute } from "astro"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { ALL_ACHIEVEMENTS, levelProgress } from "@/lib/achievements"
import { createClient } from "@supabase/supabase-js"

export const GET: APIRoute = async ({ cookies }) => {
  const supabase = createSupabaseServerClient(cookies)
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return new Response(JSON.stringify({ error: "No autorizado" }), { status: 401 })

  const { data: unlocked } = await supabase
    .from("achievements")
    .select("achievement_key, unlocked_at")
    .eq("user_id", session.user.id)

  const unlockedKeys = new Set((unlocked || []).map((a: any) => a.achievement_key))

  const achievements = ALL_ACHIEVEMENTS.map((a) => ({
    ...a,
    unlocked: unlockedKeys.has(a.key),
    unlocked_at: (unlocked || []).find((u: any) => u.achievement_key === a.key)?.unlocked_at || null,
  }))

  const supabaseAdmin = createClient(import.meta.env.SUPABASE_URL, import.meta.env.SUPABASE_SERVICE_KEY)
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("xp, level")
    .eq("id", session.user.id)
    .single()

  const level = levelProgress(profile?.xp || 0)

  return new Response(JSON.stringify({ achievements, level }), {
    headers: { "content-type": "application/json" },
  })
}
