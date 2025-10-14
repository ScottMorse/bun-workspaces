import path from "path";
import { defineConfig } from "rspress/config";

export default defineConfig({
  root: "src/docs",
  themeDir: "src/theme",
  title: "bun-workspaces",
  globalStyles: path.resolve("src/theme/css/global.css"),
  description:
    "Documentation for bun-workspaces: A CLI to help manage Bun workspaces",
});
