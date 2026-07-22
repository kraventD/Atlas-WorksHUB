import type { APIRoute } from "astro"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = createSupabaseServerClient(cookies)
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return new Response(JSON.stringify({ error: "No autorizado" }), { status: 401 })

  const { profile_public } = await request.json()

  await supabase
    .from("profiles")
    .update({ profile_public: !!profile_public })
    .eq("id", session.user.id)

  return new Response(JSON.stringify({ success: true }), {
    headers: { "content-type": "application/json" },
  })
}
