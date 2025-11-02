import { type Command } from "commander";
import { BunWorkspacesError } from "../../internal/error";
import { logger, createLogger } from "../../internal/logger";
import type { Project } from "../../project";
import type { Workspace } from "../../workspaces";
import {
  getProjectCommandConfig,
  type CliProjectCommandName,
} from "./projectCommandsConfig";

/** @todo DRY use of output text in cases such as having no workspaces/scripts */

export interface ProjectCommandContext {
  project: Project;
  program: Command;
}

const createWorkspaceInfoLines = (workspace: Workspace) => [
  `Workspace: ${workspace.name}`,
  ` - Aliases: ${workspace.aliases.join(", ")}`,
  ` - Path: ${workspace.path}`,
  ` - Glob Match: ${workspace.matchPattern}`,
  ` - Scripts: ${workspace.scripts.join(", ")}`,
];

const createScriptInfoLines = (script: string, workspaces: Workspace[]) => [
  `Script: ${script}`,
  ...workspaces.map((workspace) => ` - ${workspace.name}`),
];

const createJsonLines = (data: unknown, options: { pretty: boolean }) =>
  JSON.stringify(data, null, options.pretty ? 2 : undefined).split("\n");

export const commandOutputLogger = createLogger("");
commandOutputLogger.printLevel = "info";

const handleCommand = <T extends unknown[]>(
  commandName: CliProjectCommandName,
  handler: (context: ProjectCommandContext, ...actionArgs: T) => void,
) => {
  const config = getProjectCommandConfig(commandName);
  return ({ program, project }: ProjectCommandContext) => {
    program = program
      .command(config.command)
      .aliases(config.aliases)
      .description(config.description);
    for (const option of Object.values(config.options)) {
      program.option(option.flags, option.description);
    }
    program = program.action((...actionArgs) =>
      handler({ program, project }, ...(actionArgs as T)),
    );
    return program;
  };
};

const listWorkspaces = handleCommand(
  "listWorkspaces",
  (
    { project },
    pattern: string | undefined,
    options: { nameOnly: boolean; json: boolean; pretty: boolean },
  ) => {
    logger.debug(
      `Command: List workspaces (options: ${JSON.stringify(options)})`,
    );

    const lines: string[] = [];

    const workspaces = pattern
      ? project.findWorkspacesByPattern(pattern)
      : project.workspaces;

    if (options.json) {
      lines.push(
        ...createJsonLines(
          options.nameOnly ? workspaces.map(({ name }) => name) : workspaces,
          options,
        ),
      );
    } else {
      workspaces.forEach((workspace) => {
        if (options.nameOnly) {
          lines.push(workspace.name);
        } else {
          lines.push(...createWorkspaceInfoLines(workspace));
        }
      });
    }

    if (!lines.length && !options.nameOnly) {
      logger.info("No workspaces found");
    }

    if (lines.length) commandOutputLogger.info(lines.join("\n"));
  },
);

const listScripts = handleCommand(
  "listScripts",
  (
    { project },
    options: { nameOnly: boolean; json: boolean; pretty: boolean },
  ) => {
    logger.debug(`Command: List scripts (options: ${JSON.stringify(options)})`);

    const scripts = project.listScriptsWithWorkspaces();
    const lines: string[] = [];

    if (!project.workspaces.length && !options.nameOnly) {
      logger.info("No workspaces found");
      return;
    }

    if (!Object.keys(scripts).length && !options.nameOnly) {
      logger.info("No scripts found");
      return;
    }

    if (options.json) {
      lines.push(
        ...createJsonLines(
          options.nameOnly
            ? Object.keys(scripts)
            : Object.values(scripts).map(({ workspaces, ...rest }) => ({
                ...rest,
                workspaces: workspaces.map(({ name }) => name),
              })),
          options,
        ),
      );
    } else {
      Object.values(scripts)
        .sort(({ name: nameA }, { name: nameB }) => nameA.localeCompare(nameB))
        .forEach(({ name, workspaces }) => {
          if (options.nameOnly) {
            lines.push(name);
          } else {
            lines.push(...createScriptInfoLines(name, workspaces));
          }
        });
    }

    if (lines.length) commandOutputLogger.info(lines.join("\n"));
  },
);

const workspaceInfo = handleCommand(
  "workspaceInfo",
  (
    { project },
    workspaceName: string,
    options: { json: boolean; pretty: boolean },
  ) => {
    logger.debug(
      `Command: Workspace info for ${workspaceName} (options: ${JSON.stringify(options)})`,
    );

    const workspace = project.findWorkspaceByNameOrAlias(workspaceName);
    if (!workspace) {
      logger.error(
        `Workspace ${JSON.stringify(workspaceName)} not found (use command ${getProjectCommandConfig("listWorkspaces").command.split(/\s+/g)[0]} to list available workspaces)`,
      );
      process.exit(1);
    }

    commandOutputLogger.info(
      (options.json
        ? createJsonLines(workspace, options)
        : createWorkspaceInfoLines(workspace)
      ).join("\n"),
    );
  },
);

