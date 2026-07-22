import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { schemas } from "./schemas";

export default defineConfig({
  title: "Oribius Discovery",
  projectId: "boo4590z",
  dataset: "production",
  plugins: [structureTool()],
  schema: { types: schemas },
});
