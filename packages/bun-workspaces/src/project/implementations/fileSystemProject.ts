import fs from "fs";
import path from "path";
import { type ResolvedWorkspaceConfig } from "../../config";
import type { Simplify } from "../../internal/core";
import { logger } from "../../internal/logger";
import {
  runScript,
  runScripts,
  createScriptRuntimeEnvVars,
  interpolateScriptRuntimeMetadata,
  type RunScriptResult,
  type RunScriptsResult,
  type RunScriptsParallelOptions,
  type ScriptRuntimeMetadata,
} from "../../runScript";
import type { ScriptShellOption } from "../../runScript/scriptExecution";
import { findWorkspaces, type Workspace } from "../../workspaces";
import { PROJECT_ERRORS } from "../errors";
import type { Project } from "../project";
import { ProjectBase, resolveWorkspacePath } from "./projectBase";

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

export interface InlineScriptOptions {
  /** A name to act as a label for the inline script */
  scriptName: string;
}

/** Arguments for `FileSystemProject.runWorkspaceScript` */
export type RunWorkspaceScriptOptions = {
  /** The name of the workspace to run the script in */
  workspaceNameOrAlias: string;
  /** The name of the script to run, or an inline command when `inline` is true */
  script: string;
  /** Whether to run the script as an inline command */
  inline?: boolean | InlineScriptOptions;
  /** The arguments to append to the script command */
  args?: string;
  /** Whether to use the Bun Shell or the OS shell (e.g. sh or cmd). Defaults to "bun" */
  shell?: ScriptShellOption;
};

/** Metadata associated with a workspace script */
export type RunWorkspaceScriptMetadata = {
  workspace: Workspace;
};

/** Result of `FileSystemProject.runWorkspaceScript` */
export type RunWorkspaceScriptResult = Simplify<
  RunScriptResult<RunWorkspaceScriptMetadata>
>;

export type ParallelOption = boolean | RunScriptsParallelOptions;

/** Arguments for `FileSystemProject.runScriptAcrossWorkspaces` */
export type RunScriptAcrossWorkspacesOptions = {
  /** Workspace names, aliases, or patterns including a wildcard */
  workspacePatterns: string[];
  /** The name of the script to run, or an inline command when `inline` is true */
  script: string;
  /** Whether to run the script as an inline command */
  inline?: boolean | InlineScriptOptions;
  /** The arguments to append to the script command. `<workspaceName>` will be replaced with the workspace name */
  args?: string;
  /** Whether to run the scripts in parallel (series by default) */
  parallel?: ParallelOption;
  /** Whether to use the Bun Shell or the OS shell (e.g. sh or cmd). Defaults to "bun" */
  shell?: ScriptShellOption;
};

/** Result of `FileSystemProject.runScriptAcrossWorkspaces` */
export type RunScriptAcrossWorkspacesResult = Simplify<
  RunScriptsResult<RunWorkspaceScriptMetadata>
>;

const INSTANCE_PRIVATE_MAP = new WeakMap<
  FileSystemProject,
  { workspaceConfigMap: Record<string, ResolvedWorkspaceConfig> }
>();

const getInstancePrivateMap = (project: FileSystemProject) => {
  let instancePrivateMap = INSTANCE_PRIVATE_MAP.get(project);
  if (!instancePrivateMap) {
    instancePrivateMap = { workspaceConfigMap: {} };
    INSTANCE_PRIVATE_MAP.set(project, instancePrivateMap);
  }
  return instancePrivateMap;
};

