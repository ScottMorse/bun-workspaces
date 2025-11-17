import fs from "fs";
import path from "path";
import { logger } from "../../internal/logger";
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

    workspaces.sort((a, b) => a.path.localeCompare(b.path));

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

    const scriptCommands = workspaces.map((workspace) =>
      project.createScriptCommand({
        scriptName: script,
        workspaceNameOrAlias: workspace.name,
        method: "cd",
        args: options.args?.replace(/<workspace>/g, workspace.name) ?? "",
      }),
    );

    const runCommand = async ({
      commandDetails,
      scriptName,
      workspace,
    }: (typeof scriptCommands)[number]) => {
      const splitCommand = commandDetails.command.split(/\s+/g);

      logger.debug(
        `Running script ${scriptName} in workspace ${workspace.name} (cwd: ${
          commandDetails.workingDirectory
        }): ${splitCommand.join(" ")}`,
      );

      const startTime = new Date();

      const proc = Bun.spawn(commandDetails.command.split(/\s+/g), {
        cwd: commandDetails.workingDirectory,
        env: { ...process.env, FORCE_COLOR: "1" },
        stdout: "pipe",
        stderr: "pipe",
      });

      const linePrefix = options.prefix
        ? `[${workspace.name}:${scriptName}] `
        : "";

      const pipeOutput = async (streamName: "stdout" | "stderr") => {
        const stream = proc[streamName];
        if (stream && logger.printLevel !== "silent") {
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

      const endTime = new Date();

      return {
        scriptName,
        workspace,
        command: commandDetails,
        success: proc.exitCode === 0,
        exitCode: proc.exitCode!,
        startTime,
        endTime,
        durationMs: endTime.getTime() - startTime.getTime(),
      };
    };

    const results = [] as RunScriptJsonOutputWorkspace[];

    const runParallel = async () => {
      let i = 0;
      for await (const result of await Promise.allSettled(
        scriptCommands.map(runCommand),
      )) {
        if (result.status === "rejected") {
          logger.error(
            `Error running script ${script} in workspace ${workspaces[i].name}: ${result.reason}`,
          );
        } else {
          const { name, path, aliases } = workspaces[i];
          results.push({
            workspace: { name, path, aliases },
            success: result.value.success,
            exitCode: result.value.exitCode,
            startTimeISO: result.value.startTime.toISOString(),
            endTimeISO: result.value.endTime.toISOString(),
            durationMs: result.value.durationMs,
          });
        }
        i++;
      }
    };

    const runSeries = async () => {
      let i = 0;
      for (const command of scriptCommands) {
        try {
          const result = await runCommand(command);
          const { name, path, aliases } = workspaces[i];
          results.push({
            workspace: { name, path, aliases },
            success: result.success,
            exitCode: result.exitCode,
            startTimeISO: result.startTime.toISOString(),
            endTimeISO: result.endTime.toISOString(),
            durationMs: result.durationMs,
          });
        } catch (error) {
          logger.error(
            `Error running script ${script} in workspace ${workspaces[i].name}: ${error}`,
          );
        }
        i++;
      }
    };

    const startTime = new Date();
    if (options.parallel) {
      await runParallel();
    } else {
      await runSeries();
    }
    const endTime = new Date();

    let successCount = 0;
    let failureCount = 0;
    results.forEach(({ success, workspace, exitCode }) => {
      if (success) successCount++;
      else failureCount++;
      logger.info(
        `${success ? "✅" : "❌"} ${workspace.name}: ${script}${exitCode ? ` (exited with code ${exitCode})` : ""}`,
      );
    });

    const s = results.length === 1 ? "" : "s";
    if (failureCount) {
      const message = `${failureCount} of ${results.length} script${s} failed`;
      logger.info(message);
    } else {
      logger.info(`${results.length} script${s} ran successfully`);
    }

    if (options.jsonOutfile) {
      const jsonOutput: RunScriptJsonOutputFile = {
        script,
        args: options.args || "",
        parallel: !!options.parallel,
        totalCount: results.length,
        successCount,
        failureCount,
        allSuccess: successCount === results.length,
        startTimeISO: startTime.toISOString(),
        endTimeISO: endTime.toISOString(),
        durationMs: endTime.getTime() - startTime.getTime(),
        workspaces: results,
      };

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
        fs.writeFileSync(fullOutputPath, JSON.stringify(jsonOutput, null, 2));
      } catch (error) {
        logger.error(
          `Failed to write JSON output file "${fullOutputPath}": ${error}`,
        );
        process.exit(1);
      }
      logger.info(`JSON output written to ${fullOutputPath}`);
    }

    if (failureCount) {
      process.exit(1);
    }
  },
);
