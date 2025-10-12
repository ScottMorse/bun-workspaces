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
  const { name, version, main, homepage, bin } = JSON.parse(
    readFileSync(path.resolve(PACKAGE_JSON_PATH)).toString(),
  );

  const { custom, dependencies } = JSON.parse(
    readFileSync(ROOT_PACKAGE_JSON_PATH).toString(),
  );

  return {
    name,
    version,
    main,
    homepage,
    bin,
    custom,
    dependencies,
  };
};

if (import.meta.main) {
  await build(rsLibConfig);

  writeFileSync(
    PACKAGE_JSON_PATH,
    JSON.stringify(createDesiredPackageJson(), null, 2),
  );
}
