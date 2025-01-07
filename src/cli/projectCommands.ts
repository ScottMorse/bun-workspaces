import { type Command } from "commander";
import { BunWorkspacesError } from "../internal/error";
import { logger, createLogger } from "../internal/logger";
import type { Project } from "../project";
import type { Workspace } from "../workspaces";

export interface ProjectCommandsContext {
  project: Project;
  program: Command;
  printLines: (...lines: string[]) => void;
}

const createWorkspaceInfoLines = (workspace: Workspace) => [
  `Workspace: ${workspace.name}`,
  ` - Path: ${workspace.path}`,
  ` - Glob Match: ${workspace.matchPattern}`,
  ` - Scripts: ${Object.keys(workspace.packageJson.scripts).sort().join(", ")}`,
];

const createScriptInfoLines = (script: string, workspaces: Workspace[]) => [
  `Script: ${script}`,
  ...workspaces.map((workspace) => ` - ${workspace.name}`),
];

const listWorkspaces = ({
  program,
  project,
  printLines,
}: ProjectCommandsContext) => {
  program
    .command("list-workspaces [pattern]")
    .aliases(["ls", "list"])
    .description("List all workspaces")
    .option("--name-only", "Only show workspace names")
    .action((pattern, options) => {
      logger.debug("Command: List workspaces");

      if (options.more) {
        logger.debug("Showing more metadata");
      }

      const lines: string[] = [];
      (pattern
        ? project.findWorkspacesByPattern(pattern)
        : project.workspaces
      ).forEach((workspace) => {
        if (options.nameOnly) {
          lines.push(workspace.name);
        } else {
          lines.push(...createWorkspaceInfoLines(workspace));
        }
      });

      if (!lines.length) {
        lines.push("No workspaces found");
      }

      printLines(...lines);
    });
};

const listScripts = ({
  program,
  project,
  printLines,
}: ProjectCommandsContext) => {
  program
    .command("list-scripts")
    .description("List all scripts available with their workspaces")
    .option("--name-only", "Only show script names")
    .action((options) => {
      logger.debug("Command: List scripts");

      const scripts = project.listScriptsWithWorkspaces();
      const lines: string[] = [];
      Object.values(scripts)
        .sort(({ name: nameA }, { name: nameB }) => nameA.localeCompare(nameB))
        .forEach(({ name, workspaces }) => {
          if (options.nameOnly) {
            lines.push(name);
          } else {
            lines.push(...createScriptInfoLines(name, workspaces));
          }
        });

      if (!lines.length) {
        lines.push("No scripts found");
      }

      printLines(...lines);
    });
};

const workspaceInfo = ({
  program,
  project,
  printLines,
}: ProjectCommandsContext) => {
  program
    .command("workspace-info <workspace>")
    .aliases(["info"])
    .description("Show information about a workspace")
    .action((workspaceName) => {
      logger.debug(`Command: Workspace info for ${workspaceName}`);

      const workspace = project.findWorkspaceByName(workspaceName);
      if (!workspace) {
        logger.error(`Workspace not found: ${JSON.stringify(workspaceName)}`);
        return;
      }

      printLines(...createWorkspaceInfoLines(workspace));
    });
};

const scriptInfo = ({
  program,
  project,
  printLines,
}: ProjectCommandsContext) => {
  program
    .command("script-info <script>")
    .description("Show information about a script")
    .option("--workspaces-only", "Only show script's workspace names")
    .action((script, options) => {
      logger.debug(`Command: Script info for ${script}`);

      const scripts = project.listScriptsWithWorkspaces();
      const scriptMetadata = scripts[script];
      if (!scriptMetadata) {
        printLines(
          `Script not found: ${JSON.stringify(
            script,
          )} (available: ${Object.keys(scripts).join(", ")})`,
        );
        return;
      }
      printLines(
        ...(options.workspacesOnly
          ? scriptMetadata.workspaces.map(({ name }) => name)
          : createScriptInfoLines(script, scriptMetadata.workspaces)),
      );
    });
};

const runScript = ({ program, project }: ProjectCommandsContext) => {
  program
    .command("run <script> [workspaces...]")
    .description("Run a script in all workspaces")
    .option("--parallel", "Run the scripts in parallel")
    .option("--args <args>", "Args to append to the script command", "")
    .action(async (script: string, _workspaces: string[], options) => {
      logger.debug(
        `Command: Run script ${JSON.stringify(script)} for ${
          _workspaces.length
            ? "workspaces " + _workspaces.join(", ")
            : "all workspaces"
        } (parallel: ${!!options.parallel}, method: ${JSON.stringify(
          options.method,
        )}, args: ${JSON.stringify(options.args)})`,
      );

      const workspaces = _workspaces.length
        ? _workspaces.flatMap((workspacePattern) => {
            if (workspacePattern.includes("*")) {
              return project
                .findWorkspacesByPattern(workspacePattern)
                .filter(({ packageJson: { scripts } }) => scripts?.[script])
                .map(({ name }) => name);
            }
            return [workspacePattern];
          })
        : project.listWorkspacesWithScript(script).map(({ name }) => name);

      if (!workspaces.length) {
        program.error(
          `No ${_workspaces.length ? "matching " : ""}workspaces found for script ${JSON.stringify(script)}`,
        );
      }

      let scriptCommands: ReturnType<typeof project.createScriptCommand>[];
      try {
        scriptCommands = workspaces.map((workspaceName) =>
          project.createScriptCommand({
            scriptName: script,
            workspaceName,
            method: "cd",
            args: options.args.replace(/{{workspace}}/g, workspaceName),
          }),
        );
      } catch (error) {
        program.error((error as Error).message);
        throw error;
      }

      const runCommand = async ({
        command,
        scriptName,
        workspace,
      }: (typeof scriptCommands)[number]) => {
        const commandLogger = createLogger(`${workspace.name}:${scriptName}`);

        const splitCommand = command.command.split(/\s+/g);

        commandLogger.debug(
          `Running script ${scriptName} in workspace ${workspace.name} (cwd: ${
            command.cwd
          }): ${splitCommand.join(" ")}`,
        );

        const silent = logger.level === "silent";

        const proc = Bun.spawn(command.command.split(/\s+/g), {
          cwd: command.cwd,
          env: process.env,
          stdin: "inherit",
          stdout: silent ? "ignore" : "pipe",
          stderr: silent ? "ignore" : "pipe",
        });

        if (proc.stdout) {
          for await (const chunk of proc.stdout) {
            commandLogger.info(new TextDecoder().decode(chunk).trim());
          }
        }

        if (proc.stderr) {
          for await (const chunk of proc.stderr) {
            commandLogger.error(new TextDecoder().decode(chunk).trim());
          }
        }

        await proc.exited;

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
        logger.info(message);
        process.exit(1);
      } else {
        logger.info(`${results.length} script${s} ran successfully`);
      }
    });
};

export const defineProjectCommands = (context: ProjectCommandsContext) => {
  listWorkspaces(context);
  listScripts(context);
  workspaceInfo(context);
  scriptInfo(context);
  runScript(context);
};
