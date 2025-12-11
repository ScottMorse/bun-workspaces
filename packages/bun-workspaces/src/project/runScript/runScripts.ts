import { createAsyncIterableQueue } from "../../internal/asyncIterableQueue";
import { logger } from "../../internal/logger";
import type { SimpleAsyncIterable } from "../../internal/types";
import type { OutputChunk } from "./outputChunk";
import { determineParallelMax, type ParallelMaxValue } from "./parallel";
import {
  runScript,
  type RunScriptExit,
  type RunScriptResult,
} from "./runScript";
import { type ScriptCommand } from "./scriptCommand";

export type RunScriptsScript<ScriptMetadata extends object = object> = {
  scriptCommand: ScriptCommand;
  metadata: ScriptMetadata;
  env: Record<string, string>;
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
  output: SimpleAsyncIterable<RunScriptsOutput<ScriptMetadata>>;
  /** Resolves with a results summary after all scripts have exited */
  summary: Promise<RunScriptsSummary<ScriptMetadata>>;
};

export type RunScriptsParallelOptions = {
  max: ParallelMaxValue;
};

export type RunScriptsOptions<ScriptMetadata extends object = object> = {
  scripts: RunScriptsScript<ScriptMetadata>[];
  parallel: boolean | RunScriptsParallelOptions;
};

/** Run a list of scripts */
export const runScripts = <ScriptMetadata extends object = object>({
  scripts,
  parallel,
}: RunScriptsOptions<ScriptMetadata>): RunScriptsResult<ScriptMetadata> => {
  const startTime = new Date();

  type ScriptTrigger = {
    promise: Promise<ScriptTriggerResult>;
    trigger: () => void;
  };

  type ScriptTriggerSet = {
    start: ScriptTrigger;
    end: ScriptTrigger;
    index: number;
  };

  type ScriptTriggerResult = ScriptTrigger & {
    index: number;
  };

  const createScriptTrigger = (result: ScriptTriggerResult) => {
    let trigger: () => void = () => {
      void 0;
    };
    const promise = new Promise<ScriptTrigger>((res) => {
      trigger = () => res(result);
    });

    return { promise, trigger };
  };

  const scriptTriggerSets: ScriptTriggerSet[] = scripts.map((_, index) => {
    const start: ScriptTriggerResult = {
      promise: null as never,
      trigger: null as never,
      index,
    };
    const end: ScriptTriggerResult = {
      promise: null as never,
      trigger: null as never,
      index,
    };
    const startTrigger = createScriptTrigger(start);
    const endTrigger = createScriptTrigger(end);
    Object.assign(start, startTrigger);
    Object.assign(end, endTrigger);

    return { start, end, index };
  });

  const outputQueue =
    createAsyncIterableQueue<RunScriptsOutput<ScriptMetadata>>();

  const scriptResults: RunScriptsScriptResult<ScriptMetadata>[] = scripts.map(
    () => null as never as RunScriptsScriptResult<ScriptMetadata>,
  );

  const parallelMax =
    parallel === false
      ? 1
      : determineParallelMax(
          typeof parallel === "boolean" ? "auto" : parallel.max,
        );

  const parallelBatchSize = Math.min(parallelMax, scripts.length);
  const recommendedParallelMax = determineParallelMax("auto");
  if (parallel && parallelBatchSize > recommendedParallelMax) {
    logger.warn(
      `Number of scripts to run in parallel (${parallelBatchSize}) is greater than the available CPUs (${recommendedParallelMax})`,
    );
  }

  let runningScriptCount = 0;
  let nextScriptIndex = 0;
  const queueScript = (index: number) => {
    if (runningScriptCount >= parallelMax) {
      return;
    }

    const scriptResult = {
      ...scripts[index],
      result: runScript(scripts[index]),
    };

    scriptResults[index] = scriptResult;

    scriptTriggerSets[index].start.trigger();

    runningScriptCount++;
    nextScriptIndex++;

    scriptResults[index].result.exit.then(() => {
      runningScriptCount--;
      if (nextScriptIndex < scripts.length) {
        queueScript(nextScriptIndex);
      }
    });

    return scriptResult;
  };

  const endScript = (index: number) => {
    scriptTriggerSets[index].end.trigger();
  };

  const handleScriptProcesses = async () => {
    const outputReaders: Promise<void>[] = [];
    const scriptExits: Promise<void>[] = [];

    let pendingScriptCount = scripts.length;
    while (pendingScriptCount > 0) {
      const { index } = await Promise.race(
        scriptTriggerSets.map((trigger) => trigger.start.promise),
      );

      pendingScriptCount--;

      scriptTriggerSets[index].start.promise = new Promise<never>(() => {
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

      scriptExits.push(
        (async () => {
          await scriptResults[index].result.exit;
          endScript(index);
        })(),
      );
    }

    await Promise.all(outputReaders);
    await Promise.all(scriptExits);
    outputQueue.close();
  };
  const awaitAllScriptsExit = async () => {
    await Promise.all(scriptTriggerSets.map((trigger) => trigger.end.promise));

    const scriptExitResults = await Promise.all(
      scripts.map((_, index) => scriptResults[index].result.exit),
    );
    return scriptExitResults;
  };

  const awaitSummary = async () => {
    scripts.forEach((_, index) => queueScript(index));

    const scriptExitResults = await awaitAllScriptsExit();

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

  handleScriptProcesses();

  const summary = awaitSummary();

  return {
    output: outputQueue,
    summary,
  };
};
