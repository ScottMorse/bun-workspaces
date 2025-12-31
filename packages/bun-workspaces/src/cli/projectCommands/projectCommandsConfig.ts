import { getUserEnvVarName } from "../../config/userEnvVars";
import { SCRIPT_SHELL_OPTIONS } from "../../runScript/scriptExecution";

export interface CliProjectCommandConfig {
  command: string;
  aliases: string[];
  description: string;
  options: Record<
    string,
    { flags: string[]; description: string; values?: string[] }
  >;
}

export type CliProjectCommandName = keyof typeof CLI_PROJECT_COMMANDS_CONFIG;

const CLI_PROJECT_COMMANDS_CONFIG = {
  listWorkspaces: {
    command: "list-workspaces [pattern]",
    aliases: ["ls", "list"],
    description: "List all workspaces",
    options: {
      nameOnly: {
        flags: ["-n", "--name-only"],
        description: "Only show workspace names",
      },
      json: {
        flags: ["-j", "--json"],
        description: "Output as JSON",
      },
      pretty: {
        flags: ["-p", "--pretty"],
        description: "Pretty print JSON",
      },
    },
  },
  listScripts: {
    command: "list-scripts",
    aliases: ["ls-scripts"],
    description: "List all scripts available with their workspaces",
    options: {
      nameOnly: {
        flags: ["-n", "--name-only"],
        description: "Only show script names",
      },
      json: {
        flags: ["-j", "--json"],
        description: "Output as JSON",
      },
      pretty: {
        flags: ["-p", "--pretty"],
        description: "Pretty print JSON",
      },
    },
  },
  workspaceInfo: {
    command: "workspace-info <workspaceName>",
    aliases: ["info"],
    description: "Show information about a workspace",
    options: {
      json: {
        flags: ["-j", "--json"],
        description: "Output as JSON",
      },
      pretty: {
        flags: ["-p", "--pretty"],
        description: "Pretty print JSON",
      },
    },
  },
  scriptInfo: {
    command: "script-info <script>",
    aliases: [],
    description: "Show information about a script",
    options: {
      workspacesOnly: {
        flags: ["-w", "--workspaces-only"],
        description: "Only show script's workspace names",
      },
      json: {
        flags: ["-j", "--json"],
        description: "Output as JSON",
      },
      pretty: {
        flags: ["-p", "--pretty"],
        description: "Pretty print JSON",
      },
    },
  },
  runScript: {
    command: "run-script <script> [workspaces...]",
    aliases: ["run"],
    description:
      'Run a script in all workspaces that have it in their "scripts" field in package.json',
    options: {
      parallel: {
        flags: ["-P", "--parallel [max]"],
        description:
          "Run the scripts in parallel. Pass an optional number, percentage, or keyword: 'default', 'auto', 'unbounded'",
      },
      args: {
        flags: ["-a", "--args <args>"],
        description: "Args to append to the script command",
      },
      noPrefix: {
        flags: ["-N", "--no-prefix"],
        description: "Do not prefix the workspace name to the script output",
      },
      inline: {
        flags: ["-i", "--inline"],
        description:
          "Run the script as an inline command from the workspace directory",
      },
      inlineName: {
        flags: ["-I", "--inline-name <name>"],
        description: "An optional name for the script when --inline is passed",
      },
      shell: {
        flags: ["-s", "--shell <shell>"],
        values: [...SCRIPT_SHELL_OPTIONS, "default"],
        description: `When using --inline, the shell to use to run the script. Defaults to "bun" or the value of the ${getUserEnvVarName("scriptShellDefault")} environment variable`,
      },
      jsonOutfile: {
        flags: ["-j", "--json-outfile <file>"],
        description: "Output results in a JSON file",
      },
    },
  },
} as const satisfies Record<string, CliProjectCommandConfig>;

export const getProjectCommandConfig = (commandName: CliProjectCommandName) =>
  CLI_PROJECT_COMMANDS_CONFIG[commandName];

export const getCliProjectCommandNames = () =>
  Object.keys(CLI_PROJECT_COMMANDS_CONFIG) as CliProjectCommandName[];
