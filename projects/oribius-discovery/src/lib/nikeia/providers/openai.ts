import type { GameContext, Feature } from "../types"
import type { NikeiaProvider } from "./interface"

function buildDescriptionPrompt(ctx: GameContext): string {
  return `Genera una descripción atractiva para el videojuego "${ctx.title}" en español.

Contexto del juego:
- Géneros: ${ctx.genres.join(", ") || "No especificado"}
- Etiquetas: ${ctx.tags.join(", ") || "No especificado"}
- Plataformas: ${ctx.platforms.join(", ") || "No especificado"}
- Desarrollador: ${ctx.developer || "No especificado"}
${ctx.year ? `- Año: ${ctx.year}` : ""}
${ctx.rating ? `- Puntuación: ${ctx.rating}/10` : ""}

La descripción debe:
- Tener 2-3 párrafos
- Ser atractiva y profesional
- Mencionar la ambientación, jugabilidad y aspectos únicos
- Estar en español
- No usar markdown ni HTML`
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

export class OpenAIProvider implements NikeiaProvider {
  private apiKey: string
  private model: string

  constructor(apiKey: string, model = "gpt-4o-mini") {
    this.apiKey = apiKey
    this.model = model
  }

  private async call(prompt: string): Promise<string> {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
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
      throw new Error(`OpenAI error ${res.status}: ${err}`)
    }

    const data = await res.json()
    return data.choices?.[0]?.message?.content || ""
  }

  async generateDescription(ctx: GameContext): Promise<string> {
    const prompt = buildDescriptionPrompt(ctx)
    return await this.call(prompt)
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

    // Fallback si la respuesta no es JSON válido
    return [
      { title: "Experiencia única", description: "Un juego que ofrece una experiencia inolvidable." },
      { title: "Jugabilidad sólida", description: "Mecánicas pulidas que hacen cada partida única." },
      { title: "Contenido variado", description: "Horas y horas de contenido por descubrir." },
    ]
  }
}
