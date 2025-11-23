import fs from "fs";
import path from "path";
import { logger } from "../../internal/logger";
import { runScripts } from "../../project";
import type { Workspace } from "../../workspaces";
import { commandOutputLogger, handleCommand } from "./commandHandlerUtils";

export interface RunScriptJsonOutputWorkspace {
  workspace: Pick<Workspace, "name" | "path" | "aliases">;
  exitCode: number;
  success: boolean;
  startTimeISO: string;
  endTimeISO: string;
  durationMs: number;
}

export interface RunScriptJsonOutputFile {
  script: string;
  args: string;
  parallel: boolean;
  totalCount: number;
  successCount: number;
  failureCount: number;
  allSuccess: boolean;
  startTimeISO: string;
  endTimeISO: string;
  durationMs: number;
  workspaces: RunScriptJsonOutputWorkspace[];
}

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
                .filter(({ scripts }) => scripts.includes(script))
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
      : project.listWorkspacesWithScript(script);

    if (!workspaces.length) {
      if (_workspaces.length === 1 && !_workspaces[0].includes("*")) {
        logger.error(`Workspace not found: ${JSON.stringify(_workspaces[0])}`);
      } else {
        logger.error(
          `No ${_workspaces.length ? "matching " : ""}workspaces found with script ${JSON.stringify(script)}`,
        );
      }
      process.exit(1);
    }

    workspaces.sort((a, b) => a.path.localeCompare(b.path));

    const { output, completion } = project.runScriptAcrossWorkspaces({
      workspacePatterns: workspaces.map(({ name }) => name),
      script,
      args: options.args,
      parallel: !!options.parallel,
    });

    const handleOutput = async () => {
      if (logger.printLevel === "silent") return;
      for await (const { outputChunk, scriptMetadata } of output) {
        commandOutputLogger.logOutput(
          outputChunk.text,
          "info",
          process[outputChunk.streamName],
          options.prefix ? `[${scriptMetadata.workspace.name}:${script}] ` : "",
        );
      }
    };

    handleOutput();

    const exitResults = await completion;

    exitResults.scriptExits.forEach(
      ({ success, metadata: { workspace }, exitCode }) => {
        logger.info(
          `${success ? "✅" : "❌"} ${workspace.name}: ${script}${exitCode ? ` (exited with code ${exitCode})` : ""}`,
        );
      },
    );

    const s = exitResults.scriptExits.length === 1 ? "" : "s";
    if (exitResults.failureCount) {
      const message = `${exitResults.failureCount} of ${exitResults.scriptExits.length} script${s} failed`;
      logger.info(message);
    } else {
      logger.info(
        `${exitResults.scriptExits.length} script${s} ran successfully`,
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
