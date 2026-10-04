import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

const generated = fileURLToPath(new URL("./src/generated/site.json", import.meta.url));

let site;
try {
  site = JSON.parse(readFileSync(generated, "utf8"));
} catch {
  throw new Error(
    "site/src/generated/site.json is missing. Run `npm run generate` from the repository root first, " +
      "or use `npm run build`, which generates before building.",
  );
}

export default defineConfig({
  site: site.url,
  trailingSlash: "always",
  build: { format: "directory" },
  integrations: [
    starlight({
      title: site.name,
      description: site.tagline,
      tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 3 },
      editLink: site.repo ? { baseUrl: `https://github.com/${site.repo}/edit/main/` } : undefined,
      lastUpdated: false,
      pagination: false,
      customCss: ["./src/styles/custom.css"],
      components: { Head: "./src/components/Head.astro" },
      sidebar: [
        { label: "All sources", link: "/" },
        { label: "Categories", items: [{ autogenerate: { directory: "categories" } }] },
        { label: "Source guides", items: [{ autogenerate: { directory: "sources" } }] },
        { label: "How this directory works", link: "/methodology/" },
      ],
    }),
  ],
});
