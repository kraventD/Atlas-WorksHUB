import type { GameContext, Feature } from "../types"
import type { NikeiaProvider } from "./interface"

function buildDescriptionPrompt(ctx: GameContext): string {
  let prompt = `Traduce al español y mejora la siguiente descripción del videojuego "${ctx.title}".

Contexto del juego:
- Géneros: ${ctx.genres.join(", ") || "No especificado"}
- Etiquetas: ${ctx.tags.join(", ") || "No especificado"}
- Plataformas: ${ctx.platforms.join(", ") || "No especificado"}
- Desarrollador: ${ctx.developer || "No especificado"}
${ctx.year ? `- Año: ${ctx.year}` : ""}
${ctx.rating ? `- Puntuación: ${ctx.rating}/10` : ""}

`

  if (ctx.description) {
    prompt += `Descripción original en inglés:\n${ctx.description}\n\n`
  }

  prompt += `Escribe UNA SOLA descripción en español de 2-3 párrafos. Debe ser atractiva, profesional y mencionar la ambientación, jugabilidad y aspectos únicos del juego. No uses markdown, HTML, ni prefijos como "Descripción:" o "Traducción:". Empieza directamente con el texto de la descripción.`
  return prompt
}

function buildFeaturesPrompt(ctx: GameContext): string {
  return `Genera 3 características destacadas para el videojuego "${ctx.title}" en español.

Contexto del juego:
- Géneros: ${ctx.genres.join(", ") || "No especificado"}
- Etiquetas: ${ctx.tags.join(", ") || "No especificado"}

Cada característica debe tener:
- "title": título corto (2-4 palabras)
- "description": frase descriptiva (máximo 15 palabras)

Responde SOLO con un array JSON válido, nada más:
[
  { "title": "...", "description": "..." },
  { "title": "...", "description": "..." },
  { "title": "...", "description": "..." }
]`
}

function buildTagsPrompt(ctx: GameContext): string {
  return `Genera 10 etiquetas para el videojuego "${ctx.title}" en español.

Contexto del juego:
- Géneros: ${ctx.genres.join(", ") || "No especificado"}
- Etiquetas actuales: ${ctx.tags.join(", ") || "No especificado"}
- Descripción: ${(ctx.description || "").substring(0, 200)}

Las etiquetas deben:
- Ser palabras o frases cortas representativas del juego
- Incluir género, temática, modo de juego, plataforma si aplica
- Estar en español
- Ser útiles para búsqueda y filtrado

Responde SOLO con un array JSON de strings, nada más:
["etiqueta1", "etiqueta2", "etiqueta3", ...]`
}

export class DeepSeekProvider implements NikeiaProvider {
  private apiKey: string
  private model: string

  constructor(apiKey: string, model = "deepseek-chat") {
    this.apiKey = apiKey
    this.model = model
  }

  private async call(prompt: string): Promise<string> {
    const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`DeepSeek error ${res.status}: ${err}`)
    }

    const data = await res.json()
    return data.choices?.[0]?.message?.content || ""
  }

  async generateDescription(ctx: GameContext): Promise<string> {
    const prompt = buildDescriptionPrompt(ctx)
    return await this.call(prompt)
  }

  async generateTags(ctx: GameContext): Promise<string[]> {
    const prompt = buildTagsPrompt(ctx)
    const raw = await this.call(prompt)

    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        return parsed.slice(0, 10).map((t: any) => String(t).trim())
      }
    } catch {}

    return ctx.tags.slice(0, 10)
  }

  async generateFeatures(ctx: GameContext): Promise<Feature[]> {
    const prompt = buildFeaturesPrompt(ctx)
    const raw = await this.call(prompt)

    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length <= 3) {
        return parsed.map((f: any) => ({ title: f.title, description: f.description }))
      }
    } catch {}

    return [
      { title: "Experiencia única", description: "Un juego que ofrece una experiencia inolvidable." },
      { title: "Jugabilidad sólida", description: "Mecánicas pulidas que hacen cada partida única." },
      { title: "Contenido variado", description: "Horas y horas de contenido por descubrir." },
    ]
  }
}
