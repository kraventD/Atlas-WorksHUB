import type { APIRoute } from "astro"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { ADMIN_EMAIL } from "@/lib/constants"

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const supabase = createSupabaseServerClient(cookies)
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.user?.email !== ADMIN_EMAIL) {
    return new Response(JSON.stringify({ error: "Solo admin" }), { status: 403 })
  }

  const formData = await request.formData()
  const user_id = formData.get("user_id") as string
  const display_name = formData.get("display_name") as string

  if (!user_id) return new Response(JSON.stringify({ error: "Falta user_id" }), { status: 400 })

  const updates: Record<string, string> = {}
  if (display_name?.trim()) updates.display_name = display_name.trim()

  await supabase.from("profiles").update(updates).eq("id", user_id)

  return redirect(`/perfil?id=${user_id}`)
}
