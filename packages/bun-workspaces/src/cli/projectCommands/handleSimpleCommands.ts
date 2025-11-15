import { logger } from "../../internal/logger";
import {
  createJsonLines,
  commandOutputLogger,
  createScriptInfoLines,
  createWorkspaceInfoLines,
  type ProjectCommandContext,
} from "./commandHandlerUtils";
import {
  getProjectCommandConfig,
  type CliProjectCommandName,
} from "./projectCommandsConfig";

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

export const listWorkspaces = handleCommand(
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

export const listScripts = handleCommand(
  "listScripts",
  (
    { project },
    options: { nameOnly: boolean; json: boolean; pretty: boolean },
  ) => {
    logger.debug(`Command: List scripts (options: ${JSON.stringify(options)})`);

    const scripts = project.mapScriptsToWorkspaces();
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

export const workspaceInfo = handleCommand(
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
      logger.error(`Workspace ${JSON.stringify(workspaceName)} not found`);
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

export const scriptInfo = handleCommand(
  "scriptInfo",
  (
    { project },
    script: string,
    options: { workspacesOnly: boolean; json: boolean; pretty: boolean },
  ) => {
    logger.debug(
      `Command: Script info for ${script} (options: ${JSON.stringify(options)})`,
    );

    const scripts = project.mapScriptsToWorkspaces();
    const scriptMetadata = scripts[script];
    if (!scriptMetadata) {
      logger.error(`Script not found: ${JSON.stringify(script)}`);
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
