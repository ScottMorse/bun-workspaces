import path from "path";
import { createWildcardRegex } from "../../internal/regex";
import { type Workspace } from "../../workspaces";
import { ERRORS } from "../errors";
import {
  createScriptCommand,
  type CreateScriptCommandOptions,
  type ScriptCommand,
} from "../scriptCommand";

export interface ScriptMetadata {
  name: string;
  workspaces: Workspace[];
}

export type CreateProjectScriptCommandOptions = Omit<
  CreateScriptCommandOptions,
  "workspace" | "rootDir"
> & {
  workspaceNameOrAlias: string;
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
  findWorkspaceByAlias(alias: string): Workspace | null;
  findWorkspaceByNameOrAlias(nameOrAlias: string): Workspace | null;
  findWorkspacesByPattern(workspaceName: string): Workspace[];
  createScriptCommand(
    options: CreateProjectScriptCommandOptions,
  ): CreateProjectScriptCommandResult;
}

export abstract class ProjectBase implements Project {
  public abstract readonly name: string;
  public abstract readonly rootDir: string;
  public abstract readonly workspaces: Workspace[];

  listWorkspacesWithScript(scriptName: string): Workspace[] {
    return this.workspaces.filter((workspace) =>
      workspace.scripts.includes(scriptName),
    );
  }

  listScriptsWithWorkspaces(): Record<string, ScriptMetadata> {
    const scripts = new Set<string>();
    this.workspaces.forEach((workspace) => {
      workspace.scripts.forEach((script) => scripts.add(script));
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

  findWorkspaceByAlias(alias: string): Workspace | null {
    return (
      this.workspaces.find((workspace) => workspace.aliases.includes(alias)) ??
      null
    );
  }

  findWorkspaceByNameOrAlias(nameOrAlias: string): Workspace | null {
    return (
      this.findWorkspaceByName(nameOrAlias) ||
      this.findWorkspaceByAlias(nameOrAlias)
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
    const workspace = this.findWorkspaceByNameOrAlias(
      options.workspaceNameOrAlias,
    );

    if (!workspace) {
      throw new ERRORS.ProjectWorkspaceNotFound(
        `Workspace not found: ${JSON.stringify(options.workspaceNameOrAlias)}`,
      );
    }
    if (!workspace.scripts.includes(options.scriptName)) {
      throw new ERRORS.WorkspaceScriptDoesNotExist(
        `Script not found in workspace ${JSON.stringify(
          workspace.name,
        )}: ${JSON.stringify(options.scriptName)} (available: ${
          workspace.scripts.join(", ") || "none"
        })`,
      );
    }
    return {
      workspace,
      scriptName: options.scriptName,
      command: createScriptCommand({
        ...options,
        workspace,
        rootDir: path.resolve(this.rootDir),
        method: options.method,
      }),
    };
  }
}
