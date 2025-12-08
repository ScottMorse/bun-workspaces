import fs from "fs";
import path from "path";
import { logger } from "../../internal/logger";
import type { Workspace } from "../../workspaces";
import { commandOutputLogger, handleCommand } from "./commandHandlerUtils";

export const runScript = handleCommand(
  "runScript",
  async (
    { project },
    script: string,
    _workspaces: string[],
    options: {
      parallel: boolean;
      args: string;
      prefix: boolean;
      inline: boolean;
      inlineName: string | undefined;
      jsonOutfile: string | undefined;
    },
  ) => {
    logger.debug(
      `Command: Run script ${JSON.stringify(script)} for ${
        _workspaces.length
          ? "workspaces " + _workspaces.join(", ")
          : "all workspaces"
      } (parallel: ${!!options.parallel}, args: ${JSON.stringify(options.args)})`,
    );

    const workspaces: Workspace[] = _workspaces.length
      ? (_workspaces
          .flatMap((workspacePattern) => {
            if (workspacePattern.includes("*")) {
              return project
                .findWorkspacesByPattern(workspacePattern)
                .filter(
                  (workspace) =>
                    options.inline || workspace.scripts.includes(script),
                )
                .map(({ name }) => name);
            }
            return [workspacePattern];
          })
          .map((workspaceName) => {
            const workspace = project.findWorkspaceByNameOrAlias(workspaceName);
            if (!workspace) {
              logger.error(
                `Workspace name or alias not found: ${JSON.stringify(workspaceName)}`,
              );
              process.exit(1);
            }
            return workspace;
          })
          .filter(Boolean) as Workspace[])
      : options.inline
        ? project.workspaces
        : project.listWorkspacesWithScript(script);

    if (!workspaces.length) {
      if (_workspaces.length === 1 && !_workspaces[0].includes("*")) {
        logger.error(`Workspace not found: ${JSON.stringify(_workspaces[0])}`);
      } else {
        logger.error(
          `No ${_workspaces.length ? "matching " : ""}workspaces found${options.inline ? " in the project" : " with script " + JSON.stringify(script)}`,
        );
      }
      process.exit(1);
    }

    if (
      !options.inline &&
      !workspaces.some((workspace) => workspace.scripts.includes(script))
    ) {
      logger.error(
        `Script not found in target workspace${workspaces.length === 1 ? "" : "s"}: ${JSON.stringify(script)}`,
      );
      process.exit(1);
    }

    workspaces.sort((a, b) => a.path.localeCompare(b.path));

    const { output, summary } = project.runScriptAcrossWorkspaces({
      workspacePatterns: workspaces.map(({ name }) => name),
      script,
      inline: options.inline
        ? options.inlineName
          ? { scriptName: options.inlineName }
          : true
        : undefined,
      args: options.args,
      parallel: !!options.parallel,
    });

    const scriptName = options.inline
      ? options.inlineName || "(inline)"
      : script;

    const handleOutput = async () => {
      if (logger.printLevel === "silent") return;
      for await (const { outputChunk, scriptMetadata } of output) {
        commandOutputLogger.logOutput(
          outputChunk.decode(),
          "info",
          process[outputChunk.streamName],
          options.prefix
            ? `[${scriptMetadata.workspace.name}:${scriptName}] `
            : "",
        );
      }
    };

    handleOutput();

    const exitResults = await summary;

    exitResults.scriptResults.forEach(
      ({ success, metadata: { workspace }, exitCode }) => {
        logger.info(
          `${success ? "✅" : "❌"} ${workspace.name}: ${scriptName}${exitCode ? ` (exited with code ${exitCode})` : ""}`,
        );
      },
    );

    const s = exitResults.scriptResults.length === 1 ? "" : "s";
    if (exitResults.failureCount) {
      const message = `${exitResults.failureCount} of ${exitResults.scriptResults.length} script${s} failed`;
      logger.info(message);
    } else {
      logger.info(
        `${exitResults.scriptResults.length} script${s} ran successfully`,
      );
    }

    if (options.jsonOutfile) {
      const fullOutputPath = path.resolve(
        project.rootDirectory,
        options.jsonOutfile,
      );

      // Check if can make directory
      const jsonOutputDir = path.dirname(fullOutputPath);
      if (!fs.existsSync(jsonOutputDir)) {
        try {
          fs.mkdirSync(jsonOutputDir, { recursive: true });
        } catch (error) {
          logger.error(
            `Failed to create JSON output file directory "${jsonOutputDir}": ${error}`,
          );
          process.exit(1);
        }
      } else if (fs.statSync(jsonOutputDir).isFile()) {
        logger.error(
          `Given JSON output file directory "${jsonOutputDir}" is an existing file`,
        );
        process.exit(1);
      }

      // Check if can make file
      if (
        fs.existsSync(fullOutputPath) &&
        fs.statSync(fullOutputPath).isDirectory()
      ) {
        logger.error(
          `Given JSON output file path "${fullOutputPath}" is an existing directory`,
        );
        process.exit(1);
      }

      try {
        fs.writeFileSync(fullOutputPath, JSON.stringify(exitResults, null, 2));
      } catch (error) {
        logger.error(
          `Failed to write JSON output file "${fullOutputPath}": ${error}`,
        );
        process.exit(1);
      }
      logger.info(`JSON output written to ${fullOutputPath}`);
    }

    if (exitResults.failureCount) {
      process.exit(1);
    }
  },
);
