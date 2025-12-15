import {
  getProjectCommandConfig,
  type CliProjectCommandConfig,
  type CliProjectCommandName,
} from "bun-workspaces/src/cli/projectCommands/projectCommandsConfig";
import type { CliOptionContent } from "./cliOption";

export type CliProjectCommandContent = Omit<
  CliProjectCommandConfig,
  "description"
> &
  CliOptionContent & {
    optionName: CliProjectCommandName;
  };

const defineOptionContent = (
  optionName: CliProjectCommandName,
  factory: (optionConfig: CliProjectCommandConfig) => CliOptionContent
): CliProjectCommandContent => {
  const config = getProjectCommandConfig(optionName);
  const content = factory(config);

  const exampleLines = content.examples.filter(
    (example) => example.trim() && !example.match(/^\s*#/)
  );

  const getMainFlag = (flag: string) => {
    return flag.trim().split(" ")[0];
  };

  for (const option of Object.values(config.options)) {
    if (
      !exampleLines.find((line) => line.includes(getMainFlag(option.flags)))
    ) {
      throw new Error(
        `Expected an example to include ${getMainFlag(option.flags)}`
      );
    }
  }

  if (
    !exampleLines.find((line) => {
      // line that uses no flags
      return Object.values(config.options).every(
        (option) => !line.includes(getMainFlag(option.flags))
      );
    })
  ) {
    throw new Error(`Expected an example to use no flags`);
  }

  return {
    optionName,
    ...config,
    ...factory(config),
  };
};

const CLI_PROJECT_COMMAND_OPTIONS_CONTENT = {
  listWorkspaces: defineOptionContent("listWorkspaces", () => ({
    title: "List Workspaces",
    description:
      'List all workspaces found in the project. This uses the "workspaces" field in your root package.json file.',
    examples: [
      "# Default output. Shows metadata about workspaces found in all workspaces",
      `bw list-workspaces`,
      "",
      "# Output only the list of workspace names",
      `bw list-workspaces --name-only`,
      "",
      "# Output as JSON",
      `bw list-workspaces --json`,
      "",
      "# Output as formatted JSON",
      `bw list-workspaces --json --pretty`,
    ],
  })),
  listScripts: defineOptionContent("listScripts", () => ({
    title: "List Scripts",
    description: "List all scripts available with their workspaces",
    examples: [
      "# Default output. Shows metadata about scripts found in all workspaces",
      `bw list-scripts`,
      "",
      "# Output only the list of script names",
      `bw list-scripts --name-only`,
      "",
      "# Output as JSON",
      `bw list-scripts --json`,
      "",
      "# Output as formatted JSON",
      `bw list-scripts --json --pretty`,
    ],
  })),
  workspaceInfo: defineOptionContent("workspaceInfo", () => ({
    title: "Workspace Info",
    description: "Show metadata about a workspace",
    examples: [
      "# Default output. Shows metadata about a workspace",
      `bw workspace-info my-workspace`,
      "",
      "# Output as JSON",
      `bw workspace-info --json`,
      "",
      "# Output as formatted JSON",
      `bw workspace-info --json --pretty`,
    ],
  })),
  scriptInfo: defineOptionContent("scriptInfo", () => ({
    title: "Script Info",
    description: "Show metadata about a script",
    examples: [
      "# Default output. Shows metadata about a script",
      `bw script-info my-script`,
      "",
      "# Output only the list of workspaces that have the script",
      `bw script-info my-script --workspaces-only`,
      "",
      "# Output as JSON",
      `bw script-info --json`,
      "",
      "# Output as formatted JSON",
      `bw script-info --json --pretty`,
    ],
  })),
  runScript: defineOptionContent("runScript", () => ({
    title: "Run Script",
    description:
      'Run a script in all workspaces that have it in their "scripts" field in their respective package.json, or run an inline script.',
    examples: [
      '# Run my-script for all workspaces with it in their package.json "scripts" field',
      `bw run my-script`,
      "",
      "# Run a scripts in parallel (logs are prefixed with the workspace name by default)",
      `bw run my-script --parallel`,
      "",
      "# Run a scripts in parallel with a max of 2 concurrent scripts",
      `bw run my-script --parallel=2`,
      "",
      "# Run a scripts in parallel with a max of 50% of the available CPUs",
      `bw run my-script --parallel=50%`,
      "",
      "# Run a scripts in parallel with no concurrency limit (use with caution)",
      `bw run my-script --parallel=unbounded`,
      "",
      "# Disable the workspace name prefix in the script output",
      `bw run my-script --no-prefix`,
      "",
      "# Run a script for a specific workspace",
      `bw run my-script my-workspace`,
      "",
      "# Run a script for multiple workspaces",
      `bw run my-script my-workspace-a my-workspace-b`,
      "",
      "# Run a script for workspaces using wildcard",
      "# (does not take into account workspace aliases)",
      `bw run my-script "my-workspace-*"`,
      "",
      "# Run an inline command from each workspace's directory",
      `bw run "echo 'this is my inline script for <workspaceName>'" --inline`,
      "",
      "# Set a name for an inline command",
      `bw run "echo 'this is my inline script'" --inline --inline-name=my-inline-script`,
      "",
      "# Append args to each script call",
      `bw run my-script --args="--my args"`,
      "",
      "# Use the workspace name in args",
      `bw run my-script --args="--my --arg=<workspaceName>"`,
      "",
      "# Output results to a JSON file",
      `bw run my-script --json-outfile=results.json`,
    ],
  })),
} as const satisfies Record<CliProjectCommandName, CliProjectCommandContent>;

export const getCliProjectCommandContent = (
  commandName: CliProjectCommandName
) => CLI_PROJECT_COMMAND_OPTIONS_CONTENT[commandName];

export const getCliProjectCommandsContent = () =>
  Object.values(CLI_PROJECT_COMMAND_OPTIONS_CONTENT);
