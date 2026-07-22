/**
 * Importa juegos populares desde RAWG a Sanity con enriquecimiento Steam
 * Uso: node scripts/import-rawg.mjs [página] [cantidad]
 * Ej:  node scripts/import-rawg.mjs 1 10
 */
import dotenv from "dotenv";
dotenv.config();
import { createClient } from "@sanity/client";
import { generateFeatures } from "./features.mjs";
import { stripHtml } from "./utils.mjs";
import { generateDescription as nikeiaDescription, generateFeatures as nikeiaFeatures, generateTags as nikeiaTags, getNikeiaKey } from "./nikeia.mjs";

const RAWG_KEY = process.env.RAWG_API_KEY;
const sanity = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

// ─── Helpers ───────────────────────────────────────────

function inferModeFromTags(tags) {
  const names = (tags || []).map((t) => (t.name || t).toLowerCase());
  if (names.includes("singleplayer") && names.includes("multiplayer")) return "Single-player / Multiplayer";
  if (names.includes("co-op") || names.includes("cooperative")) return "Single-player / Co-op";
  if (names.includes("multiplayer")) return "Multiplayer";
  if (names.includes("singleplayer")) return "Single-player";
  return "";
}

function inferPlayersFromTags(tags) {
  const names = (tags || []).map((t) => (t.name || t).toLowerCase());
  if (names.includes("co-op") || names.includes("cooperative") || names.includes("multiplayer")) return "1-4";
  return "1";
}

function extractSizeFromRequirements(html) {
  const match = html.match(/(\d+\.?\d*)\s*(GB|MB)\s+(?:available\s+)?(?:space\s+)?(?:or\s+more\s+)?/i);
  if (match) return `${match[1]} ${match[2]}`;
  return "";
}

function extractLanguages(languagesStr) {
  return languagesStr
    ?.replace(/<[^>]*>/g, "")
    .replace(/\s*\*\s*/g, "")
    .replace(/,?\s*(languages with full audio support|audio)/i, "")
    .trim() || "";
}

// ─── RAWG ──────────────────────────────────────────────

async function fetchPopularRawg(page = 1) {
  const url = `https://api.rawg.io/api/games?key=${RAWG_KEY}&page=${page}&page_size=20&ordering=-rating&metacritic=70,100`;
  const res = await fetch(url);
  return (await res.json()).results;
}

async function fetchRawgDetail(slug) {
  const url = `https://api.rawg.io/api/games/${slug}?key=${RAWG_KEY}`;
  const res = await fetch(url);
  return res.ok ? await res.json() : null;
}

async function fetchRawgScreenshots(slug) {
  const url = `https://api.rawg.io/api/games/${slug}/screenshots?key=${RAWG_KEY}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    return (await res.json()).results?.map((s) => s.image) || [];
  } catch { return []; }
}

// ─── Steam ─────────────────────────────────────────────

async function getSteamAppId(rawgSlug) {
  const url = `https://api.rawg.io/api/games/${rawgSlug}/stores?key=${RAWG_KEY}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const steamStore = data.results?.find((s) => s.store_id === 1);
  if (!steamStore?.url) return null;
  const match = steamStore.url.match(/\/app\/(\d+)/);
  return match ? parseInt(match[1]) : null;
}

async function fetchSteamData(steamAppId) {
  const url = `https://store.steampowered.com/api/appdetails?appids=${steamAppId}&cc=us&l=en`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const app = data[String(steamAppId)];
  if (!app?.success) return null;

  const d = app.data;
  const pcReqs = d.pc_requirements?.minimum || "";
  const movies = d.movies || [];
  const bestMovie = movies.find((m) => /launch|official|announcement/i.test(m.name) && m.highlight)
    || movies.find((m) => m.highlight) || movies[0];

  return {
    price: d.price_overview?.final_formatted || "",
    original_price: d.price_overview?.initial_formatted || "",
    discount_percent: d.price_overview?.discount_percent || 0,
    size: extractSizeFromRequirements(pcReqs),
    languages: extractLanguages(d.supported_languages || ""),
    trailer_url: bestMovie?.hls_h264 || bestMovie?.dash_h264 || "",
    pc_requirements_min: d.pc_requirements?.minimum || "",
    pc_requirements_rec: d.pc_requirements?.recommended || "",
  };
}

// ─── Cover verification ──────────────────────────────────

async function verifyCoverUrl(url) {
  if (!url) return null;
  try {
    const res = await fetch(url, { method: "HEAD" });
    return res.ok ? url : null;
  } catch {
    return null;
  }
}

// ─── Main ──────────────────────────────────────────────

async function searchYoutubeTrailer(gameName) {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return null;
  const queries = [
    `${gameName} official trailer`,
    `${gameName} launch trailer`,
    `${gameName} trailer`,
  ];
  for (const q of queries) {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(q)}&maxResults=1&type=video&videoCategoryId=20&key=${key}`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      const videoId = data.items?.[0]?.id?.videoId;
      if (videoId) return `https://www.youtube.com/watch?v=${videoId}`;
    } catch {}
  }
  return null;
}

