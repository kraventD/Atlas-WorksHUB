import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "..", ".env") });

const RAWG_KEY = process.env.RAWG_API_KEY;
const SANITY_ID = process.env.SANITY_PROJECT_ID;
const SANITY_TOKEN = process.env.SANITY_API_TOKEN;
const SANITY_DATASET = process.env.SANITY_DATASET || "production";

if (!RAWG_KEY) throw new Error("Falta RAWG_API_KEY en .env");
if (!SANITY_ID || !SANITY_TOKEN) throw new Error("Faltan credenciales de Sanity en .env");

const sanity = createClient({
  projectId: SANITY_ID,
  dataset: SANITY_DATASET,
  apiVersion: "2024-01-01",
  token: SANITY_TOKEN,
  useCdn: false,
});

async function getSteamCover(slug) {
  try {
    const res = await fetch(
      `https://api.rawg.io/api/games/${slug}/stores?key=${RAWG_KEY}`
    );
    const data = await res.json();
    for (const s of data.results || []) {
      const match = s.url?.match(/steampowered\.com\/app\/(\d+)/);
      if (match) {
        return `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${match[1]}/library_600x900.jpg`;
      }
    }
  } catch {}
  return "";
}

async function getScreenshots(slug) {
  try {
    const res = await fetch(
      `https://api.rawg.io/api/games/${slug}/screenshots?key=${RAWG_KEY}`
    );
    const data = await res.json();
    return (data.results || []).slice(0, 6).map((s) => s.image);
  } catch {
    return [];
  }
}

async function updateGames() {
  const games = await sanity.fetch(
    `*[_type == "game"] { _id, title, "slug": slug.current, cover_url, screenshots }`
  );
  console.log(`📦 ${games.length} juegos encontrados en Sanity`);

  let updated = 0;
  let skipped = 0;

  for (const game of games) {
    if (game.cover_url) {
      console.log(`⏭ ${game.title} — ya tiene portada`);
      skipped++;
      continue;
    }

    console.log(`  🔎 Buscando portada para ${game.title}...`);
    const [coverUrl, screenshots] = await Promise.all([
      getSteamCover(game.slug),
      getScreenshots(game.slug),
    ]);

    const patch = {};
    if (coverUrl) patch.cover_url = coverUrl;
    if (screenshots.length > 0) patch.screenshots = screenshots;

    if (Object.keys(patch).length > 0) {
      await sanity.patch(game._id).set(patch).commit();
      console.log(`✅ ${game.title} — actualizado${coverUrl ? " con portada" : " con capturas"}`);
      updated++;
    } else {
      console.log(`⚠️ ${game.title} — sin datos Steam`);
      skipped++;
    }
  }

  console.log(`\n📊 Resumen: ${updated} actualizados, ${skipped} omitidos`);
}

updateGames().catch(console.error);
