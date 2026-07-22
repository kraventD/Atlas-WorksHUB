export type RawgGame = {
  id: number;
  name: string;
  slug: string;
  released: string;
  rating: number;
  ratings_count: number;
  metacritic: number | null;
  description_raw: string;
  developers: { name: string }[];
  publishers: { name: string }[];
  genres: { name: string; slug: string }[];
  platforms: { platform: { name: string } }[];
  tags: { name: string }[];
  background_image: string;
  short_screenshots: { image: string }[];
  playtime: number;
  esrb_rating: { name: string } | null;
};

const BASE = "https://api.rawg.io/api";

function apiKey(): string {
  return import.meta.env.RAWG_API_KEY;
}

export async function fetchPopularGames(page = 1, pageSize = 20): Promise<RawgGame[]> {
  const url = `${BASE}/games?key=${apiKey()}&page=${page}&page_size=${pageSize}&ordering=-rating&metacritic=70,100`;
  const res = await fetch(url);
  const data = await res.json();
  return data.results;
}

export async function fetchGameBySlug(slug: string): Promise<RawgGame | null> {
  const url = `${BASE}/games/${slug}?key=${apiKey()}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  return await res.json();
}

export async function searchGames(query: string): Promise<RawgGame[]> {
  const url = `${BASE}/games?key=${apiKey()}&search=${encodeURIComponent(query)}&page_size=10`;
  const res = await fetch(url);
  const data = await res.json();
  return data.results;
}
