import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "rspress/config";
import packageJson from "../bun-workspaces/package.json";

const repoBaseUrl = packageJson.repository.url.replace(".git", "");

const TITLE = "bun-workspaces: Documentation";
const DESCRIPTION =
  "Documentation for bun-workspaces: A CLI to help manage Bun workspaces. Get metadata about your project and run scripts across your workspaces, with no additional setup required. Includes an API for JavaScript or TypeScript.";

export default defineConfig({
  root: "src/docs",
  themeDir: "src/theme",
  title: TITLE,
  globalStyles: path.resolve("src/theme/css/global.css"),
  description: DESCRIPTION,
  icon: "/bw-plain.ico",
  logo: "/bw-plain.png",
  logoText: `bun-workspaces`,
  search: {
    searchHooks: path.join(__dirname, "src/search/search.tsx"),
  },
  plugins: [
    // TODO: This worked briefly with mismatched versions. This will likely not work again until rspress v2 is out of beta.
    // * In the meantime, manage src/docs/public/sitemap.xml manually.
    // * And however, be mindful that trailing slashes vs. non-trailing slashes
    // * are important to the Google Search Console. This site works best with non-trailing links
    // * and sitemap.xml references.
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
            name: "og:title",
            content: TITLE,
          },
        },
        {
          tag: "meta",
          attrs: {
            name: "og:type",
            content: "website",
          },
        },
        {
          tag: "meta",
          attrs: {
            name: "og:description",
            content: DESCRIPTION,
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
            content: "https://bunworkspaces.com/bw-eye-og.png",
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
