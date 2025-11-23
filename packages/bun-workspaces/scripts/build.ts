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
    main,
    homepage,
    repository,
    bin,
    custom,
    dependencies,
  } = JSON.parse(readFileSync(path.resolve(PACKAGE_JSON_PATH)).toString());

  const { license } = JSON.parse(
    readFileSync(ROOT_PACKAGE_JSON_PATH).toString(),
  );

  return {
    name,
    version,
    license,
    main: main.replace(".ts", ".mjs"),
    types: main.replace(".ts", ".d.ts"),
    homepage,
    repository,
    bin,
    custom,
    dependencies,
  };
};

export const runBuild = async () => {
  await build(rsLibConfig);

  writeFileSync(
    PACKAGE_JSON_PATH,
    JSON.stringify(createDesiredPackageJson(), null, 2),
  );

  const outputPath = IS_TEST_BUILD ? "../dist.test" : "../dist";

  writeFileSync(
    path.resolve(__dirname, outputPath, ".prettierignore"),
    "**/tests/**/*.json",
  );

  await $`cd ${path.resolve(__dirname, IS_TEST_BUILD ? "../dist.test" : "../dist")} && bunx prettier --write .`;

  rmSync(path.resolve(__dirname, outputPath, ".prettierignore"));
};

if (import.meta.main) {
  await runBuild();
}
