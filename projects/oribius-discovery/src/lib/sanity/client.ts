import { createClient } from "@sanity/client";

const projectId = import.meta.env.SANITY_PROJECT_ID;
const dataset = import.meta.env.SANITY_DATASET || "production";
const token = import.meta.env.SANITY_API_TOKEN;

// Cache compartido para queries repetitivas
const queryCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 60_000; // 1 minuto

function cachedFetch<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const cached = queryCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return Promise.resolve(cached.data as T);
  }
  return fetcher().then((data) => {
    queryCache.set(key, { data, timestamp: Date.now() });
    return data;
  });
}

export const client = createClient({
  projectId,
  dataset,
  apiVersion: "2024-01-01",
  useCdn: true,
  token,
});

export async function getAllGames() {
  return await client.fetch(`*[_type == "game"] | order(rating desc) {
    _id,
    title,
    "slug": slug.current,
    rating,
    year,
    release_date,
    description,
    developer,
    publisher,
    price,
    original_price,
    discount_percent,
    steam_app_id,
    ratings_count,
    pc_requirements_min,
    pc_requirements_rec,
    tags,
    genre_names,
    features,
    platforms,
    duration,
    players,
    trailer_url,
    "image": image_url,
    cover_url,
    languages,
    size,
    mode,
  }`);
}

export async function getExploreGames() {
  return await cachedFetch("explore", () =>
    client.fetch(`*[_type == "game"] | order(rating desc) {
    _id,
    title,
    "slug": slug.current,
    rating,
    ratings_count,
    year,
    release_date,
    genre_names,
    platforms,
    "image": image_url,
    cover_url,
  }`));
}

export async function getSimpleGames() {
  return await cachedFetch("simple", () =>
    client.fetch(`*[_type == "game"] | order(rating desc) {
    title,
    "slug": slug.current,
    rating,
    "image": image_url,
    cover_url,
  }`));
}

export async function getTopGames(limit = 6) {
  return await cachedFetch(`top-${limit}`, () =>
    client.fetch(`*[_type == "game"] | order(rating desc) [0...${limit}] {
    title,
    "slug": slug.current,
    rating,
    "image": image_url,
    cover_url,
  }`));
}

export async function getGameBySlug(slug: string) {
  return await client.fetch(
    `*[_type == "game" && slug.current == $slug][0] {
      _id,
      title,
      "slug": slug.current,
      rating,
      year,
      release_date,
      description,
      developer,
      publisher,
      price,
      original_price,
      discount_percent,
      steam_app_id,
      ratings_count,
      pc_requirements_min,
      pc_requirements_rec,
      tags,
      genre_names,
      features,
      platforms,
      duration,
      players,
      trailer_url,
      "image": image_url,
      cover_url,
      screenshots,
      languages,
      size,
      mode,
    }`,
    { slug }
  );
}
