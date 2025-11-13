import fs from "fs";
import path from "path";
import { loadWorkspaceConfig, type ProjectConfig } from "../config";
import { WORKSPACE_ERRORS } from "./errors";
import {
  resolvePackageJsonContent,
  resolvePackageJsonPath,
  scanWorkspaceGlob,
} from "./packageJson";
import type { Workspace } from "./workspace";

export interface FindWorkspacesOptions {
  rootDir: string;
  /** If provided, will override the workspaces found in the package.json */
  workspaceGlobs?: string[];
  /** @deprecated due to config file changes */
  workspaceAliases?: ProjectConfig["workspaceAliases"];
}

const getWorkspaceGlobsFromRoot = ({ rootDir }: { rootDir: string }) => {
  const packageJsonPath = path.join(rootDir, "package.json");
  if (!fs.existsSync(packageJsonPath)) {
    throw new WORKSPACE_ERRORS.PackageNotFound(
      `No package.json found at ${packageJsonPath}`,
    );
  }

  const packageJson = resolvePackageJsonContent(packageJsonPath, rootDir, [
    "workspaces",
  ]);

  return packageJson.workspaces ?? [];
};

const validateWorkspace = (workspace: Workspace, workspaces: Workspace[]) => {
  if (workspaces.find((ws) => ws.path === workspace.path)) {
    return false;
  }

  if (workspaces.find((ws) => ws.name === workspace.name)) {
    throw new WORKSPACE_ERRORS.DuplicateWorkspaceName(
      `Duplicate workspace name found: ${JSON.stringify(workspace.name)}`,
    );
  }

  return true;
};

export const findWorkspaces = ({
  rootDir,
  workspaceGlobs: _workspaceGlobs,
  workspaceAliases,
}: FindWorkspacesOptions) => {
  rootDir = path.resolve(rootDir);

  const workspaces: Workspace[] = [];
  const excludedWorkspacePaths: string[] = [];

  const workspaceGlobs =
    _workspaceGlobs ?? getWorkspaceGlobsFromRoot({ rootDir });

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

        const workspaceConfig = loadWorkspaceConfig(
          path.dirname(packageJsonPath),
        );

        const workspace: Workspace = {
          name: packageJsonContent.name ?? "",
          matchPattern: pattern,
          path: path.relative(rootDir, path.dirname(packageJsonPath)),
          scripts: Object.keys(packageJsonContent.scripts ?? {}).sort(),
          aliases: [
            ...new Set(
              Object.entries(workspaceAliases ?? {})
                .filter(([_, value]) => value === packageJsonContent.name)
                .map(([key]) => key)
                .concat(workspaceConfig?.aliases ?? []),
            ),
          ],
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

  validateWorkspaceAliases(workspaces, workspaceAliases);

  return { workspaces };
};

export const validateWorkspaceAliases = (
  workspaces: Workspace[],
  workspaceAliases: ProjectConfig["workspaceAliases"],
) => {
  for (const [alias, name] of Object.entries(workspaceAliases ?? {})) {
    if (workspaces.find((ws) => ws.name === alias)) {
      throw new WORKSPACE_ERRORS.AliasConflict(
        `Alias ${JSON.stringify(alias)} conflicts with workspace name ${JSON.stringify(name)}`,
      );
    }
    if (!workspaces.find((ws) => ws.name === name)) {
      throw new WORKSPACE_ERRORS.AliasedWorkspaceNotFound(
        `Workspace ${JSON.stringify(name)} was aliased by ${JSON.stringify(
          alias,
        )} but was not found`,
      );
    }
  }
};
