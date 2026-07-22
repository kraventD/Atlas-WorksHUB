import type { APIRoute } from "astro"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export const POST: APIRoute = async ({ cookies }) => {
  const supabase = createSupabaseServerClient(cookies)
  await supabase.auth.signOut()

  cookies.delete("sb-access-token", { path: "/" })
  cookies.delete("sb-refresh-token", { path: "/" })

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "content-type": "application/json" },
  })
}
