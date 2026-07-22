/** Transforma URLs de imágenes de Sanity con params de tamaño/calidad */
export function imgUrl(url: string | null | undefined, width = 400, height?: number): string {
  if (!url) return ""
  if (!url.includes("cdn.sanity.io")) return url
  const params = `?w=${width}${height ? `&h=${height}&fit=crop` : ""}&q=80`
  return url.includes("?") ? url : url + params
}

/** Helper para cards de juego: usa cover_url o image */
export function gameImg(game: { cover_url?: string; image?: string } | null | undefined, width = 400): string {
  return imgUrl(game?.cover_url || game?.image, width)
}
