import {
  CLI_GLOBAL_OPTIONS_CONFIG,
  type CliGlobalOptionConfig,
  type CliGlobalOptionName,
} from "bun-workspaces/src/cli/globalOptions";

export interface CliExample {
  bashLines: string[];
}

export interface CliGlobalOptionContent {
  description: string;
  examples: CliExample[];
}

const createOptionContent = (
  optionName: CliGlobalOptionName,
  factory: (optionConfig: CliGlobalOptionConfig) => CliGlobalOptionContent,
) => ({
  ...CLI_GLOBAL_OPTIONS_CONFIG[optionName],
  ...factory(CLI_GLOBAL_OPTIONS_CONFIG[optionName]),
});

const CLI_GLOBAL_OPTIONS_CONTENT = {
  configFile: createOptionContent(
    "configFile",
    ({ mainOption, shortOption }) => ({
      description: "Use this option to point to a config file.",
      examples: [
        {
          bashLines: [
            `bw ${mainOption}=/path/to/your/config.json list-workspaces`,
            `bw ${shortOption} /path/to/your/config.json list-workspaces`,
          ],
        },
      ],
    }),
  ),
  cwd: createOptionContent("cwd", ({ mainOption, shortOption }) => ({
    description: "Use this option to point to a config file.",
    examples: [
      {
        bashLines: [
          `bw ${mainOption}=/path/to/your/project list-workspaces`,
          `bw ${shortOption} /path/to/your/project list-workspaces`,
        ],
      },
    ],
  })),
  logLevel: createOptionContent("logLevel", ({ mainOption, shortOption }) => ({
    description: "Use this option to point to a config file.",
    examples: [
      {
        bashLines: [
          `bw ${mainOption}=silent list-workspaces`,
          `bw ${shortOption} error list-workspaces`,
        ],
      },
    ],
  })),
} as const satisfies Record<
  CliGlobalOptionName,
  CliGlobalOptionContent & CliGlobalOptionConfig
>;

export const getCliGlobalOptionContent = (optionName: CliGlobalOptionName) =>
  CLI_GLOBAL_OPTIONS_CONTENT[optionName];