const setInstancePrivateMap = (
  project: FileSystemProject,
  instancePrivateMap: {
    workspaceConfigMap: Record<string, ResolvedWorkspaceConfig>;
  },
) => {
  INSTANCE_PRIVATE_MAP.set(project, instancePrivateMap);
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

    this.rootDirectory = path.resolve(options.rootDirectory);

    const { workspaces, workspaceConfigMap } = findWorkspaces({
      rootDirectory: options.rootDirectory,
      workspaceAliases: options.workspaceAliases,
    });

    this.workspaces = workspaces;
    setInstancePrivateMap(this, { workspaceConfigMap });

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

    const inlineScriptName =
      typeof options.inline === "object"
        ? (options.inline?.scriptName ?? "")
        : "";

    const scriptRuntimeMetadata: ScriptRuntimeMetadata = {
      projectPath: this.rootDirectory,
      projectName: this.name,
      workspacePath: resolveWorkspacePath(this, workspace),
      workspaceRelativePath: workspace.path,
      workspaceName: workspace.name,
      scriptName: options.inline ? inlineScriptName : options.script,
    };

    const args = interpolateScriptRuntimeMetadata(
      options.args ?? "",
      scriptRuntimeMetadata,
    );

    const script = options.inline
      ? interpolateScriptRuntimeMetadata(
          options.script,
          scriptRuntimeMetadata,
        ) + (args ? " " + args : "")
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

    const shell = options.shell || "bun";

    const result = runScript({
      scriptCommand,
      metadata: {
        workspace,
      },
      env: createScriptRuntimeEnvVars(scriptRuntimeMetadata),
      shell: options.shell || "bun",
    });

    if (shell === "bun" && !options.shell) {
      /** @deprecated remove once Bun shell has been default for some time */
      result.exit.then((exit) => {
        if (exit.exitCode === 127) {
          logger.warn(
            `The default shell used to execute scripts was recently changed to the Bun shell. This is a temporary warning due to a script exiting with 127 (command not found). You may need to set the --shell option to "os" to use the system shell or update the script to use the Bun shell.`,
          );
        }
      });
    }

    return result;
  }

  runScriptAcrossWorkspaces(
    options: RunScriptAcrossWorkspacesOptions,
  ): RunScriptAcrossWorkspacesResult {
    const workspaces = options.workspacePatterns
      .flatMap((pattern) => this.findWorkspacesByPattern(pattern))
      .filter(
        (workspace) =>
          options.inline || workspace.scripts.includes(options.script),
      )
      .sort((a, b) => {
        const aScriptConfig =
          getInstancePrivateMap(this).workspaceConfigMap[a.name]?.scripts[
            options.script
          ];

        const bScriptConfig =
          getInstancePrivateMap(this).workspaceConfigMap[b.name]?.scripts[
            options.script
          ];

        if (!aScriptConfig) {
          return bScriptConfig ? 1 : 0;
        }

        if (!bScriptConfig) {
          return aScriptConfig ? -1 : 0;
        }

        return (aScriptConfig.order ?? 0) - (bScriptConfig.order ?? 0);
      });

    logger.debug(
      `Running script ${options.script} across workspaces: ${workspaces.map((workspace) => workspace.name).join(", ")}`,
    );

    const shell = options.shell || "bun";

    const result = runScripts({
      scripts: workspaces.map((workspace) => {
        const inlineScriptName =
          typeof options.inline === "object"
            ? (options.inline?.scriptName ?? "")
            : "";

        const scriptRuntimeMetadata: ScriptRuntimeMetadata = {
          projectPath: this.rootDirectory,
          projectName: this.name,
          workspacePath: resolveWorkspacePath(this, workspace),
          workspaceRelativePath: workspace.path,
          workspaceName: workspace.name,
          scriptName: options.inline ? inlineScriptName : options.script,
        };

        const args = interpolateScriptRuntimeMetadata(
          options.args ?? "",
          scriptRuntimeMetadata,
        );

        const script = options.inline
          ? interpolateScriptRuntimeMetadata(
              options.script,
              scriptRuntimeMetadata,
            ) + (args ? " " + args : "")
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
          env: createScriptRuntimeEnvVars(scriptRuntimeMetadata),
          shell,
        };
      }),
      parallel: options.parallel ?? false,
    });

    if (shell === "bun" && !options.shell) {
      /** @deprecated remove once Bun shell has been default for some time */
      result.summary.then((summary) => {
        if (summary.scriptResults.some((result) => result.exitCode === 127)) {
          logger.warn(
            `The default shell used to execute scripts was recently changed to the Bun shell. This is a temporary warning due to a script exiting with 127 (command not found). You may need to set the --shell option to "os" to use the system shell or update the script to use the Bun shell.`,
          );
        }
      });
    }

    return result;
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
