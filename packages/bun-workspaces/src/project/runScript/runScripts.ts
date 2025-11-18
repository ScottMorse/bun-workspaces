import {
  runScript,
  type RunScriptExit,
  type RunScriptResult,
} from "./runScript";
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
  scriptExits: RunScriptExit[];
};

export type RunScriptsResult = {
  scriptResults: AsyncIterable<RunScriptsScriptResult>;
  completeExit: Promise<RunScriptsCompleteExit>;
};

export type RunScriptsOptions = {
  scripts: RunScriptsScript[];
  parallel: boolean;
};

/** Run a list of scripts */
export const runScripts = ({
  scripts,
  parallel,
}: RunScriptsOptions): RunScriptsResult => {
  const startTime = new Date();

  type ScriptStartTrigger = {
    promise: Promise<ScriptStartTrigger>;
    trigger: () => void;
    index: number;
  };

  const scriptStartTriggers: ScriptStartTrigger[] = scripts.map((_, index) => {
    let trigger: () => void = () => {};

    let result = {} as ScriptStartTrigger;
    const promise = new Promise<ScriptStartTrigger>((res) => {
      trigger = () => res(result);
    });

    result = { promise, trigger, index };

    return { promise, trigger, index };
  });

  const scriptResults: RunScriptsScriptResult[] = scripts.map(
    () => null as never as RunScriptsScriptResult,
  );

  function triggerScript(index: number) {
    const scriptResult = {
      script: scripts[index],
      result: runScript(scripts[index]),
    };

    scriptResults[index] = scriptResult;

    scriptStartTriggers[index].trigger();

    return scriptResult;
  }

  async function* getScriptResults() {
    let pendingCount = scripts.length;
    while (pendingCount > 0) {
      const { index } = await Promise.race(
        scriptStartTriggers.map((trigger) => trigger.promise),
      );

      pendingCount--;

      scriptStartTriggers[index].promise = new Promise<never>(() => {
        void 0;
      });

      yield scriptResults[index];
    }
  }

  const awaitCompleteExit = async () => {
    if (parallel) {
      await Promise.all(
        scripts.map((_, index) => triggerScript(index).result.exit),
      );
    } else {
      for (let index = 0; index < scripts.length; index++) {
        await triggerScript(index).result.exit;
      }
    }

    const scriptExits = await Promise.all(
      scripts.map((_, index) => scriptResults[index].result.exit),
    );

    const endTime = new Date();

    return {
      successCount: scriptExits.filter((exit) => exit.success).length,
      failureCount: scriptExits.filter((exit) => !exit.success).length,
      allSuccess: scriptExits.every((exit) => exit.success),
      startTimeISO: startTime.toISOString(),
      endTimeISO: endTime.toISOString(),
      durationMs: endTime.getTime() - startTime.getTime(),
      scriptExits,
    };
  };

  return {
    scriptResults: getScriptResults(),
    completeExit: awaitCompleteExit(),
  };
};
