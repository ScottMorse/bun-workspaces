import fs from "fs";
import path from "path";
import type { ProjectConfig } from "../config";
import { ERRORS } from "./errors";
import {
  resolvePackageJsonContent,
  resolvePackageJsonPath,
  scanWorkspaceGlob,
} from "./packageJson";
import type { Workspace } from "./workspace";

export interface FindWorkspacesOptions {
  rootDir: string;
  workspaceGlobs: string[];
  workspaceAliases?: ProjectConfig["workspaceAliases"];
}

const validateWorkspace = (workspace: Workspace, workspaces: Workspace[]) => {
  if (workspaces.find((ws) => ws.path === workspace.path)) {
    return false;
  }

  if (workspaces.find((ws) => ws.name === workspace.name)) {
    throw new ERRORS.DuplicateWorkspaceName(
      `Duplicate workspace name found: ${JSON.stringify(workspace.name)}`,
    );
  }

  return true;
};

export const findWorkspaces = ({
  rootDir,
  workspaceGlobs,
  workspaceAliases,
}: FindWorkspacesOptions) => {
  rootDir = path.resolve(rootDir);

  const workspaces: Workspace[] = [];
  const excludedWorkspacePaths: string[] = [];

  const negativePatterns = workspaceGlobs
    .filter((pattern) => pattern.startsWith("!"))
    .concat(["!**/node_modules/**/*"]);

  const positivePatterns = workspaceGlobs.filter(
    (pattern) => !pattern.startsWith("!"),
  );

  for (const pattern of negativePatterns) {
    for (const item of scanWorkspaceGlob(pattern.replace(/^!/, ""), rootDir)) {
      const packageJsonPath = resolvePackageJsonPath(item);
      if (packageJsonPath) {
        excludedWorkspacePaths.push(
          path.relative(rootDir, path.dirname(packageJsonPath)),
        );
      }
    }
  }

  for (const pattern of positivePatterns) {
    for (const item of scanWorkspaceGlob(pattern.replace(/^!/, ""), rootDir)) {
      const packageJsonPath = resolvePackageJsonPath(item);
      if (packageJsonPath) {
        const packageJsonContent = resolvePackageJsonContent(
          packageJsonPath,
          rootDir,
          ["name", "scripts"],
        );

        const workspace: Workspace = {
          name: packageJsonContent.name ?? "",
          matchPattern: pattern,
          path: path.relative(rootDir, path.dirname(packageJsonPath)),
          scripts: Object.keys(packageJsonContent.scripts ?? {}).sort(),
          aliases: Object.entries(workspaceAliases ?? {})
            .filter(([_, value]) => value === packageJsonContent.name)
            .map(([key]) => key),
        };
        if (
          !excludedWorkspacePaths.includes(workspace.path) &&
          validateWorkspace(workspace, workspaces)
        ) {
          workspaces.push(workspace);
        }
      }
    }
  }

  workspaces.sort(
    (a, b) => a.name.localeCompare(b.name) || a.path.localeCompare(b.path),
  );

  return { workspaces };
};

export const validateWorkspaceAliases = (
  workspaces: Workspace[],
  workspaceAliases: ProjectConfig["workspaceAliases"],
) => {
  for (const [alias, name] of Object.entries(workspaceAliases ?? {})) {
    if (workspaces.find((ws) => ws.name === alias)) {
      throw new ERRORS.AliasConflict(
        `Alias ${JSON.stringify(alias)} conflicts with workspace name ${JSON.stringify(name)}`,
      );
    }
    if (!workspaces.find((ws) => ws.name === name)) {
      throw new ERRORS.AliasedWorkspaceNotFound(
        `Workspace ${JSON.stringify(name)} was aliased by ${JSON.stringify(
          alias,
        )} but was not found`,
      );
    }
  }
};

export const findWorkspacesFromPackage = ({
  rootDir,
  workspaceAliases,
}: ProjectConfig & { rootDir: string }) => {
  const packageJsonPath = path.join(rootDir, "package.json");
  if (!fs.existsSync(packageJsonPath)) {
    throw new ERRORS.PackageNotFound(
      `No package.json found at ${packageJsonPath}`,
    );
  }

  const packageJson = resolvePackageJsonContent(packageJsonPath, rootDir, [
    "workspaces",
  ]);

  const result = findWorkspaces({
    rootDir,
    workspaceGlobs: packageJson.workspaces ?? [],
    workspaceAliases,
  });

  validateWorkspaceAliases(result.workspaces, workspaceAliases);

  return {
    ...result,
    name: packageJson.name ?? "",
  };
};
