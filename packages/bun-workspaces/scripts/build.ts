import { readFileSync, writeFileSync, copyFileSync, rmSync } from "node:fs";
import path from "node:path";
import { build } from "@rslib/core";
import { $ } from "bun";

import rsLibConfig, { IS_TEST_BUILD } from "../rslib.config.ts";

const PACKAGE_JSON_PATH = path.resolve(
  rsLibConfig.output?.distPath?.root ?? "",
  "../package.json",
);

const ROOT_PACKAGE_JSON_PATH = path.resolve(__dirname, "../../../package.json");

const createDesiredPackageJson = () => {
  const {
    name,
    version,
    description,
    main,
    homepage,
    repository,
    bin,
    _bwInternal,
    dependencies,
    keywords,
    scripts,
  } = JSON.parse(readFileSync(path.resolve(PACKAGE_JSON_PATH)).toString());

  const { license } = JSON.parse(
    readFileSync(ROOT_PACKAGE_JSON_PATH).toString(),
  );

  return {
    name,
    version,
    description,
    license,
    main: main.replace(".ts", ".mjs"),
    types: main.replace(".ts", ".d.ts"),
    homepage,
    repository,
    keywords,
    bin,
    _bwInternal,
    dependencies,
    ...(IS_TEST_BUILD ? { scripts } : {}),
  };
};

export const runBuild = async () => {
  console.log("Running rslib build...");
  await build(rsLibConfig);

  console.log("Writing package.json...");
  writeFileSync(
    PACKAGE_JSON_PATH,
    JSON.stringify(createDesiredPackageJson(), null, 2),
  );

  const outputPath = IS_TEST_BUILD ? "../dist.test" : "../dist";

  console.log("Writing .prettierignore...");
  writeFileSync(
    path.resolve(__dirname, outputPath, ".prettierignore"),
    "**/tests/**/*.json",
  );

  await $`cd ${path.resolve(__dirname, IS_TEST_BUILD ? "../dist.test" : "../dist")} && bunx prettier --write . > /dev/null`;

  rmSync(path.resolve(__dirname, outputPath, ".prettierignore"));
  rmSync(path.resolve(__dirname, outputPath, "node_modules"), {
    recursive: true,
    force: true,
  });
};

if (import.meta.main) {
  await runBuild();
}
