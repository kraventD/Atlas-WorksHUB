/**
 * Nikeia — Módulo JS para scripts de pipeline
 * Uso: import { generateDescription, generateFeatures } from "./nikeia.mjs"
 */

function buildDescriptionPrompt(ctx) {
  let prompt = `Traduce al español y mejora la siguiente descripción del videojuego "${ctx.title}".

Contexto del juego:
- Géneros: ${ctx.genres.join(", ") || "No especificado"}
- Etiquetas: ${ctx.tags.join(", ") || "No especificado"}
- Plataformas: ${ctx.platforms.join(", ") || "No especificado"}
- Desarrollador: ${ctx.developer || "No especificado"}
${ctx.year ? `- Año: ${ctx.year}` : ""}
${ctx.rating ? `- Puntuación: ${ctx.rating}/10` : ""}

`;

  if (ctx.description) {
    prompt += `Descripción original en inglés:\n${ctx.description}\n\n`;
  }

  prompt += `Escribe UNA SOLA descripción en español de 2-3 párrafos. Debe ser atractiva, profesional y mencionar la ambientación, jugabilidad y aspectos únicos del juego. No uses markdown, HTML, ni prefijos como "Descripción:" o "Traducción:". Empieza directamente con el texto de la descripción.`;
  return prompt;
}

function buildFeaturesPrompt(ctx) {
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
]`;
}

function getEndpoint() {
  return process.env.NIKEIA_ENDPOINT || "https://api.deepseek.com/v1/chat/completions";
}

function getModel() {
  return process.env.NIKEIA_MODEL || "deepseek-chat";
}

async function callAI(apiKey, prompt) {
  const res = await fetch(getEndpoint(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: getModel(),
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1000,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Nikeia error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

export function getNikeiaKey() {
  return process.env.NIKEIA_API_KEY || process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY || "";
}

export async function generateDescription(ctx) {
  const apiKey = getNikeiaKey();
  if (!apiKey) return null;
  try {
    return await callAI(apiKey, buildDescriptionPrompt(ctx));
  } catch (e) {
    console.warn("[Nikeia] Error generando descripción:", e.message);
    return null;
  }
}

function buildTagsPrompt(ctx) {
  return `Genera 10 etiquetas para el videojuego "${ctx.title}" en español.

Contexto del juego:
- Géneros: ${ctx.genres.join(", ") || "No especificado"}
- Etiquetas actuales: ${ctx.tags.join(", ") || "No especificado"}
- Descripción: ${(ctx.description || "").substring(0, 200)}

Las etiquetas deben:
- Ser palabras o frases cortas representativas del juego
- Incluir género, temática, modo de juego
- Estar en español
- Ser útiles para búsqueda y filtrado

Responde SOLO con un array JSON de strings, nada más:
["etiqueta1", "etiqueta2", "etiqueta3", ...]`;
}

export async function generateTags(ctx) {
  const apiKey = getNikeiaKey();
  if (!apiKey) return null;
  try {
    const raw = await callAI(apiKey, buildTagsPrompt(ctx));
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.slice(0, 10).map((t) => String(t).trim());
    }
  } catch (e) {
    console.warn("[Nikeia] Error generando etiquetas:", e.message);
  }
  return null;
}

export async function generateFeatures(ctx) {
  const apiKey = getNikeiaKey();
  if (!apiKey) return null;
  try {
    const raw = await callAI(apiKey, buildFeaturesPrompt(ctx));
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length <= 3) {
      return parsed.map((f) => ({ title: f.title, description: f.description }));
    }
  } catch (e) {
    console.warn("[Nikeia] Error generando features:", e.message);
  }
  return null;
}
