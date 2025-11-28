export interface CliProjectCommandConfig {
  command: string;
  aliases: string[];
  description: string;
  options: Record<string, { flags: string; description: string }>;
}

export type CliProjectCommandName = keyof typeof CLI_PROJECT_COMMANDS_CONFIG;

const CLI_PROJECT_COMMANDS_CONFIG = {
  listWorkspaces: {
    command: "list-workspaces [pattern]",
    aliases: ["ls", "list"],
    description: "List all workspaces",
    options: {
      nameOnly: {
        flags: "--name-only",
        description: "Only show workspace names",
      },
      json: {
        flags: "--json",
        description: "Output as JSON",
      },
      pretty: {
        flags: "--pretty",
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
        flags: "--name-only",
        description: "Only show script names",
      },
      json: {
        flags: "--json",
        description: "Output as JSON",
      },
      pretty: {
        flags: "--pretty",
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
        flags: "--json",
        description: "Output as JSON",
      },
      pretty: {
        flags: "--pretty",
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
        flags: "--workspaces-only",
        description: "Only show script's workspace names",
      },
      json: {
        flags: "--json",
        description: "Output as JSON",
      },
      pretty: {
        flags: "--pretty",
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
        flags: "--parallel",
        description: "Run the scripts in parallel",
      },
      args: {
        flags: "--args <args>",
        description: "Args to append to the script command",
      },
      noPrefix: {
        flags: "--no-prefix",
        description: "Do not prefix the workspace name to the script output",
      },
      inline: {
        flags: "--inline",
        description:
          "Run the script as an inline command from the workspace directory",
      },
      jsonOutfile: {
        flags: "--json-outfile <file>",
        description: "Output results in a JSON file",
      },
    },
  },
} as const satisfies Record<string, CliProjectCommandConfig>;

export const getProjectCommandConfig = (commandName: CliProjectCommandName) =>
  CLI_PROJECT_COMMANDS_CONFIG[commandName];

export const getCliProjectCommandNames = () =>
  Object.keys(CLI_PROJECT_COMMANDS_CONFIG) as CliProjectCommandName[];
