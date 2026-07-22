import { createServerClient } from "@supabase/ssr"
import type { AstroCookies } from "astro"

export function createSupabaseServerClient(cookies: AstroCookies) {
  return createServerClient(
    import.meta.env.SUPABASE_URL,
    import.meta.env.SUPABASE_ANON_KEY,
    {
      cookies: {
        get(key: string) {
          return cookies.get(key)?.value
        },
        set(key: string, value: string) {
          cookies.set(key, value, { path: "/", httpOnly: true, secure: true, sameSite: "lax" })
        },
        remove(key: string) {
          cookies.delete(key, { path: "/" })
        },
      },
    }
  )
}
