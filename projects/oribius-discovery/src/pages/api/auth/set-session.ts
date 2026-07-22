import type { APIRoute } from "astro"

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const body = await request.json()
  const { access_token, refresh_token } = body

  if (access_token) {
    cookies.set("sb-access-token", access_token, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      httpOnly: true,
      secure: true,
      sameSite: "lax",
    })
  }
  if (refresh_token) {
    cookies.set("sb-refresh-token", refresh_token, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      httpOnly: true,
      secure: true,
      sameSite: "lax",
    })
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "content-type": "application/json" },
  })
}
