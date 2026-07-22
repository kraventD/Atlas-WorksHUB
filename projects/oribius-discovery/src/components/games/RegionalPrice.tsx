import { useState, useEffect, useRef } from "react"
import { Loader } from "lucide-react"

interface RegionalPriceProps {
  steamAppId?: number
  defaultPrice: string
  defaultOriginal?: string
  defaultDiscount?: number
}

type PriceState = "loading" | "done" | "fallback"

export function RegionalPrice({ steamAppId, defaultPrice, defaultOriginal, defaultDiscount }: RegionalPriceProps) {
  const [state, setState] = useState<PriceState>("loading")
  const [price, setPrice] = useState(defaultPrice)
  const [original, setOriginal] = useState(defaultOriginal || "")
  const [discount, setDiscount] = useState(defaultDiscount || 0)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    if (!steamAppId) {
      setState("fallback")
      return
    }

    async function fetchRegionalPrice() {
      try {
        // 1. Get user's country via Vercel geolocation
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)

        const geoRes = await fetch("/api/country", { signal: controller.signal })
        clearTimeout(timeoutId)

        if (!geoRes.ok) throw new Error("Geo status " + geoRes.status)
        const geo = await geoRes.json()
        const country = geo.country || ""

        console.log("[RegionalPrice] País detectado:", country)

        if (!country || country === "US") {
          console.log("[RegionalPrice] US o sin país → default")
          if (mountedRef.current) setState("fallback")
          return
        }

        // 2. Fetch price via our proxy (avoids CORS)
        const priceController = new AbortController()
        const priceTimeout = setTimeout(() => priceController.abort(), 8000)
        const priceRes = await fetch(
          `/api/steam-price?appid=${steamAppId}&cc=${country.toLowerCase()}`,
          { signal: priceController.signal }
        )
        clearTimeout(priceTimeout)
        if (!priceRes.ok) throw new Error("Price proxy status " + priceRes.status)
        const priceData = await priceRes.json()

        console.log("[RegionalPrice] Precio regional para", country, ":", priceData.price)

        if (priceData.price) {
          if (mountedRef.current) {
            setPrice(priceData.price)
            setOriginal(priceData.original || "")
            setDiscount(priceData.discount || 0)
            setState("done")
          }
        } else {
          console.log("[RegionalPrice] Sin precio regional → default")
          if (mountedRef.current) setState("fallback")
        }
      } catch (err: any) {
        console.warn("[RegionalPrice] Error:", err.message)
        if (mountedRef.current) setState("fallback")
      }
    }

    fetchRegionalPrice()

    return () => { mountedRef.current = false }
  }, [steamAppId])

  if (state === "loading") {
    return (
      <div className="flex items-center gap-2 mb-4 text-gray-400">
        <Loader className="h-4 w-4 animate-spin" />
        <span className="text-sm">Consultando precio...</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 mb-4">
      <p className="text-3xl font-bold text-white [text-shadow:0_2px_12px_rgba(0,0,0,0.9),0_1px_4px_rgba(0,0,0,0.7)]">
        {price}
      </p>
      {original && discount > 0 && (
        <>
          <p className="text-sm text-gray-500 line-through [text-shadow:0_2px_6px_rgba(0,0,0,0.9)]">{original}</p>
          <span className="px-1.5 py-0.5 rounded bg-green-600 text-white text-[10px] font-bold">-{discount}%</span>
        </>
      )}
    </div>
  )
}
