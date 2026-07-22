import { client } from "./client";

export const gameSchema = {
  name: "game",
  title: "Juego",
  type: "document",
  fields: [
    { name: "title", title: "Título", type: "string", validation: (Rule: any) => Rule.required() },
    { name: "slug", title: "Slug", type: "slug", options: { source: "title", maxLength: 96 } },
    { name: "description", title: "Descripción", type: "text" },
    { name: "rating", title: "Puntuación", type: "number" },
    { name: "price", title: "Precio", type: "string" },
    { name: "original_price", title: "Precio original (sin descuento)", type: "string" },
    { name: "discount_percent", title: "Descuento (%)", type: "number" },
    { name: "ratings_count", title: "Cantidad de valoraciones", type: "number" },
    { name: "pc_requirements_min", title: "Requisitos mínimos", type: "text" },
    { name: "pc_requirements_rec", title: "Requisitos recomendados", type: "text" },
    { name: "year", title: "Año", type: "number" },
    { name: "release_date", title: "Fecha de lanzamiento", type: "string" },
    { name: "developer", title: "Desarrollador", type: "string" },
    { name: "publisher", title: "Publicador", type: "string" },
    { name: "duration", title: "Duración", type: "string" },
    { name: "players", title: "Jugadores", type: "string" },
    { name: "size", title: "Tamaño", type: "string" },
    { name: "mode", title: "Modo de juego", type: "string" },
    { name: "languages", title: "Idiomas", type: "string" },
    { name: "trailer_url", title: "URL del tráiler", type: "url" },
    { name: "genre_names", title: "Nombres de género", type: "array", of: [{ type: "string" }] },
    {
      name: "features",
      title: "Características",
      type: "array",
      of: [{ type: "object", fields: [
        { name: "title", type: "string", title: "Título" },
        { name: "description", type: "string", title: "Descripción" },
      ]}],
    },
    { name: "tags", title: "Etiquetas", type: "array", of: [{ type: "string" }] },
    {
      name: "genres",
      title: "Géneros",
      type: "array",
      of: [{ type: "reference", to: [{ type: "genre" }] }],
    },
    {
      name: "platforms",
      title: "Plataformas",
      type: "array",
      of: [{ type: "string" }],
    },
    {
      name: "image",
      title: "Imagen principal",
      type: "image",
    },
    {
      name: "gallery",
      title: "Galería",
      type: "array",
      of: [{ type: "image" }],
    },
  ],
};

export const genreSchema = {
  name: "genre",
  title: "Género",
  type: "document",
  fields: [
    { name: "title", title: "Título", type: "string", validation: (Rule: any) => Rule.required() },
    { name: "slug", title: "Slug", type: "slug", options: { source: "title" } },
    { name: "icon", title: "Icono SVG", type: "text" },
  ],
};
