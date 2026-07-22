import type { GameContext, Feature } from "../types"

export interface NikeiaProvider {
  generateDescription(ctx: GameContext): Promise<string>
  generateFeatures(ctx: GameContext): Promise<Feature[]>
  generateTags(ctx: GameContext): Promise<string[]>
}
