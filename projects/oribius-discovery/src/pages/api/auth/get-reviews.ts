import type { APIRoute } from "astro"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"

export const GET: APIRoute = async ({ url, cookies }) => {
  const slug = url.searchParams.get("slug")
  if (!slug) return new Response(JSON.stringify({ error: "slug requerido" }), { status: 400 })

  const supabase = createSupabaseServerClient(cookies)
  const { data, error } = await supabase
    .from("reviews")
    .select("user_id, rating, content, created_at")
    .eq("game_slug", slug)
    .order("created_at", { ascending: false })

  if (error) return new Response(JSON.stringify({ error }), { status: 500 })

  const userIds = [...new Set(data?.map((r: any) => r.user_id) || [])]
  let profileMap: Record<string, string> = {}

  if (userIds.length > 0) {
    // Use service_role to bypass RLS (solo lectura de display_name)
    const supabaseAdmin = createClient(
      import.meta.env.SUPABASE_URL,
      import.meta.env.SUPABASE_SERVICE_KEY
    )
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, display_name")
      .in("id", userIds)
    if (profiles) {
      for (const p of profiles) profileMap[p.id] = p.display_name
    }
  }

  const reviews = (data || []).map((r: any) => ({
    user_id: r.user_id,
    rating: r.rating,
    content: r.content,
    created_at: r.created_at,
    display_name: profileMap[r.user_id] || null,
  }))

  return new Response(JSON.stringify(reviews), {
    headers: { "content-type": "application/json" },
  })
}
