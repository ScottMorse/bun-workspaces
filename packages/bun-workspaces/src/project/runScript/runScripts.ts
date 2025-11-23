import { createAsyncIterableQueue } from "../../internal/asyncIterableQueue";
import {
  runScript,
  type OutputChunk,
  type RunScriptExit,
  type RunScriptResult,
} from "./runScript";
import { type ScriptCommand } from "./scriptCommand";

export type RunScriptsScript<ScriptMetadata extends object = object> = {
  scriptCommand: ScriptCommand;
  metadata: ScriptMetadata;
};

export type RunScriptsScriptResult<ScriptMetadata extends object = object> = {
  /** The result of running the script */
  result: RunScriptResult<ScriptMetadata>;
};

export type RunScriptsSummary<ScriptMetadata extends object = object> = {
  totalCount: number;
  successCount: number;
  failureCount: number;
  allSuccess: boolean;
  startTimeISO: string;
  endTimeISO: string;
  durationMs: number;
  scriptResults: RunScriptExit<ScriptMetadata>[];
};

export type RunScriptsOutput<ScriptMetadata extends object = object> = {
  /** The output chunk from a script execution */
  outputChunk: OutputChunk;
  /** The metadata for the script that produced the output chunk */
  scriptMetadata: ScriptMetadata;
};

export type RunScriptsResult<ScriptMetadata extends object = object> = {
  /** Allows async iteration of output chunks from all script executions */
  output: AsyncIterable<RunScriptsOutput<ScriptMetadata>, void>;
  /** Resolves with a results summary after all scripts have exited */
  summary: Promise<RunScriptsSummary<ScriptMetadata>>;
};

export type RunScriptsOptions<ScriptMetadata extends object = object> = {
  scripts: RunScriptsScript<ScriptMetadata>[];
  parallel: boolean;
};

/** Run a list of scripts */
export const runScripts = <ScriptMetadata extends object = object>({
  scripts,
  parallel,
}: RunScriptsOptions<ScriptMetadata>): RunScriptsResult<ScriptMetadata> => {
  const startTime = new Date();

  type ScriptStartTrigger = {
    promise: Promise<ScriptStartTrigger>;
    trigger: () => void;
    index: number;
  };

  const scriptStartTriggers: ScriptStartTrigger[] = scripts.map((_, index) => {
    let trigger: () => void = () => {
      void 0;
    };

    let result = {} as ScriptStartTrigger;
    const promise = new Promise<ScriptStartTrigger>((res) => {
      trigger = () => res(result);
    });

    result = { promise, trigger, index };

    return { promise, trigger, index };
  });

  const outputQueue =
    createAsyncIterableQueue<RunScriptsOutput<ScriptMetadata>>();

  const scriptResults: RunScriptsScriptResult<ScriptMetadata>[] = scripts.map(
    () => null as never as RunScriptsScriptResult<ScriptMetadata>,
  );

  function triggerScript(index: number) {
    const scriptResult = {
      ...scripts[index],
      result: runScript(scripts[index]),
    };

    scriptResults[index] = scriptResult;

    scriptStartTriggers[index].trigger();

    return scriptResult;
  }

  const awaitScriptResults = async () => {
    const outputReaders: Promise<void>[] = [];

    let pendingScriptCount = scripts.length;
    while (pendingScriptCount > 0) {
      const { index } = await Promise.race(
        scriptStartTriggers.map((trigger) => trigger.promise),
      );

      pendingScriptCount--;

      scriptStartTriggers[index].promise = new Promise<never>(() => {
        void 0;
      });

      outputReaders.push(
        (async () => {
          for await (const chunk of scriptResults[index].result.output) {
            outputQueue.push({
              outputChunk: chunk,
              scriptMetadata: scripts[index].metadata,
            });
          }
        })(),
      );
    }

    await Promise.all(outputReaders);
    outputQueue.close();
  };

  const awaitSummary = async () => {
    if (parallel) {
      await Promise.all(
        scripts.map((_, index) => triggerScript(index).result.exit),
      );
    } else {
      for (let index = 0; index < scripts.length; index++) {
        await triggerScript(index).result.exit;
      }
    }

    const scriptExitResults = await Promise.all(
      scripts.map((_, index) => scriptResults[index].result.exit),
    );

    const endTime = new Date();

    return {
      totalCount: scriptExitResults.length,
      successCount: scriptExitResults.filter((exit) => exit.success).length,
      failureCount: scriptExitResults.filter((exit) => !exit.success).length,
      allSuccess: scriptExitResults.every((exit) => exit.success),
      startTimeISO: startTime.toISOString(),
      endTimeISO: endTime.toISOString(),
      durationMs: endTime.getTime() - startTime.getTime(),
      scriptResults: scriptExitResults,
    };
  };

  awaitScriptResults();

  return {
    output: outputQueue,
    summary: awaitSummary(),
  };
};
