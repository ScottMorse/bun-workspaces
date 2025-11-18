import { type RunScriptResult } from "./runScript";
import { type ScriptCommand } from "./scriptCommand";

export type RunScriptsScript = {
  name: string;
  outputPrefix: string;
  scriptCommand: ScriptCommand;
};

export type RunScriptsScriptResult = {
  /** The input script metadata */
  script: RunScriptsScript;
  /** The result of running the script */
  result: RunScriptResult;
};

export type RunScriptsCompleteExit = {
  successCount: number;
  failureCount: number;
  allSuccess: boolean;
  startTimeISO: string;
  endTimeISO: string;
  durationMs: number;
  scriptResults: RunScriptsScriptResult[];
};

export type RunScriptsResult = {
  scriptResults: RunScriptResult[];
  completeExit: Promise<RunScriptsCompleteExit>;
};

export type RunScriptsOptions = {
  scripts: RunScriptsScript[];
  parallel: boolean;
};

export const runScripts = async ({
  scripts,
  parallel,
}: RunScriptsOptions): RunScriptsResult => {};
