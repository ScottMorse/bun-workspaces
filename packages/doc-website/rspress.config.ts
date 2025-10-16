import path from "path";
import { defineConfig } from "rspress/config";

export default defineConfig({
  root: "src/docs",
  themeDir: "src/theme",
  title: "bun-workspaces",
  globalStyles: path.resolve("src/theme/css/global.css"),
  description:
    "Documentation for bun-workspaces: A CLI to help manage Bun workspaces",
  icon: "/bw-plain.ico",
  logo: "/bw-plain.png",
  logoText: `bun-workspaces`,
  search: {
    searchHooks: path.join(__dirname, "src/search/search.tsx"),
  },
  themeConfig: {
    nav: [
      {
        text: "CLI Usage",
        link: "/cli/index.html",
        position: "left",
        items: [
          {
            text: "Global Options",
            link: "/cli/index.html#global-options",
          },
          {
            text: "Commands",
            link: "/cli/index.html#commands",
          },
        ],
      },
      {
        text: "Configuration",
        link: "/config/index.html",
        position: "left",
      },
      {
        text: "Changelog",
        link: "https://github.com/ScottMorse/bun-workspaces/releases",
        position: "left",
      },
    ],
  },
});
