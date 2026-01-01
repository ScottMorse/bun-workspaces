import fs from "node:fs";
import path from "path";
import { defineConfig } from "rspress/config";
import packageJson from "../bun-workspaces/package.json";

const REQUIRED_BUN_VERSION = packageJson._bwInternal.bunVersion.libraryConsumer;

const DOMAIN = "https://bunworkspaces.com";
const GITHUB_REPO_URL = packageJson.repository.url.replace(".git", "");
const CHANGELOG_URL = `${GITHUB_REPO_URL}/releases`;
const LICENSE_URL = GITHUB_REPO_URL + "/blob/main/LICENSE.md";
const NPM_PACKAGE_URL = "https://www.npmjs.com/package/bun-workspaces";

const TITLE = "bun-workspaces — Bun monorepo tool | Documentation";
const DESCRIPTION =
  "Documentation for bun-workspaces: A CLI and TypeScript API for developers using the Bun runtime to manage monorepos and run scripts across their workspaces.";

const LD_JSON = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "bun-workspaces",
  alternateName: "bw",
  applicationCategory: "DeveloperApplication",
  applicationSubCategory: "CLI",
  operatingSystem: "Cross-platform",
  url: DOMAIN,
  releaseNotes: CHANGELOG_URL,
  description: DESCRIPTION,
  abstract: DESCRIPTION,
  sameAs: [GITHUB_REPO_URL, NPM_PACKAGE_URL],
  downloadUrl: NPM_PACKAGE_URL,
  license: LICENSE_URL,
  thumbnailUrl: `${DOMAIN}/images/png/bwunster-bg-square_300x300.png`,
  accessMode: "textual",
  author: {
    "@type": "Person",
    name: "Scott Morse",
  },
  publisher: {
    "@type": "Organization",
    name: "bun-workspaces",
    url: DOMAIN,
  },
  audience: {
    "@type": "Audience",
    audienceType: "Software developers",
    description:
      "Developers using the Bun runtime for TypeScript or JavaScript and its workspace feature for monorepo development.",
  },
  about: {
    "@type": "Thing",
    name: "Bun workspaces",
    sameAs: "https://bun.sh/docs/pm/workspaces",
    description:
      "Native workspace feature in the Bun JavaScript runtime used for managing multi-package monorepos.",
  },
  softwareVersion: packageJson.version,
};

export default defineConfig({
  root: "src/docs",
  themeDir: path.join(__dirname, "src/theme"),
  title: TITLE,
  globalStyles: path.resolve("src/theme/css/global.css"),
  description: DESCRIPTION,
  icon: "/favicon.ico",
  logo: "/images/png/bwunster_64x70.png",
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
    source: {
      define: {
        process: `({ env: {
          YEAR: ${JSON.stringify(new Date().getFullYear())},
          BUILD_ID: ${JSON.stringify(process.env.BUILD_ID ?? "(no build ID)")},
          REQUIRED_BUN_VERSION: ${JSON.stringify(REQUIRED_BUN_VERSION)},
        }})`,
      },
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
          tag: "script",
          attrs: {
            type: "application/ld+json",
          },
          children: JSON.stringify(
            LD_JSON,
            null,
            process.env.BW_DOC_ENV === "development" ? 2 : 0,
          ),
        },
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
            content: DOMAIN,
          },
        },
        {
          tag: "meta",
          attrs: {
            name: "og:image",
            content: `${DOMAIN}/images/png/bwunster-og-title_1200x630.png`,
          },
        },
      ],
    },
  },
  themeConfig: {
    socialLinks: [
      {
        icon: {
          svg: fs.readFileSync(
            path.resolve(
              __dirname,
              "src/docs/public/images/external/gh-sponsors.svg",
            ),
            "utf8",
          ),
        },
        mode: "link",
        content: "https://github.com/sponsors/bun-workspaces",
      },
      {
        icon: "github",
        mode: "link",
        content: GITHUB_REPO_URL,
      },
      {
        icon: {
          svg: fs.readFileSync(
            path.resolve(
              __dirname,
              "src/docs/public/images/external/npm-logo.svg",
            ),
            "utf8",
          ),
        },
        mode: "link",
        content: "https://www.npmjs.com/package/bun-workspaces",
      },
    ],
    nav: [
      {
        text: "CLI",
        link: "/cli",
        position: "left",
        activeMatch: "/cli",
        items: [
          {
            text: "Quick Start",
            link: "/cli",
            activeMatch: "/cli$",
          },
          {
            text: "Global Options",
            link: "/cli/global-options",
          },
          {
            text: "Commands",
            link: "/cli/commands",
          },
          // TODO enable when needed
          // {
          //   text: "Examples",
          //   link: "/cli/examples",
          // },
        ],
      },
      {
        text: "API",
        link: "/api",
        position: "left",
        activeMatch: "/api",
        items: [
          {
            text: "Quick Start",
            link: "/api",
            activeMatch: "/api$",
          },
          {
            text: "Reference",
            link: "/api/reference",
          },
          // TODO enable when needed
          // {
          //   text: "Examples",
          //   link: "/api/examples",
          // },
        ],
      },
      {
        text: "Config",
        link: "/config",
        position: "left",
        activeMatch: "/config",
        items: [
          {
            text: "Workspace Configuration",
            link: "/config",
          },
        ],
      },
      {
        text: "Concepts",
        link: "/concepts/glossary",
        position: "left",
        activeMatch: "/concepts",
        items: [
          {
            text: "Glossary",
            link: "/concepts/glossary",
          },
          {
            text: "Workspace Aliases",
            link: "/concepts/workspace-aliases",
          },
          {
            text: "Parallel Scripts",
            link: "/concepts/parallel-scripts",
          },
          {
            text: "Script Runtime Metadata",
            link: "/concepts/script-runtime-metadata",
          },
          {
            text: "Script Execution Order",
            link: "/concepts/script-execution-order",
          },
        ],
      },
      {
        text: "More",
        position: "left",
        items: [
          {
            text: "Roadmap",
            link: "/roadmap",
          },
          {
            text: "Changelog",
            link: CHANGELOG_URL,
          },
        ],
      },
    ],
  },
});
