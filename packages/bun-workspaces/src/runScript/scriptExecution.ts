import crypto from "node:crypto";
import { BunWorkspacesError } from "../internal/core";
import { IS_WINDOWS } from "../internal/runtime";
import { createTempFile } from "../internal/runtime/tempFile";
import {
  resolveScriptShell,
  type ScriptShellOption,
} from "./scriptShellOption";

const createWindowsBatchFile = (command: string) => {
  const fileName = `${crypto.randomUUID()}.cmd`;

  const fileContent = `@echo off\r\n${command}\r\n`;

  return createTempFile({ fileName, fileContent });
};

const createShellScript = (command: string) => {
  const fileName = `${crypto.randomUUID()}.sh`;

  return createTempFile({ fileName, fileContent: command, mode: 0o755 });
};

export type ScriptExecutor = {
  argv: string[];
  cleanup: () => void;
};

export const createScriptExecutor = (
  command: string,
  shell: ScriptShellOption,
): ScriptExecutor => {
  shell = resolveScriptShell(shell);

  if (shell === "bun") {
    const { filePath, cleanup } = createShellScript(command);
    return {
      argv: ["bun", filePath],
      cleanup,
    };
  }

  if (shell === "system") {
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
