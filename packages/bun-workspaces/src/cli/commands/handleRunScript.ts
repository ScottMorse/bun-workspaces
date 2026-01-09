import fs from "fs";
import path from "path";
import { logger } from "../../internal/logger";
import type { ParallelMaxValue, ScriptShellOption } from "../../runScript";
import type { Workspace } from "../../workspaces";
import {
  commandOutputLogger,
  handleProjectCommand,
} from "./commandHandlerUtils";

export const runScript = handleProjectCommand(
  "runScript",
  async (
    { project, postTerminatorArgs },
    script: string,
    _workspacePatterns: string[],
    options: {
      workspacePatterns: string | undefined;
      parallel: boolean | string;
      args: string;
      prefix: boolean;
      inline: boolean;
      inlineName: string | undefined;
      shell: string | undefined;
      jsonOutfile: string | undefined;
    },
  ) => {
    options.inlineName = options.inlineName?.trim();
    options.args = options.args?.trim();
    options.jsonOutfile = options.jsonOutfile?.trim();
    options.parallel =
      typeof options.parallel === "string"
        ? options.parallel.trim()
        : options.parallel;

    if (postTerminatorArgs.length && options.args) {
      logger.error(
        "CLI syntax error: Cannot use both --args and inline script args after --",
      );
      process.exit(1);
    }

    const scriptArgs = postTerminatorArgs.length
      ? postTerminatorArgs.join(" ")
      : options.args;

    if (_workspacePatterns.length && options.workspacePatterns) {
      logger.error(
        "CLI syntax error: Cannot use both inline workspace patterns and --workspace-patterns|-w option",
      );
      process.exit(1);
    }

    const workspacePatterns = _workspacePatterns?.length
      ? _workspacePatterns
      : (options.workspacePatterns?.split(",") ?? []);

    logger.debug(
      `Command: Run script ${JSON.stringify(script)} for ${
        workspacePatterns.length
          ? "workspaces " + workspacePatterns.join(", ")
          : "all workspaces"
      } (parallel: ${!!options.parallel}, args: ${JSON.stringify(scriptArgs)})`,
    );

    const workspaces: Workspace[] = workspacePatterns.length
      ? (workspacePatterns
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
      if (
        workspacePatterns.length === 1 &&
        !workspacePatterns[0].includes("*")
      ) {
        logger.error(
          `Workspace not found: ${JSON.stringify(workspacePatterns[0])}`,
        );
      } else {
        logger.error(
          `No ${workspacePatterns.length ? "matching " : ""}workspaces found${options.inline ? " in the project" : " with script " + JSON.stringify(script)}`,
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
        ? options.inlineName || options.shell
          ? {
              scriptName: options.inlineName,
              shell: options.shell as ScriptShellOption,
            }
          : true
        : undefined,
      args: scriptArgs,
      parallel:
        typeof options.parallel === "boolean" ||
        typeof options.parallel === "undefined"
          ? options.parallel
          : options.parallel === "true"
            ? true
            : options.parallel === "false"
              ? false
              : { max: options.parallel as ParallelMaxValue },
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
