import fs from "fs";
import path from "path";
import { Glob } from "glob";
import { logger } from "../internal/logger";
import { ERRORS } from "./errors";

export const resolvePackageJsonPath = (directoryItem: string) => {
  if (path.basename(directoryItem) === "package.json") {
    return directoryItem;
  }
  if (fs.existsSync(path.join(directoryItem, "package.json"))) {
    return path.join(directoryItem, "package.json");
  }
  return "";
};

export type ResolvedPackageJsonContent = {
  name: string;
  workspaces: string[];
  scripts: Record<string, string>;
} & Record<string, unknown>;

type UnknownPackageJson = Record<string, unknown>;

export const scanWorkspaceGlob = (pattern: string, rootDir: string) =>
  new Glob(pattern, { absolute: true, cwd: rootDir }).iterateSync();

const validateJsonRoot = (json: UnknownPackageJson) => {
  if (!json || typeof json !== "object" || Array.isArray(json)) {
    throw new ERRORS.InvalidPackageJson(
      `Expected package.json to be an object, got ${typeof json}`,
    );
  }
};

const validateName = (json: UnknownPackageJson) => {
  if (typeof json.name !== "string") {
    throw new ERRORS.NoWorkspaceName(
      `Expected package.json to have a string "name" field${
        json.name !== undefined ? ` (Received ${json.name})` : ""
      }`,
    );
  }

  return json.name;
};

const validateWorkspacePattern = (
  workspacePattern: string,
  rootDir: string,
) => {
  if (typeof workspacePattern !== "string") {
    throw new ERRORS.InvalidWorkspacePattern(
      `Expected workspace pattern to be a string, got ${typeof workspacePattern}`,
    );
  }

  if (!workspacePattern.trim()) {
    return false;
  }

  const absolutePattern = path.resolve(rootDir, workspacePattern);
  if (!absolutePattern.startsWith(rootDir)) {
    throw new ERRORS.InvalidWorkspacePattern(
      `Cannot resolve workspace pattern outside of root directory ${rootDir}: ${absolutePattern}`,
    );
  }

  return true;
};

const validateWorkspacePatterns = (
  json: UnknownPackageJson,
  rootDir: string,
) => {
  const workspaces: string[] = [];
  if (json.workspaces) {
    if (!Array.isArray(json.workspaces)) {
      throw new ERRORS.InvalidWorkspaces(
        `Expected package.json to have an array "workspaces" field`,
      );
    }

    for (const workspacePattern of json.workspaces) {
      if (validateWorkspacePattern(workspacePattern, rootDir)) {
        workspaces.push(workspacePattern);
      }
    }
  }

  return workspaces;
};

const validateScripts = (json: UnknownPackageJson) => {
  if (
    json.scripts &&
    (typeof json.scripts !== "object" || Array.isArray(json.scripts))
  ) {
    throw new ERRORS.InvalidScripts(
      `Expected package.json to have an object "scripts" field`,
    );
  }

  if (json.scripts) {
    for (const value of Object.values(json.scripts)) {
      if (typeof value !== "string") {
        throw new ERRORS.InvalidScripts(
          `Expected workspace "${json.name}" script "${
            json.scripts
          }" to be a string, got ${typeof value}`,
        );
      }
    }
  }

  return {
    ...(json.scripts as Record<string, string>),
  };
};

export const resolvePackageJsonContent = (
  packageJsonPath: string,
  rootDir: string,
  validations: ("workspaces" | "name" | "scripts")[],
): ResolvedPackageJsonContent => {
  rootDir = path.resolve(rootDir);

  let json: UnknownPackageJson = {};
  try {
    json = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  } catch (error) {
    logger.error(error);
    throw new ERRORS.InvalidPackageJson(
      `Failed to read and parse package.json at ${packageJsonPath}: ${
        (error as Error).message
      }`,
    );
  }

  validateJsonRoot(json);

  return {
    ...json,
    name: validations.includes("name")
      ? validateName(json)
      : ((json.name as string) ?? ""),
    workspaces: validations.includes("workspaces")
      ? validateWorkspacePatterns(json, rootDir)
      : ((json?.workspaces ?? []) as string[]),
    scripts: validations.includes("scripts")
      ? validateScripts(json)
      : ((json.scripts ?? {}) as Record<string, string>),
  };
};
