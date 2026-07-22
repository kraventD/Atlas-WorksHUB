import type { APIRoute } from "astro"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { awardXp, checkAndUnlockAchievements, XP_REWARDS } from "@/lib/achievements"

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const supabase = createSupabaseServerClient(cookies)
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.user) {
    return redirect("/login")
  }

  const formData = await request.formData()
  const displayName = formData.get("display_name") as string
  const bio = formData.get("bio") as string

  const updates: Record<string, string> = {}
  if (displayName?.trim()) updates.display_name = displayName.trim()
  if (bio !== undefined) updates.bio = bio

  await supabase.from("profiles").update(updates).eq("id", session.user.id)

  await awardXp(supabase, session.user.id, XP_REWARDS.COMPLETE_PROFILE)
  const newAchievements = await checkAndUnlockAchievements(supabase, session.user.id)
  if (newAchievements.length > 0) awardXp(supabase, session.user.id, 5)

  return redirect("/ajustes?saved=true")
}
