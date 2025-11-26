import fs from "fs";
import path from "path";
import { logger } from "../../internal/logger";
import type { Simplify } from "../../internal/types";
import { findWorkspaces, type Workspace } from "../../workspaces";
import { PROJECT_ERRORS } from "../errors";
import type { Project } from "../project";
import {
  runScript,
  runScripts,
  type RunScriptResult,
  type RunScriptsResult,
} from "../runScript";
import { ProjectBase, resolveWorkspacePath } from "./projectBase";

const interpolateWorkspace = (
  commandString: string | undefined,
  workspace: Workspace,
) => commandString?.replace(/<workspace>/g, workspace.name) ?? "";

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

/** Arguments for `FileSystemProject.runWorkspaceScript` */
export type RunWorkspaceScriptOptions = {
  /** The name of the workspace to run the script in */
  workspaceNameOrAlias: string;
  /** The name of the script to run, or an inline command when `inline` is true */
  script: string;
  /** Whether to run the script as an inline command */
  inline?: boolean;
  /** The arguments to append to the script command */
  args?: string;
};

/** Metadata associated with a workspace script */
export type RunWorkspaceScriptMetadata = {
  workspace: Workspace;
};

/** Result of `FileSystemProject.runWorkspaceScript` */
export type RunWorkspaceScriptResult = Simplify<
  RunScriptResult<RunWorkspaceScriptMetadata>
>;

/** Arguments for `FileSystemProject.runScriptAcrossWorkspaces` */
export type RunScriptAcrossWorkspacesOptions = {
  /** Workspace names, aliases, or patterns including a wildcard */
  workspacePatterns: string[];
  /** The name of the script to run, or an inline command when `inline` is true */
  script: string;
  /** Whether to run the script as an inline command */
  inline?: boolean;
  /** The arguments to append to the script command. `<workspace>` will be replaced with the workspace name */
  args?: string;
  /** Whether to run the scripts in parallel (series by default) */
  parallel?: boolean;
};

/** Result of `FileSystemProject.runScriptAcrossWorkspaces` */
export type RunScriptAcrossWorkspacesResult = Simplify<
  RunScriptsResult<RunWorkspaceScriptMetadata>
>;

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

  runWorkspaceScript(
    options: RunWorkspaceScriptOptions,
  ): RunWorkspaceScriptResult {
    const workspace = this.findWorkspaceByNameOrAlias(
      options.workspaceNameOrAlias,
    );

    if (!workspace) {
      throw new PROJECT_ERRORS.ProjectWorkspaceNotFound(
        `Workspace not found: ${JSON.stringify(options.workspaceNameOrAlias)}`,
      );
    }

    logger.debug(
      `Running script ${options.script} in workspace: ${workspace.name}`,
    );

    const args = interpolateWorkspace(options.args, workspace);

    const script = options.inline
      ? interpolateWorkspace(options.script, workspace) +
        (args ? " " + args : "")
      : options.script;

    const scriptCommand = options.inline
      ? {
          command: script,
          workingDirectory: resolveWorkspacePath(this, workspace),
        }
      : this.createScriptCommand({
          workspaceNameOrAlias: options.workspaceNameOrAlias,
          scriptName: script,
          args,
        }).commandDetails;

    return runScript({
      scriptCommand,
      metadata: {
        workspace,
      },
    });
  }

  runScriptAcrossWorkspaces(
    options: RunScriptAcrossWorkspacesOptions,
  ): RunScriptAcrossWorkspacesResult {
    const workspaces = options.workspacePatterns
      .flatMap((pattern) => this.findWorkspacesByPattern(pattern))
      .filter(
        (workspace) =>
          options.inline || workspace.scripts.includes(options.script),
      );

    logger.debug(
      `Running script ${options.script} across workspaces: ${workspaces.map((workspace) => workspace.name).join(", ")}`,
    );

    return runScripts({
      scripts: workspaces.map((workspace) => {
        const args = interpolateWorkspace(options.args, workspace);
        const script = options.inline
          ? interpolateWorkspace(options.script, workspace) +
            (args ? " " + args : "")
          : options.script;

        const scriptCommand = options.inline
          ? {
              command: script,
              workingDirectory: resolveWorkspacePath(this, workspace),
            }
          : this.createScriptCommand({
              workspaceNameOrAlias: workspace.name,
              scriptName: script,
              args,
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
export type FileSystemProject = Simplify<_FileSystemProject>;

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
