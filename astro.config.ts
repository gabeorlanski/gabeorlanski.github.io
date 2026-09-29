import { readdirSync, readFileSync } from "node:fs";
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import partytown from "@astrojs/partytown";
import { remarkTocCustom } from "./src/plugins/remarkTocCustom";
import remarkGithubAlerts from "remark-github-blockquote-alert";
import expressiveCode from "astro-expressive-code";
import { pluginLineNumbers } from "@expressive-code/plugin-line-numbers";
import { SITE } from "./src/config";

// https://astro.build/config
// Posts marked `unlisted: true` are built but left out of the sitemap.
const unlistedPosts = readdirSync("src/data/blog")
  .filter(file => /\.mdx?$/.test(file))
  .filter(file =>
    /^unlisted:\s*true\s*$/m.test(
      readFileSync(`src/data/blog/${file}`, "utf8").split(/^---\s*$/m)[1] ?? ""
    )
  )
  .map(file => `/posts/${file.replace(/\.mdx?$/, "")}/`);

export default defineConfig({
  site: SITE.website,
  integrations: [
    expressiveCode({
      themes: ["min-light", "dracula"],
      useDarkModeMediaQuery: false,
      themeCssSelector: theme =>
        theme.type === "light"
          ? ':root:not([data-theme="dark"]), [data-theme="light"]'
          : '[data-theme="dark"]',
      plugins: [pluginLineNumbers()],
      defaultProps: {
        showLineNumbers: true,
      },
      styleOverrides: {
        codeFontFamily: "inherit",
      },
    }),
    mdx(),
    react(),
    sitemap({
      filter: page =>
        (SITE.showArchives || !page.endsWith("/archives")) &&
        !unlistedPosts.some(path => page.endsWith(path)),
    }),
    partytown({
      config: {
        forward: ["dataLayer.push"],
      },
    }),
  ],
  markdown: {
    remarkPlugins: [remarkMath, remarkTocCustom, remarkGithubAlerts],
    rehypePlugins: [rehypeKatex],
  },
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      exclude: ["@resvg/resvg-js"],
    },
  },
});
