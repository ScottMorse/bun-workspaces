import {
  getCliGlobalOptionConfig,
  type CliGlobalOptionConfig,
  type CliGlobalOptionName,
} from "bun-workspaces/src/cli/globalOptions";
import type { CliOptionContent } from "./cliOption";

export type CliGlobalOptionContent = CliGlobalOptionConfig & CliOptionContent;

const defineOptionContent = (
  optionName: CliGlobalOptionName,
  factory: (optionConfig: CliGlobalOptionConfig) => CliOptionContent,
): CliGlobalOptionContent => {
  const config = getCliGlobalOptionConfig(optionName);
  return {
    ...config,
    ...factory(config),
  };
};

const CLI_GLOBAL_OPTIONS_CONTENT = {
  configFile: defineOptionContent(
    "configFile",
    ({ mainOption, shortOption }) => ({
      title: "Config File (bw.json)",
      description:
        "Use this option to point to a config file. Otherwise ./bw.json is used by default.",
      examples: [
        `bw ${mainOption}=/path/to/your/config.json list-workspaces`,
        `bw ${shortOption} /path/to/your/config.json list-workspaces`,
      ],
    }),
  ),
  cwd: defineOptionContent("cwd", ({ mainOption, shortOption }) => ({
    title: "Working Directory",
    description:
      "Get the project root from a specific directory. This should be where the root package.json of your project is located.",
    examples: [
      `bw ${mainOption}=/path/to/your/project list-workspaces`,
      `bw ${shortOption} /path/to/your/project list-workspaces`,
    ],
  })),
  logLevel: defineOptionContent("logLevel", ({ mainOption, shortOption }) => ({
    title: "Log Level",
    description:
      "Set the logging level. Script output of workspaces is always preserved except when log level is set to silent",
    examples: [
      `bw ${mainOption}=silent list-workspaces`,
      `bw ${shortOption} error list-workspaces`,
    ],
  })),
} as const satisfies Record<CliGlobalOptionName, CliGlobalOptionContent>;

export const getCliOptionContent = (optionName: CliGlobalOptionName) =>
  CLI_GLOBAL_OPTIONS_CONTENT[optionName];
