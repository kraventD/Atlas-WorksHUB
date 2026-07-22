export type SteamAppDetail = {
  price: string;
  size: string;
  languages: string;
  trailer_url: string;
  categories: string[];
};

function extractSizeFromRequirements(html: string): string {
  const match = html.match(/(\d+\.?\d*)\s*(GB|MB)\s+available/i);
  if (match) return `${match[1]} ${match[2]}`;
  return "";
}

function extractLanguages(languagesStr: string): string {
  return languagesStr
    ?.replace(/<[^>]*>/g, "")
    .replace(/\s*\*\s*/g, "")
    .replace(/,?\s*(languages with full audio support|audio)/i, "")
    .trim() || "";
}

export async function fetchSteamAppDetails(appId: number): Promise<SteamAppDetail | null> {
  const url = `https://store.steampowered.com/api/appdetails?appids=${appId}&cc=us&l=en`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const app = data[String(appId)];
  if (!app?.success) return null;

  const d = app.data;
  const pcReqs = d.pc_requirements?.minimum || "";
  const categories = d.categories?.map((c: any) => c.description) || [];

  return {
    price: d.price_overview?.final_formatted || "",
    size: extractSizeFromRequirements(pcReqs),
    languages: extractLanguages(d.supported_languages || ""),
    trailer_url: d.movies?.[0]?.mp4?.max || d.movies?.[0]?.webm?.max || "",
    categories,
  };
}
