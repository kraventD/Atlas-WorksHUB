const TAG_FEATURE_MAP = {
  "open world": [{ title: "Mundo abierto", description: "Explora un vasto mundo lleno de secretos y paisajes impresionantes." }],
  atmospheric: [{ title: "Atmósfera única", description: "Sumérgete en una ambientación cuidadosamente diseñada." }],
  "great soundtrack": [{ title: "Banda sonora", description: "Disfruta de una banda sonora que realza cada momento." }],
  difficult: [{ title: "Desafiante", description: "Enfréntate a desafíos que pondrán a prueba tus habilidades." }],
  "souls-like": [{ title: "Desafiante", description: "Enfréntate a desafíos que pondrán a prueba tus habilidades." }],
  multiplayer: [{ title: "Multijugador", description: "Comparte la experiencia con amigos en línea." }],
  "co-op": [{ title: "Cooperativo", description: "Comparte la aventura con amigos en modo cooperativo." }],
  cooperative: [{ title: "Cooperativo", description: "Comparte la aventura con amigos en modo cooperativo." }],
  "online co-op": [{ title: "Cooperativo", description: "Comparte la aventura con amigos en modo cooperativo." }],
  singleplayer: [{ title: "Historia profunda", description: "Una narrativa cautivadora diseñada para un jugador." }],
  rpg: [{ title: "RPG profundo", description: "Personaliza tu personaje y define tu propio camino." }],
  "action rpg": [{ title: "RPG de acción", description: "Combina combate dinámico con progresión de personaje." }],
  fantasy: [{ title: "Mundo fantástico", description: "Adéntrate en un reino de fantasía lleno de maravillas." }],
  "dark fantasy": [{ title: "Fantasía oscura", description: "Un mundo sombrío donde la belleza y el peligro coexisten." }],
  "story rich": [{ title: "Narrativa profunda", description: "Una historia que te mantendrá al borde del asiento." }],
  exploration: [{ title: "Exploración", description: "Descubre rincones ocultos y secretos en cada esquina." }],
  horror: [{ title: "Terror psicológico", description: "Una experiencia aterradora que no olvidarás." }],
  strategy: [{ title: "Estratégico", description: "Cada decisión cuenta. Planea tus movimientos con cuidado." }],
  sandbox: [{ title: "Libertad total", description: "Crea, destruye y experimenta sin límites." }],
  stealth: [{ title: "Sigilo", description: "Muévete en las sombras y evita ser detectado." }],
  "third person": [{ title: "Perspectiva cinematográfica", description: "Disfruta de una vista que realza la acción." }],
  "first person": [{ title: "Inmersión total", description: "Vive la acción desde los ojos del protagonista." }],
  pvp: [{ title: "Competitivo", description: "Demuestra tu valía contra otros jugadores." }],
  "sci-fi": [{ title: "Ciencia ficción", description: "Un futuro distópico lleno de tecnología y misterio." }],
  comedy: [{ title: "Humor", description: "Una aventura divertida y llena de momentos memorables." }],
  funny: [{ title: "Humor", description: "Una aventura divertida y llena de momentos memorables." }],
  detective: [{ title: "Investigación", description: "Resuelve misterios y descubre la verdad oculta." }],
  noir: [{ title: "Estilo noir", description: "Una atmósfera oscura con narrativa de novela negra." }],
};

const EXCLUDED = new Set([
  "steam achievements", "steam trading cards", "full controller support",
  "partial controller support", "statistics", "achievements", "cloud saves",
  "captions available", "commentary available", "includes source sdk",
  "mods", "mod support", "valve anti-cheat enabled",
  "single-player", "multi-player",
]);

export function generateFeatures(tags) {
  const lower = tags.map((t) => (t.name || t).toLowerCase().trim());
  const used = new Set();
  const result = [];

  for (const tag of lower) {
    if (EXCLUDED.has(tag)) continue;
    const match = TAG_FEATURE_MAP[tag];
    if (!match) continue;
    for (const f of match) {
      if (!used.has(f.title)) {
        used.add(f.title);
        result.push(f);
      }
    }
    if (result.length >= 3) break;
  }

  const fallbacks = [
    { title: "Experiencia única", description: "Un juego que ofrece una experiencia inolvidable." },
    { title: "Jugabilidad sólida", description: "Mecánicas pulidas que hacen cada partida única." },
    { title: "Contenido variado", description: "Horas y horas de contenido por descubrir." },
  ];

  for (const f of fallbacks) {
    if (result.length >= 3) break;
    if (!used.has(f.title)) {
      used.add(f.title);
      result.push(f);
    }
  }

  return result.slice(0, 3);
}
