import fs from "fs";
import path from "path";
import {
  createWorkspaceConfig,
  loadWorkspaceConfig,
  type ProjectConfig,
  type ResolvedWorkspaceConfig,
} from "../config";
import { WORKSPACE_ERRORS } from "./errors";
import {
  resolvePackageJsonContent,
  resolvePackageJsonPath,
  scanWorkspaceGlob,
} from "./packageJson";
import type { Workspace } from "./workspace";

export interface FindWorkspacesOptions {
  rootDirectory: string;
  /** If provided, will override the workspaces found in the package.json */
  workspaceGlobs?: string[];
  /** @deprecated due to config file changes */
  workspaceAliases?: ProjectConfig["workspaceAliases"];
}

const getWorkspaceGlobsFromRoot = ({
  rootDirectory,
}: {
  rootDirectory: string;
}) => {
  const packageJsonPath = path.join(rootDirectory, "package.json");
  if (!fs.existsSync(packageJsonPath)) {
    throw new WORKSPACE_ERRORS.PackageNotFound(
      `No package.json found at ${packageJsonPath}`,
    );
  }

  const packageJson = resolvePackageJsonContent(
    packageJsonPath,
    rootDirectory,
    ["workspaces"],
  );

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
  rootDirectory,
  workspaceGlobs: _workspaceGlobs,
  workspaceAliases = {},
}: FindWorkspacesOptions) => {
  rootDirectory = path.resolve(rootDirectory);

  const workspaces: Workspace[] = [];
  const excludedWorkspacePaths: string[] = [];

  const workspaceGlobs =
    _workspaceGlobs ?? getWorkspaceGlobsFromRoot({ rootDirectory });

  const negativePatterns = workspaceGlobs
    .filter((pattern) => pattern.startsWith("!"))
    .concat(["!**/node_modules/**/*"]);

  const positivePatterns = workspaceGlobs.filter(
    (pattern) => !pattern.startsWith("!"),
  );

  for (const pattern of negativePatterns) {
    for (const item of scanWorkspaceGlob(
      pattern.replace(/^!/, ""),
      rootDirectory,
    )) {
      const packageJsonPath = resolvePackageJsonPath(item);
      if (packageJsonPath) {
        excludedWorkspacePaths.push(
          path.relative(rootDirectory, path.dirname(packageJsonPath)),
        );
      }
    }
  }

  const workspaceConfigMap: Record<string, ResolvedWorkspaceConfig> = {};

  for (const pattern of positivePatterns) {
    for (const item of scanWorkspaceGlob(
      pattern.replace(/^!/, ""),
      rootDirectory,
    )) {
      const packageJsonPath = resolvePackageJsonPath(item);
      if (packageJsonPath) {
        const packageJsonContent = resolvePackageJsonContent(
          packageJsonPath,
          rootDirectory,
          ["name", "scripts"],
        );

        const workspaceConfig = loadWorkspaceConfig(
          path.dirname(packageJsonPath),
        );

        if (workspaceConfig) {
          for (const alias of workspaceConfig.aliases) {
            workspaceAliases[alias] = packageJsonContent.name;
          }
        }

        const workspace: Workspace = {
          name: packageJsonContent.name ?? "",
          matchPattern: pattern,
          path: path.relative(rootDirectory, path.dirname(packageJsonPath)),
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
          workspaceConfigMap[workspace.name] =
            workspaceConfig ?? createWorkspaceConfig();
        }
      }
    }
  }

  workspaces.sort(
    (a, b) => a.name.localeCompare(b.name) || a.path.localeCompare(b.path),
  );

  validateWorkspaceAliases(workspaces, workspaceAliases);

  return { workspaces, workspaceConfigMap };
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
    const workspaceWithDuplicateAlias = workspaces.find(
      (ws) => ws.name !== name && ws.aliases.includes(alias),
    );
    if (workspaceWithDuplicateAlias) {
      throw new WORKSPACE_ERRORS.AliasConflict(
        `Workspaces ${JSON.stringify(name)} and ${JSON.stringify(workspaceWithDuplicateAlias.name)} have the same alias ${JSON.stringify(alias)}`,
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
