## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Data pipeline

### Enriquecer un juego individual
```
node scripts/enrich-game.mjs <slug-rawg>
```
Ej: `node scripts/enrich-game.mjs elden-ring`

### Enriquecer todos los juegos existentes
```
node scripts/enrich-all.mjs
```

### Importar lote desde RAWG + Steam
```
node scripts/import-rawg.mjs [página] [cantidad]
```

### Nikeia — Motor de IA (wrapper abstracto)
- Ubicación: `src/lib/nikeia/`
- Provider por defecto: **DeepSeek** (`deepseek-chat`)
- Se puede cambiar a OpenAI configurando `NIKEIA_ENDPOINT` y `NIKEIA_MODEL`
- Requiere `NIKEIA_API_KEY` o `DEEPSEEK_API_KEY` en `.env`
- Sin API key: cae automáticamente a reglas (features) y datos RAWG (descripciones)

### Origen de datos del pipeline
| Fuente | Campos |
|---|---|
| RAWG API (`/games/{slug}`) | title, slug, description, rating, year, developer, publisher, duration, tags, platforms, image_url, esrb_rating |
| RAWG API (`/games/{slug}/screenshots`) | screenshots (6) |
| RAWG API (`/games/{slug}/stores`) | Steam App ID |
| Steam Store API (`/api/appdetails`) | price, size, languages, trailer_url (HLS) |
| Inferido de RAWG tags | mode (Singleplayer/Multiplayer/Co-op), players |

### TrailerPlayer
Componente React en `src/components/games/TrailerPlayer.tsx` que reproduce trailers HLS desde Steam usando hls.js.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