const scriptInfo = handleCommand(
  "scriptInfo",
  (
    { project },
    script: string,
    options: { workspacesOnly: boolean; json: boolean; pretty: boolean },
  ) => {
    logger.debug(
      `Command: Script info for ${script} (options: ${JSON.stringify(options)})`,
    );

    const scripts = project.listScriptsWithWorkspaces();
    const scriptMetadata = scripts[script];
    if (!scriptMetadata) {
      logger.error(
        `Script not found: ${JSON.stringify(
          script,
        )} (use command ${getProjectCommandConfig("listScripts").command.split(/\s+/g)[0]} to list available scripts)`,
      );
      process.exit(1);
    }
    commandOutputLogger.info(
      (options.json
        ? createJsonLines(
            options.workspacesOnly
              ? scriptMetadata.workspaces.map(({ name }) => name)
              : {
                  name: scriptMetadata.name,
                  workspaces: scriptMetadata.workspaces.map(({ name }) => name),
                },
            options,
          )
        : options.workspacesOnly
          ? scriptMetadata.workspaces.map(({ name }) => name)
          : createScriptInfoLines(script, scriptMetadata.workspaces)
      ).join("\n"),
    );
  },
);

const runScript = handleCommand(
  "runScript",
  async (
    { project },
    script: string,
    _workspaces: string[],
    options: { parallel: boolean; args: string; noPrefix: boolean },
  ) => {
    logger.debug(
      `Command: Run script ${JSON.stringify(script)} for ${
        _workspaces.length
          ? "workspaces " + _workspaces.join(", ")
          : "all workspaces"
      } (parallel: ${!!options.parallel}, args: ${JSON.stringify(options.args)})`,
    );

    const workspaces = _workspaces.length
      ? _workspaces
          .flatMap((workspacePattern) => {
            if (workspacePattern.includes("*")) {
              return project
                .findWorkspacesByPattern(workspacePattern)
                .filter(({ scripts }) => scripts.includes(script))
                .map(({ name }) => name);
            }
            return [workspacePattern];
          })
          .filter((workspace) =>
            project.workspaces.some(({ name }) => name === workspace),
          )
      : project.listWorkspacesWithScript(script).map(({ name }) => name);

    if (!workspaces.length) {
      if (_workspaces.length === 1 && !_workspaces[0].includes("*")) {
        const message = `Workspace not found: ${JSON.stringify(_workspaces[0])}`;
        logger.error(message);
        throw new Error(message);
      }

      const message = `No ${_workspaces.length ? "matching " : ""}workspaces found for script ${JSON.stringify(script)}`;
      logger.error(message);
      throw new Error(message);
    }

    const scriptCommands = workspaces.map((workspaceName) =>
      project.createScriptCommand({
        scriptName: script,
        workspaceName,
        method: "cd",
        args: options.args?.replace(/<workspace>/g, workspaceName) ?? "",
      }),
    );

    const runCommand = async ({
      command,
      scriptName,
      workspace,
    }: (typeof scriptCommands)[number]) => {
      const splitCommand = command.command.split(/\s+/g);

      logger.debug(
        `Running script ${scriptName} in workspace ${workspace.name} (cwd: ${
          command.cwd
        }): ${splitCommand.join(" ")}`,
      );

      const proc = Bun.spawn(command.command.split(/\s+/g), {
        cwd: command.cwd,
        env: { ...process.env, FORCE_COLOR: "1" },
        stdout: "pipe",
        stderr: "pipe",
      });

      const linePrefix = options.noPrefix
        ? ""
        : `[${workspace.name}:${scriptName}] `;

      const pipeOutput = async (streamName: "stdout" | "stderr") => {
        const stream = proc[streamName];
        if (stream) {
          for await (const chunk of stream) {
            commandOutputLogger.logOutput(
              chunk,
              "info",
              process[streamName],
              linePrefix,
            );
          }
        }
      };

      await Promise.all([
        pipeOutput("stdout"),
        pipeOutput("stderr"),
        proc.exited,
      ]);

      return {
        scriptName,
        workspace,
        command,
        success: proc.exitCode === 0,
        error:
          proc.exitCode === 0
            ? null
            : new BunWorkspacesError(
                `Script exited with code ${proc.exitCode}`,
              ),
      };
    };

    const results = [] as {
      success: boolean;
      workspaceName: string;
      error: Error | null;
    }[];

    if (options.parallel) {
      let i = 0;
      for await (const result of await Promise.allSettled(
        scriptCommands.map(runCommand),
      )) {
        if (result.status === "rejected") {
          results.push({
            success: false,
            workspaceName: workspaces[i],
            error: result.reason,
          });
        } else {
          results.push({
            success: result.value.success,
            workspaceName: workspaces[i],
            error: result.value.error,
          });
        }
        i++;
      }
    } else {
      // Run in series (default)
      let i = 0;
      for (const command of scriptCommands) {
        try {
          const result = await runCommand(command);
          results.push({
            success: result.success,
            workspaceName: workspaces[i],
            error: result.error,
          });
        } catch (error) {
          results.push({
            success: false,
            workspaceName: workspaces[i],
            error: error as Error,
          });
        }
        i++;
      }
    }

    let failCount = 0;
    results.forEach(({ success, workspaceName }) => {
      if (!success) failCount++;
      logger.info(`${success ? "✅" : "❌"} ${workspaceName}: ${script}`);
    });

    const s = results.length === 1 ? "" : "s";
    if (failCount) {
      const message = `${failCount} of ${results.length} script${s} failed`;
      logger.error(message);
      process.exit(1);
    } else {
      logger.info(`${results.length} script${s} ran successfully`);
    }
  },
);

export const defineProjectCommands = (context: ProjectCommandContext) => {
  listWorkspaces(context);
  listScripts(context);
  workspaceInfo(context);
  scriptInfo(context);
  runScript(context);
};
