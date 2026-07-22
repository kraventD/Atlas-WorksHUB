import { client } from "../sanity/client";
import type { RawgGame } from "../rawg/api";
import { generateFeatures } from "../features/mapper";
import { stripHtml } from "../utils";

function inferModeFromTags(tags: { name: string }[]): string {
  const names = tags.map((t) => t.name.toLowerCase());
  if (names.includes("singleplayer") && names.includes("multiplayer")) return "Single-player / Multiplayer";
  if (names.includes("co-op") || names.includes("cooperative")) return "Single-player / Co-op";
  if (names.includes("multiplayer")) return "Multiplayer";
  if (names.includes("singleplayer")) return "Single-player";
  return "";
}

function inferPlayersFromTags(tags: { name: string }[]): string {
  const names = tags.map((t) => t.name.toLowerCase());
  if (names.includes("co-op") || names.includes("cooperative") || names.includes("multiplayer")) return "1-4";
  return "1";
}

function extractSteamAppId(game: RawgGame): number | null {
  const steamStore = (game as any).stores?.find(
    (s: any) => s.store?.slug === "steam" || s.store?.name === "Steam"
  );
  return steamStore?.id || null;
}

export function rawgToSanityDoc(game: RawgGame) {
  return {
    _type: "game",
    title: game.name,
    slug: { _type: "slug", current: game.slug },
    description: stripHtml(game.description_raw || ""),
    rating: game.metacritic ? Math.round((game.metacritic / 10) * 10) / 10 : Math.round(game.rating * 10) / 10,
    year: game.released ? new Date(game.released).getFullYear() : undefined,
    release_date: game.released || "",
    developer: game.developers?.[0]?.name || "",
    publisher: game.publishers?.map((p) => p.name).join(", ") || "",
    duration: game.playtime ? `${game.playtime}h` : "",
    players: inferPlayersFromTags(game.tags || []),
    mode: inferModeFromTags(game.tags || []),
    genre_names: game.genres?.map((g) => g.name) || [],
    features: generateFeatures(game.tags?.map((t) => t.name) || []),
    tags: game.tags?.map((t) => t.name) || [],
    platforms: game.platforms?.map((p) => p.platform.name) || [],
    esrb_rating: game.esrb_rating?.name || "",
    image_url: game.background_image || "",
    screenshots: game.short_screenshots?.map((s) => s.image) || [],
  };
}

export async function importGameToSanity(game: RawgGame, extraFields: Record<string, any> = {}) {
  const existing = await client.fetch(
    `*[_type == "game" && slug.current == $slug][0]{_id}`,
    { slug: game.slug }
  );
  if (existing) {
    console.log(`⏭ ${game.name} ya existe en Sanity`);
    return;
  }
  const doc = { ...rawgToSanityDoc(game), ...extraFields };
  await client.create(doc);
  console.log(`✅ ${game.name} importado a Sanity`);
}

export async function updateGameInSanity(slug: string, fields: Record<string, any>) {
  const existing = await client.fetch(
    `*[_type == "game" && slug.current == $slug][0]{_id}`,
    { slug }
  );
  if (!existing) {
    console.log(`❌ ${slug} no encontrado en Sanity`);
    return;
  }
  await client.patch(existing._id).set(fields).commit();
  console.log(`✅ ${slug} actualizado en Sanity`);
}
