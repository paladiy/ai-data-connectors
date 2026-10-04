import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import react from "@astrojs/react";

const generated = fileURLToPath(new URL("./src/generated/site.json", import.meta.url));

const directoryPath = fileURLToPath(new URL("./src/generated/directory.json", import.meta.url));
let site;
try {
  site = JSON.parse(readFileSync(generated, "utf8"));
} catch {
  throw new Error(
    "site/src/generated/site.json is missing. Run `npm run generate` from the repository root first, " +
      "or use `npm run build`, which generates before building.",
  );
}

const sources = JSON.parse(readFileSync(directoryPath, "utf8")).sources
  .map((entry) => ({ label: entry.name, link: `/sources/${entry.slug}/` }))
  .sort((a, b) => a.label.localeCompare(b.label, "en", { sensitivity: "base", numeric: true }));

const siteUrl = new URL(site.url);

export default defineConfig({
  site: siteUrl.origin,
  base: siteUrl.pathname.replace(/\/?$/, "/"),
  trailingSlash: "always",
  build: { format: "directory" },
  integrations: [
    react(),
    starlight({
      title: site.name,
      description: site.tagline,
      tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 3 },
      editLink: site.repo ? { baseUrl: `https://github.com/${site.repo}/edit/main/` } : undefined,
      lastUpdated: false,
      pagination: false,
      customCss: ["@mantine/core/styles.layer.css", "./src/styles/custom.css", "./src/generated/ai-tools.css"],
      components: { Head: "./src/components/Head.astro" },
      sidebar: [
        { label: "All sources", link: "/" },
        { label: "Connectors", items: sources },
        { label: "About", link: "/about/" },
      ],
    }),
  ],
});
