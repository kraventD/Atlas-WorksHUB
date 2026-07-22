import { defineType, defineField } from "sanity";

export const genreSchema = defineType({
  name: "genre",
  title: "Género",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Nombre", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "slug", title: "Slug", type: "slug", options: { source: "title" } }),
    defineField({ name: "icon", title: "Icono (path SVG)", type: "text", rows: 3 }),
  ],
  preview: {
    select: { title: "title" },
  },
});
