import type { APIRoute } from "astro"

export const GET: APIRoute = ({ request }) => {
  const country = request.headers.get("x-vercel-ip-country") || ""
  return new Response(JSON.stringify({ country }), {
    headers: { "content-type": "application/json" },
  })
}
