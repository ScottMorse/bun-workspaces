import crypto from "node:crypto";
import { BunWorkspacesError } from "../internal/core";
import { IS_WINDOWS } from "../internal/runtime";
import { createTempFile } from "../internal/runtime/tempFile";

const createWindowsBatchFile = (command: string) => {
  const fileName = `${crypto.randomUUID()}.cmd`;

  const fileContent = `@echo off\r\n${command}\r\n`;

  return createTempFile({ fileName, fileContent });
};

const createShellScript = (command: string) => {
  const fileName = `${crypto.randomUUID()}.sh`;

  return createTempFile({ fileName, fileContent: command, mode: 0o755 });
};

export const SCRIPT_SHELL_OPTIONS = ["bun", "os"] as const;

export type ScriptShellOption = (typeof SCRIPT_SHELL_OPTIONS)[number];

export type ScriptExecutor = {
  argv: string[];
  cleanup: () => void;
};

export const createScriptExecutor = (
  command: string,
  shell: ScriptShellOption,
): ScriptExecutor => {
  if (shell === "bun") {
    const { filePath, cleanup } = createShellScript(command);
    return {
      argv: ["bun", filePath],
      cleanup,
    };
  }

  if (shell === "os") {
    const { filePath, cleanup } = IS_WINDOWS
      ? createWindowsBatchFile(command)
      : createShellScript(command);

    return {
      argv: IS_WINDOWS
        ? ["cmd", "/d", "/s", "/c", "call", filePath]
        : ["sh", "-c", filePath],
      cleanup,
    };
  }

  throw new BunWorkspacesError(`Invalid shell option: ${shell}`);
};
