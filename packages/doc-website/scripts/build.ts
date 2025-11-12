import { writeFileSync, rmSync, readFileSync } from "node:fs";
import path from "node:path";
import { $ } from "bun";
import { globSync } from "glob";

export const runBuild = async () => {
  const outputPath = path.resolve("__dirname", "..", "doc_build");

  await $`bunx rspress build`;

  if (process.env.BW_DOC_ENV === "development") {
    rmSync(path.resolve(outputPath, "sitemap.xml"), {
      recursive: true,
      force: true,
    });
    writeFileSync(
      path.resolve(outputPath, "robots.txt"),
      "User-agent: *\nDisallow: /\n",
    );
  }

  const outputHtmlFiles = globSync(path.resolve(outputPath, "**/*.html"));
  for (const htmlFile of outputHtmlFiles) {
    const html = readFileSync(htmlFile, "utf8");
    writeFileSync(htmlFile, html.replace(/href=['"]\/?index['"]/g, 'href="/"'));
  }
};

if (import.meta.main) {
  await runBuild();
}
