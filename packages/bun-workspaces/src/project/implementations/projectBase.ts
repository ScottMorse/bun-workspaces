import path from "path";
import { createWildcardRegex } from "../../internal/regex";
import { type Workspace } from "../../workspaces";
import { ERRORS } from "../errors";
import type {
  CreateProjectScriptCommandOptions,
  CreateProjectScriptCommandResult,
  Project,
  ScriptMetadata,
} from "../project";
import { createWorkspaceScriptCommand } from "../runScript";

export abstract class ProjectBase implements Project {
  public abstract readonly name: string;
  public abstract readonly rootDirectory: string;
  public abstract readonly workspaces: Workspace[];
  public abstract readonly sourceType: "fileSystem" | "memory";

  listWorkspacesWithScript(scriptName: string): Workspace[] {
    return this.workspaces.filter((workspace) =>
      workspace.scripts.includes(scriptName),
    );
  }

  mapScriptsToWorkspaces(): Record<string, ScriptMetadata> {
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
      commandDetails: createWorkspaceScriptCommand({
        ...options,
        workspace,
        rootDirectory: path.resolve(this.rootDirectory),
        method: options.method,
        args: options.args ?? "",
      }),
    };
  }
}
