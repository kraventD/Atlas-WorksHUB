import type { NikeiaConfig, GameContext, Feature } from "./types"
import type { NikeiaProvider } from "./providers/interface"
import { OpenAIProvider } from "./providers/openai"
import { DeepSeekProvider } from "./providers/deepseek"

let _provider: NikeiaProvider | null = null

function getProvider(config?: NikeiaConfig): NikeiaProvider | null {
  if (_provider) return _provider

  const apiKey = config?.apiKey
    || import.meta.env.NIKEIA_API_KEY
    || import.meta.env.DEEPSEEK_API_KEY
    || import.meta.env.OPENAI_API_KEY
  const providerName = config?.provider
    || (import.meta.env.DEEPSEEK_API_KEY ? "deepseek" : "openai")

  if (!apiKey) return null

  switch (providerName) {
    case "deepseek":
      _provider = new DeepSeekProvider(apiKey, config?.model)
      break
    case "openai":
      _provider = new OpenAIProvider(apiKey, config?.model)
      break
    default:
      _provider = new DeepSeekProvider(apiKey)
  }

  return _provider
}

export function isNikeiaAvailable(): boolean {
  return !!getProvider()
}

export async function generateDescription(ctx: GameContext, config?: NikeiaConfig): Promise<string | null> {
  const provider = getProvider(config)
  if (!provider) return null
  try {
    return await provider.generateDescription(ctx)
  } catch (e) {
    console.warn("[Nikeia] Error generating description:", (e as Error).message)
    return null
  }
}

export async function generateFeatures(ctx: GameContext, config?: NikeiaConfig): Promise<Feature[] | null> {
  const provider = getProvider(config)
  if (!provider) return null
  try {
    return await provider.generateFeatures(ctx)
  } catch (e) {
    console.warn("[Nikeia] Error generating features:", (e as Error).message)
    return null
  }
}

export async function generateTags(ctx: GameContext, config?: NikeiaConfig): Promise<string[] | null> {
  const provider = getProvider(config)
  if (!provider) return null
  try {
    return await provider.generateTags(ctx)
  } catch (e) {
    console.warn("[Nikeia] Error generating tags:", (e as Error).message)
    return null
  }
}
