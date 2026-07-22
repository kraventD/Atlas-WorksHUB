import type { APIRoute } from "astro"

const CACHE_TTL = 3_600_000 // 1 hora
const cache = new Map<string, { data: any; timestamp: number }>()

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url)
  const appId = url.searchParams.get("appid")
  const cc = url.searchParams.get("cc") || "us"

  // Validar appid: numérico y positivo
  if (!appId || !/^\d+$/.test(appId) || Number(appId) <= 0) {
    return new Response(JSON.stringify({ error: "appid inválido" }), { status: 400 })
  }

  // Validar país: ISO 3166-1 alpha-2
  if (!/^[a-z]{2}$/i.test(cc)) {
    return new Response(JSON.stringify({ error: "cc inválido" }), { status: 400 })
  }

  const cacheKey = `${appId}-${cc.toLowerCase()}`
  const cached = cache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return new Response(JSON.stringify(cached.data), {
      headers: { "content-type": "application/json", "x-cache": "hit" },
    })
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    const steamRes = await fetch(
      `https://store.steampowered.com/api/appdetails?appids=${appId}&cc=${cc.toLowerCase()}&l=en`,
      { signal: controller.signal }
    )
    clearTimeout(timeout)

    if (!steamRes.ok) throw new Error("Steam API error")

    const data = await steamRes.json()
    const app = data[appId]

    if (!app?.success) {
      return new Response(JSON.stringify({ error: "App not found" }), { status: 404 })
    }

    const po = app.data?.price_overview
    const result = {
      price: po?.final_formatted || null,
      original: po?.initial_formatted || null,
      discount: po?.discount_percent || 0,
    }

    cache.set(cacheKey, { data: result, timestamp: Date.now() })

    return new Response(JSON.stringify(result), {
      headers: { "content-type": "application/json", "x-cache": "miss" },
    })
  } catch {
    return new Response(JSON.stringify({ error: "Error al obtener precio" }), { status: 502 })
  }
}
