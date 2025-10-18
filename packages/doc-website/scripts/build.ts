import { writeFileSync, rmSync } from "node:fs";
import path from "node:path";
import { $ } from "bun";

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
};

if (import.meta.main) {
  await runBuild();
}
