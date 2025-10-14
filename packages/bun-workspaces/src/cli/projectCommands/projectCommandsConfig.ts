export interface ProjectCommandConfig {
  command: string;
  aliases: string[];
  description: string;
  options: Record<string, { flag: string; description: string }>;
}

export type ProjectCommandName = keyof typeof PROJECT_COMMANDS_CONFIG;

const PROJECT_COMMANDS_CONFIG = {
  listWorkspaces: {
    command: "list-workspaces [pattern]",
    aliases: ["ls", "list"],
    description: "List all workspaces",
    options: {
      nameOnly: {
        flag: "--name-only",
        description: "Only show workspace names",
      },
      json: {
        flag: "--json",
        description: "Output as JSON",
      },
      pretty: {
        flag: "--pretty",
        description: "Pretty print JSON",
      },
    },
  },
  listScripts: {
    command: "list-scripts",
    aliases: [],
    description: "List all scripts available with their workspaces",
    options: {
      nameOnly: {
        flag: "--name-only",
        description: "Only show script names",
      },
      json: {
        flag: "--json",
        description: "Output as JSON",
      },
      pretty: {
        flag: "--pretty",
        description: "Pretty print JSON",
      },
    },
  },
  workspaceInfo: {
    command: "workspace-info <workspace>",
    aliases: ["info"],
    description: "Show information about a workspace",
    options: {
      json: {
        flag: "--json",
        description: "Output as JSON",
      },
      pretty: {
        flag: "--pretty",
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
        flag: "--workspaces-only",
        description: "Only show script's workspace names",
      },
      json: {
        flag: "--json",
        description: "Output as JSON",
      },
      pretty: {
        flag: "--pretty",
        description: "Pretty print JSON",
      },
    },
  },
  runScript: {
    command: "run <script> [workspaces...]",
    aliases: [],
    description: "Run a script in all workspaces",
    options: {
      parallel: {
        flag: "--parallel",
        description: "Run the scripts in parallel",
      },
      args: {
        flag: "--args <args>",
        description: "Args to append to the script command",
      },
      noPrefix: {
        flag: "--noPrefix",
        description: "Do not prefix the workspace name to the script output",
      },
    },
  },
} as const satisfies Record<string, ProjectCommandConfig>;

export const getProjectCommandConfig = (commandName: ProjectCommandName) =>
  PROJECT_COMMANDS_CONFIG[commandName];
