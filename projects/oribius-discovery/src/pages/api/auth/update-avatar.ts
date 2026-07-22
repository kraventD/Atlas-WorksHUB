import type { APIRoute } from "astro"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { awardXp, checkAndUnlockAchievements, XP_REWARDS } from "@/lib/achievements"
import { ADMIN_EMAIL } from "@/lib/constants"

export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = createSupabaseServerClient(cookies)
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.user) {
    return new Response(JSON.stringify({ error: "No autorizado" }), { status: 401 })
  }

  const { avatarId } = await request.json()
  const isAdmin = session.user.email === ADMIN_EMAIL

  const avatarMap: Record<string, string> = {
    default: "",
    avatar1: "/images/avatars/avatar-1.png",
    avatar2: "/images/avatars/avatar-2.png",
    avatar3: "/images/avatars/avatar-3.png",
    avatar4: "/images/avatars/avatar-4.png",
    avatar5: "/images/avatars/avatar-5.png",
    avatar6: "/images/avatars/avatar-6.png",
    avatar7: "/images/avatars/avatar-7.png",
    avatar8: "/images/avatars/avatar-8.png",
    avatar9: "/images/avatars/avatar-9.png",
    avatar10: "/images/avatars/avatar-10.png",
  }

  if (isAdmin) {
    avatarMap.admin = "/images/avatars/avatar-admin.png"
  }

  const avatarUrl = avatarMap[avatarId] || ""

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarId === "default" ? null : avatarUrl })
    .eq("id", session.user.id)

  if (error) {
    return new Response(JSON.stringify({ error: "Error al actualizar avatar" }), { status: 500 })
  }

  await awardXp(supabase, session.user.id, XP_REWARDS.SET_AVATAR)
  const newAchievements = await checkAndUnlockAchievements(supabase, session.user.id)
  if (newAchievements.length > 0) awardXp(supabase, session.user.id, 5)

  return new Response(JSON.stringify({ success: true }), {
    headers: { "content-type": "application/json" },
  })
}
