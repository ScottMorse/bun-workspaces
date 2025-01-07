import path from "path";
import { createWildcardRegex } from "../internal/regex";
import { findWorkspacesFromPackage, type Workspace } from "../workspaces";
import { ERRORS } from "./errors";
import {
  createScriptCommand,
  type CreateScriptCommandOptions,
  type ScriptCommand,
} from "./scriptCommand";

export interface ScriptMetadata {
  name: string;
  workspaces: Workspace[];
}

export type CreateProjectScriptCommandOptions = Omit<
  CreateScriptCommandOptions,
  "workspace" | "rootDir"
> & {
  workspaceName: string;
};

export interface CreateProjectScriptCommandResult {
  command: ScriptCommand;
  scriptName: string;
  workspace: Workspace;
}

export interface Project {
  name: string;
  rootDir: string;
  workspaces: Workspace[];
  listWorkspacesWithScript(scriptName: string): Workspace[];
  listScriptsWithWorkspaces(): Record<string, ScriptMetadata>;
  findWorkspaceByName(workspaceName: string): Workspace | null;
  findWorkspacesByPattern(workspaceName: string): Workspace[];
  createScriptCommand(
    options: CreateProjectScriptCommandOptions,
  ): CreateProjectScriptCommandResult;
}

export interface CreateProjectOptions {
  rootDir: string;
}

class _Project implements Project {
  public readonly rootDir: string;
  public readonly workspaces: Workspace[];
  public readonly name: string;
  constructor(private options: CreateProjectOptions) {
    this.rootDir = options.rootDir;
    const { name, workspaces } = findWorkspacesFromPackage({
      rootDir: options.rootDir,
    });
    this.name = name;
    this.workspaces = workspaces;
  }

  listWorkspacesWithScript(scriptName: string): Workspace[] {
    return this.workspaces.filter(
      (workspace) => workspace.packageJson.scripts?.[scriptName],
    );
  }

  listScriptsWithWorkspaces(): Record<string, ScriptMetadata> {
    const scripts = new Set<string>();
    this.workspaces.forEach((workspace) => {
      Object.keys(workspace.packageJson.scripts ?? {}).forEach((script) =>
        scripts.add(script),
      );
    });
    return Array.from(scripts)
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({
        name,
        workspaces: this.listWorkspacesWithScript(name),
      }))
      .reduce(
        (acc, { name, workspaces }) => ({
          ...acc,
          [name]: { name, workspaces },
        }),
        {} as Record<string, ScriptMetadata>,
      );
  }

  findWorkspaceByName(workspaceName: string): Workspace | null {
    return (
      this.workspaces.find((workspace) => workspace.name === workspaceName) ??
      null
    );
  }

  /** Accepts wildcard for finding a list of workspaces */
  findWorkspacesByPattern(workspacePattern: string): Workspace[] {
    if (!workspacePattern) return [];
    const regex = createWildcardRegex(workspacePattern);
    return this.workspaces.filter((workspace) => regex.test(workspace.name));
  }

  createScriptCommand(
    options: CreateProjectScriptCommandOptions,
  ): CreateProjectScriptCommandResult {
    const workspace = this.findWorkspaceByName(options.workspaceName);
    if (!workspace) {
      throw new ERRORS.ProjectWorkspaceNotFound(
        `Workspace not found: ${JSON.stringify(options.workspaceName)}`,
      );
    }
    if (!workspace.packageJson.scripts?.[options.scriptName]) {
      throw new ERRORS.WorkspaceScriptDoesNotExist(
        `Script not found in workspace ${JSON.stringify(
          workspace.name,
        )}: ${JSON.stringify(options.scriptName)} (available: ${
          Object.keys(workspace.packageJson.scripts).join(", ") || "none"
        }`,
      );
    }
    return {
      workspace,
      scriptName: options.scriptName,
      command: createScriptCommand({
        ...options,
        workspace,
        rootDir: path.resolve(this.rootDir),
      }),
    };
  }
}

export const createProject = (options: CreateProjectOptions): Project =>
  new _Project(options);
