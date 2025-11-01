import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "rspress/config";
import packageJson from "../bun-workspaces/package.json";

const repoBaseUrl = packageJson.repository.url.replace(".git", "");

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
  plugins: [
    // TODO: find fix for using this plugin or wait to see if a package update fixes it
    // pluginSitemap({
    //   siteUrl: new URL(packageJson.homepage).origin,
    //   defaultChangeFreq: "weekly",
    //   defaultPriority: "0.8",
    // }),
  ],
  route: {
    cleanUrls: true,
  },
  builderConfig: {
    output: {
      cleanDistPath: true,
    },
    html: {
      tags: [
        ...(process.env.BW_DOC_ENV === "development"
          ? [
              {
                tag: "meta",
                attrs: {
                  name: "robots",
                  content: "noindex, nofollow",
                },
              },
            ]
          : []),
        {
          tag: "meta",
          attrs: {
            name: "description",
            content:
              "Documentation for bun-workspaces: A CLI to help manage Bun monorepos",
          },
        },
        {
          tag: "meta",
          attrs: {
            name: "og:title",
            content:
              "Documentation for bun-workspaces: A CLI to help manage Bun monorepos",
          },
        },
        {
          tag: "meta",
          attrs: {
            name: "og:description",
            content:
              "Get metadata about your project and run scripts across your workspaces, with no additional setup required",
          },
        },
        {
          tag: "meta",
          attrs: {
            name: "og:url",
            content: "https://bunworkspaces.com/",
          },
        },
        {
          tag: "meta",
          attrs: {
            name: "og:image",
            content: "https://bunworkspaces.com/bw-plain.png",
          },
        },
      ],
    },
  },
  themeConfig: {
    socialLinks: [
      {
        icon: "github",
        mode: "link",
        content: repoBaseUrl,
      },
      {
        icon: {
          svg: fs.readFileSync(
            path.resolve(__dirname, "src/docs/public/npm-logo.svg"),
            "utf8",
          ),
        },
        mode: "link",
        content: "https://www.npmjs.com/package/bun-workspaces",
      },
    ],
    nav: [
      {
        text: "CLI Usage",
        link: "/cli",
        position: "left",
        activeMatch: "/cli",
        items: [
          {
            text: "Global Options",
            link: "/cli#global-options",
          },
          {
            text: "Commands",
            link: "/cli#commands",
          },
        ],
      },
      {
        text: "Configuration",
        link: "/config",
        position: "left",
        activeMatch: "/config",
      },
      {
        text: "Changelog",
        link: `${repoBaseUrl}/releases`,
        position: "left",
      },
    ],
  },
});