async function enrichAndImport(rawgGame) {
  const steamAppId = await getSteamAppId(rawgGame.slug);
  if (!steamAppId) {
    console.log(`  ⏭ ${rawgGame.name} — no está en Steam`);
    return;
  }
  const screenshots = await fetchRawgScreenshots(rawgGame.slug);
  const steamData = await fetchSteamData(steamAppId);
  let tags = rawgGame.tags || [];

  let trailerUrl = steamData?.trailer_url || "";
  if (!trailerUrl) {
    trailerUrl = await searchYoutubeTrailer(rawgGame.name) || "";
  }

  // ─── Nikeia ─────────────────────────────────────────
  let description = stripHtml(rawgGame.description_raw || "");
  let features = generateFeatures((tags || []).map((t) => t.name || t));
  const nikeiaKey = getNikeiaKey();

  if (nikeiaKey) {
    const ctx = {
      title: rawgGame.name,
      genres: rawgGame.genres?.map((g) => g.name) || [],
      tags: (tags || []).map((t) => t.name || t),
      platforms: rawgGame.platforms?.map((p) => p.platform.name) || [],
      developer: rawgGame.developers?.[0]?.name || "",
      year: rawgGame.released ? new Date(rawgGame.released).getFullYear() : undefined,
      rating: rawgGame.metacritic ? Math.round(rawgGame.metacritic / 10 * 10) / 10 : rawgGame.rating,
    };

    const nikeiaDesc = await nikeiaDescription({ ...ctx, description });
    if (nikeiaDesc) description = nikeiaDesc;

    const nikeiaFeat = await nikeiaFeatures(ctx);
    if (nikeiaFeat) features = nikeiaFeat;

    const nikeiaTagList = await nikeiaTags(ctx);
    if (nikeiaTagList) tags = nikeiaTagList;
  }

  const doc = {
    _type: "game",
    title: rawgGame.name,
    slug: { _type: "slug", current: rawgGame.slug },
    description,
    rating: rawgGame.metacritic
      ? Math.round((rawgGame.metacritic / 10) * 10) / 10
      : Math.round(rawgGame.rating * 10) / 10,
    year: rawgGame.released ? new Date(rawgGame.released).getFullYear() : undefined,
    release_date: rawgGame.released || "",
    developer: rawgGame.developers?.[0]?.name || "",
    publisher: rawgGame.publishers?.map((p) => p.name).join(", ") || "",
    duration: rawgGame.playtime ? `${rawgGame.playtime}h` : "",
    players: inferPlayersFromTags(tags),
    mode: inferModeFromTags(tags),
    ratings_count: rawgGame.ratings_count || 0,
    genre_names: rawgGame.genres?.map((g) => g.name) || [],
    features,
    tags: (tags || []).map((t) => t.name || t),
    platforms: rawgGame.platforms?.map((p) => p.platform.name) || [],
    image_url: rawgGame.background_image || "",
    screenshots,
    trailer_url: trailerUrl,
    steam_app_id: steamAppId,
    cover_url: await verifyCoverUrl(
      steamAppId
        ? `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${steamAppId}/library_600x900.jpg`
        : null
    ),
    price: steamData?.price || "Consultar",
    original_price: steamData?.original_price || "",
    discount_percent: steamData?.discount_percent || 0,
    ...(steamData ? {
      size: steamData.size,
      languages: steamData.languages,
      pc_requirements_min: steamData.pc_requirements_min,
      pc_requirements_rec: steamData.pc_requirements_rec,
    } : {}),
  };

  const existing = await sanity.fetch(
    `*[_type == "game" && slug.current == $slug][0]{_id}`,
    { slug: rawgGame.slug }
  );

  if (existing) {
    await sanity.patch(existing._id).set(doc).commit();
    console.log(`  ✅ ${rawgGame.name} — actualizado`);
  } else {
    await sanity.create(doc);
    console.log(`  ✅ ${rawgGame.name} — importado`);
  }
}

async function main() {
  const page = parseInt(process.argv[2]) || 1;
  const limit = parseInt(process.argv[3]) || 20;

  console.log(`🔍 Buscando juegos populares en RAWG (página ${page})...`);
  const games = await fetchPopularRawg(page);
  const batch = games.slice(0, limit);
  console.log(`📦 ${batch.length} juegos para procesar\n`);

  let imported = 0;
  let skipped = 0;

  for (const game of batch) {
    await new Promise((r) => setTimeout(r, 1500)) // delay to avoid RAWG rate-limit
    const detail = await fetchRawgDetail(game.slug);
    if (!detail) { skipped++; continue; }
    await enrichAndImport(detail);
    imported++;
  }

  console.log(`\n📊 Resumen: ${imported} procesados, ${skipped} omitidos`);
}

main().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
