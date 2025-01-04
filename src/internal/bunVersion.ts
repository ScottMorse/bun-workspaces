import rootPackageJson from "../../package.json";

export const LIBRARY_CONSUMER_BUN_VERSION =
  rootPackageJson.custom.bunVersion.libraryConsumer;

export const BUILD_BUN_VERSION = rootPackageJson.custom.bunVersion.build;

export const getRequiredBunVersion = (build?: boolean) =>
  build ? BUILD_BUN_VERSION : LIBRARY_CONSUMER_BUN_VERSION;

const _Bun = typeof Bun === "undefined" ? ({} as typeof Bun) : Bun;

/**
 * Validates that the provided version satisfies the required Bun version
 * specified in the root `package.json`.
 */
export const validateBunVersion = (version: string, build?: boolean) =>
  _Bun ? _Bun.semver.satisfies(version, getRequiredBunVersion(build)) : true;

/**
 *
 * Validates that the Bun version of the current script satisfies the
 * required Bun version specified in the root `package.json`.
 */
export const validateCurrentBunVersion = (build?: boolean) =>
  validateBunVersion(_Bun?.version, build);
