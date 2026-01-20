import { type CliCommandConfig } from "bun-workspaces/src/cli/commands/commandsConfig";
import { type CliGlobalOptionConfig } from "bun-workspaces/src/cli/globalOptions/globalOptionsConfig";

export type CliExample = {
  bashLines: string[];
};

export type CliCommandInfo = {
  commandName: string;
  title: string;
  description: string;
  examples: string[];
};

export type CliGlobalOptionInfo = {
  optionName: string;
  title: string;
  description: string;
  examples: string[];
};

export type CliCommandContent = CliCommandInfo & CliCommandConfig;

export type CliGlobalOptionContent = CliGlobalOptionInfo &
  CliGlobalOptionConfig;
