import type { APIRoute } from "astro"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  const supabase = createSupabaseServerClient(cookies)

  const code = url.searchParams.get("code")
  const type = url.searchParams.get("type")

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data.session) {
      cookies.set("sb-access-token", data.session.access_token, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        httpOnly: true,
        secure: true,
        sameSite: "lax",
      })
      cookies.set("sb-refresh-token", data.session.refresh_token, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        httpOnly: true,
        secure: true,
        sameSite: "lax",
      })
    }
  }

  if (type === "recovery") {
    return redirect("/recuperar?type=recovery")
  }

  return redirect("/")
}
