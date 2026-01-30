import fs from "fs";
import path from "path";
import { isJSONObject } from "../internal/core";
import { logger } from "../internal/logger";
import { WORKSPACE_ERRORS } from "./errors";

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
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  peerDependencies: Record<string, string>;
  optionalDependencies: Record<string, string>;
} & Record<string, unknown>;

type UnknownPackageJson = Record<string, unknown>;

const validateJsonRoot = (json: UnknownPackageJson) => {
  if (!json || typeof json !== "object" || Array.isArray(json)) {
    throw new WORKSPACE_ERRORS.InvalidPackageJson(
      `Expected package.json to be an object, got ${typeof json}`,
    );
  }
};

const validateName = (json: UnknownPackageJson) => {
  if (typeof json.name !== "string") {
    throw new WORKSPACE_ERRORS.NoWorkspaceName(
      `Expected package.json to have a string "name" field${
        json.name !== undefined ? ` (Received ${json.name})` : ""
      }`,
    );
  }

  if (!json.name.trim()) {
    throw new WORKSPACE_ERRORS.NoWorkspaceName(
      `Expected package.json to have a non-empty "name" field`,
    );
  }

  if (json.name.includes("*")) {
    throw new WORKSPACE_ERRORS.InvalidWorkspaceName(
      `Package name cannot contain the character '*' (workspace: "${json.name}")`,
    );
  }

  return json.name;
};

const validateWorkspacePattern = (
  workspacePattern: string,
  rootDirectory: string,
) => {
  if (typeof workspacePattern !== "string") {
    throw new WORKSPACE_ERRORS.InvalidWorkspacePattern(
      `Expected workspace pattern to be a string, got ${typeof workspacePattern}`,
    );
  }

  if (!workspacePattern.trim()) {
    return false;
  }

  const absolutePattern = path.resolve(rootDirectory, workspacePattern);
  if (!absolutePattern.startsWith(rootDirectory)) {
    throw new WORKSPACE_ERRORS.InvalidWorkspacePattern(
      `Cannot resolve workspace pattern outside of root directory ${rootDirectory}: ${absolutePattern}`,
    );
  }

  return true;
};

const validateWorkspacePatterns = (
  json: UnknownPackageJson,
  rootDirectory: string,
) => {
  const workspaces: string[] = [];
  if (json.workspaces) {
    let source: "array" | "catalogObject" = "array";
    let rawWorkspaces: string[] = [];
    if (isJSONObject(json.workspaces)) {
      source = "catalogObject";
      rawWorkspaces = json.workspaces?.packages as string[];
    } else {
      source = "array";
      rawWorkspaces = json.workspaces as string[];
    }

    if (!Array.isArray(rawWorkspaces)) {
      throw new WORKSPACE_ERRORS.InvalidWorkspaces(
        `Expected package.json "workspaces${source === "catalogObject" ? ".packages" : ""}" to be an array`,
      );
    }

    for (const workspacePattern of rawWorkspaces) {
      if (validateWorkspacePattern(workspacePattern, rootDirectory)) {
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
    throw new WORKSPACE_ERRORS.InvalidScripts(
      `Expected package.json to have an object "scripts" field`,
    );
  }

  if (json.scripts) {
    for (const value of Object.values(json.scripts)) {
      if (typeof value !== "string") {
        throw new WORKSPACE_ERRORS.InvalidScripts(
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
  rootDirectory: string,
  validations: ("workspaces" | "name" | "scripts")[],
): ResolvedPackageJsonContent => {
  rootDirectory = path.resolve(rootDirectory);

  let json: UnknownPackageJson = {};
  try {
    json = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  } catch (error) {
    logger.error(error as Error);
    throw new WORKSPACE_ERRORS.InvalidPackageJson(
      `Failed to read and parse package.json at ${packageJsonPath}: ${
        (error as Error).message
      }`,
    );
  }

  validateJsonRoot(json);

  return {
    ...json,
    // Dependency data types are validated by bun install
    // TODO investigate whether we need to validate any of these fields in the first place
    dependencies: (json.dependencies as Record<string, string>) ?? {},
    devDependencies: (json.devDependencies as Record<string, string>) ?? {},
    peerDependencies: (json.peerDependencies as Record<string, string>) ?? {},
    optionalDependencies:
      (json.optionalDependencies as Record<string, string>) ?? {},
    name: validations.includes("name")
      ? validateName(json)
      : ((json.name as string) ?? ""),
    workspaces: validations.includes("workspaces")
      ? validateWorkspacePatterns(json, rootDirectory)
      : ((json?.workspaces ?? []) as string[]),
    scripts: validations.includes("scripts")
      ? validateScripts(json)
      : ((json.scripts ?? {}) as Record<string, string>),
  };
};
