import type { APIRoute } from "astro"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export const GET: APIRoute = async ({ cookies, redirect }) => {
  const supabase = createSupabaseServerClient(cookies)

  const { data } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: "https://oribius-discovery.vercel.app/auth/callback",
    },
  })

  if (data.url) {
    return redirect(data.url)
  }

  return redirect("/login?error=oauth_failed")
}
