export interface GameContext {
  title: string
  description?: string
  tags: string[]
  genres: string[]
  platforms: string[]
  rating?: number
  year?: number
  developer?: string
}

export interface Feature {
  title: string
  description: string
}

export interface NikeiaConfig {
  provider: "deepseek" | "openai" | "claude"
  apiKey: string
  model?: string
}
