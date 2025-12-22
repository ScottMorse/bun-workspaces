import fs from "fs";
import path from "path";
import { type BunWorkspacesError, defineErrors, isJsonObject } from "../core";
import { parseJsonc } from "../core/json";

export const BUN_LOCK_ERRORS = defineErrors(
  "BunLockNotFound",
  "MalformedBunLock",
  "UnsupportedBunLockVersion",
);

export type RelevantBunLockWorkspace = {
  name: string;
};

export type RelevantBunLock = {
  lockfileVersion: number;
  configVersion: number;
  workspaces?: Record<string, RelevantBunLockWorkspace>;
};

export const SUPPORTED_BUN_LOCK_VERSIONS = [1] as const;

export const readBunLock = (
  directory: string,
): RelevantBunLock | BunWorkspacesError => {
  const bunLockPath = path.join(directory, "bun.lock");
  if (!fs.existsSync(bunLockPath)) {
    return new BUN_LOCK_ERRORS.BunLockNotFound(
      `Did not find bun lockfile at "${bunLockPath}"`,
    );
  }

  let bunLockJson: RelevantBunLock | null = null;
  try {
    bunLockJson = parseJsonc(fs.readFileSync(bunLockPath, "utf8"));
  } catch (error) {
    return new BUN_LOCK_ERRORS.MalformedBunLock(
      `Failed to parse bun lockfile at "${bunLockPath}": ${(error as Error).message}`,
    );
  }

  if (!isJsonObject(bunLockJson)) {
    return new BUN_LOCK_ERRORS.MalformedBunLock(
      `Bun lockfile at "${bunLockPath}" is not a valid JSON object`,
    );
  }

  if (bunLockJson.lockfileVersion !== SUPPORTED_BUN_LOCK_VERSIONS[0]) {
    return new BUN_LOCK_ERRORS.UnsupportedBunLockVersion(
      `Unsupported bun lockfile version: ${bunLockJson.lockfileVersion} (Supported: ${SUPPORTED_BUN_LOCK_VERSIONS.join(", ")})`,
    );
  }

  return bunLockJson;
};
