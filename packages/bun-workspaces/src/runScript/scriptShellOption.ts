import { getUserEnvVar } from "../config/userEnvVars";
import { BunWorkspacesError } from "../internal/core";

export const SCRIPT_SHELL_OPTIONS = ["bun", "system"] as const;

export type ScriptShellOption = (typeof SCRIPT_SHELL_OPTIONS)[number];

export const validateScriptShellOption = (shell: string): ScriptShellOption => {
  if (!SCRIPT_SHELL_OPTIONS.includes(shell as ScriptShellOption)) {
    throw new BunWorkspacesError(
      `Invalid shell option: ${shell} (accepted values: ${SCRIPT_SHELL_OPTIONS.join(", ")})`,
    );
  }
  return shell as ScriptShellOption;
};

export const getScriptShellDefault = () => {
  const shell = getUserEnvVar("scriptShellDefault");

  return shell ? validateScriptShellOption(shell) : "bun";
};

export const resolveScriptShell = (shell?: string): ScriptShellOption => {
  if (
    !shell ||
    shell === "default" ||
    shell === "undefined" ||
    shell === "null"
  ) {
    return getScriptShellDefault();
  }
  return validateScriptShellOption(shell);
};
