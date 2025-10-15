import type {
  CliGlobalOptionContent,
  CliProjectCommandContent,
} from "../../content/cli";

export const getGlobalOptionId = (option: CliGlobalOptionContent) =>
  "cli-global-option-" + option.optionName;

export const getCommandId = (command: CliProjectCommandContent) =>
  "cli-command-" + command.optionName;
