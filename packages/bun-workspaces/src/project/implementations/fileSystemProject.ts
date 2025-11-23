import fs from "fs";
import path from "path";
import { findWorkspaces, type Workspace } from "../../workspaces";
import { ERRORS } from "../errors";
import type { Project } from "../project";
import {
  runScript,
  runScripts,
  type RunScriptsCompleteExit,
  type RunScriptsScriptResult,
} from "../runScript";
import { ProjectBase } from "./projectBase";

/** Arguments for {@link createFileSystemProject} */
export type CreateFileSystemProjectOptions = {
  /** The directory containing the root package.json. Often the same root as a git repository. */
  rootDirectory: string;
  /**
   * The name of the project.
   *
   * By default will use the root package.json name
   */
  name?: string;
};

export type RunWorkspaceScriptOptions = {
  /** The name of the workspace to run the script in */
  workspaceNameOrAlias: string;
  /** The name of the script to run */
  scriptName: string;
  /** The arguments to append to the script command */
  args?: string;
};

export type WorkspaceScriptMetadata = {
  workspace: Workspace;
};

export type RunWorkspaceScriptsOptions = {
  workspacePatterns: string[];
  script: string;
  args?: string;
  parallel?: boolean;
};

export type RunWorkspaceScriptsScriptResult =
  RunScriptsScriptResult<WorkspaceScriptMetadata>;

export type RunWorkspaceScriptsResult = {
  scriptResults: AsyncIterable<RunWorkspaceScriptsScriptResult>;
  completeExit: Promise<RunScriptsCompleteExit<WorkspaceScriptMetadata>>;
};

class _FileSystemProject extends ProjectBase implements Project {
  public readonly rootDirectory: string;
  public readonly workspaces: Workspace[];
  public readonly name: string;
  public readonly sourceType = "fileSystem";
  constructor(
    options: CreateFileSystemProjectOptions & {
      /** @deprecated  */
      workspaceAliases?: Record<string, string>;
    },
  ) {
    super();

    this.rootDirectory = options.rootDirectory;

    const { workspaces } = findWorkspaces({
      rootDirectory: options.rootDirectory,
      workspaceAliases: options.workspaceAliases,
    });

    this.workspaces = workspaces;

    if (!options.name) {
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(this.rootDirectory, "package.json"), "utf8"),
      );
      this.name = packageJson.name ?? "";
    } else {
      this.name = "";
    }
  }

  runWorkspaceScript(options: RunWorkspaceScriptOptions) {
    const workspace = this.findWorkspaceByNameOrAlias(
      options.workspaceNameOrAlias,
    );

    if (!workspace) {
      throw new ERRORS.ProjectWorkspaceNotFound(
        `Workspace not found: ${JSON.stringify(options.workspaceNameOrAlias)}`,
      );
    }

    return runScript({
      scriptCommand: this.createScriptCommand({
        workspaceNameOrAlias: options.workspaceNameOrAlias,
        scriptName: options.scriptName,
        args: options.args,
      }).commandDetails,
      metadata: {
        workspace,
      },
    });
  }

  runWorkspaceScripts(
    options: RunWorkspaceScriptsOptions,
  ): RunWorkspaceScriptsResult {
    const workspaces = options.workspacePatterns.flatMap((pattern) =>
      this.findWorkspacesByPattern(pattern),
    );

    return runScripts({
      scripts: workspaces.map((workspace) => {
        const scriptCommand = this.createScriptCommand({
          workspaceNameOrAlias: workspace.name,
          scriptName: options.script,
          args: options.args,
        }).commandDetails;

        return {
          metadata: {
            workspace,
          },
          scriptCommand,
        };
      }),
      parallel: !!options.parallel,
    });
  }
}

/** An implementation of {@link Project} that is created from a root directory in the file system. */
export type FileSystemProject = Required<_FileSystemProject>;

/**
 * Create a {@link Project} based on a given root directory.
 * Automatically finds workspaces based on the root package.json "workspaces" field
 * and detects and utilizes any provided configuration.
 */
export const createFileSystemProject = (
  options: CreateFileSystemProjectOptions,
): FileSystemProject => new _FileSystemProject(options);

/** @deprecated temporarily supports workspaceAliases from deprecated config file */
export const _internalCreateFileSystemProject = (
  options: CreateFileSystemProjectOptions & {
    /** @deprecated  */
    workspaceAliases?: Record<string, string>;
  },
): FileSystemProject => new _FileSystemProject(options);
