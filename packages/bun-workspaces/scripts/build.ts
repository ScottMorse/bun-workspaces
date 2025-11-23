import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { build } from "@rslib/core";

import rsLibConfig from "../rslib.config.ts";

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

  await Bun.spawn(["sh", "-c", "bunx prettier --write ."], {
    cwd: path.resolve(__dirname, "../dist"),
  });
};

if (import.meta.main) {
  await runBuild();
}
