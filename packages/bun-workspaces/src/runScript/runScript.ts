import {
  type SimpleAsyncIterable,
  mergeAsyncIterables,
} from "../internal/core";
import {
  createOutputChunk,
  type OutputChunk,
  type OutputStreamName,
} from "./outputChunk";
import type { ScriptCommand } from "./scriptCommand";
import {
  createScriptExecutor,
  type ScriptShellOption,
} from "./scriptExecution";

export type RunScriptExit<ScriptMetadata extends object = object> = {
  exitCode: number;
  signal: NodeJS.Signals | null;
  success: boolean;
  startTimeISO: string;
  endTimeISO: string;
  durationMs: number;
  metadata: ScriptMetadata;
};

export type RunScriptResult<ScriptMetadata extends object = object> = {
  output: SimpleAsyncIterable<OutputChunk>;
  exit: Promise<RunScriptExit<ScriptMetadata>>;
  metadata: ScriptMetadata;
  kill: (exit?: number | NodeJS.Signals) => void;
};

export type RunScriptOptions<ScriptMetadata extends object = object> = {
  scriptCommand: ScriptCommand;
  metadata: ScriptMetadata;
  env: Record<string, string>;
  /** The shell to use to run the script. Defaults to "os". */
  shell?: ScriptShellOption;
};

/**
 * Run some script and get an async output stream of
 * stdout and stderr chunks and a result object
 * containing exit details.
 */
export const runScript = <ScriptMetadata extends object = object>({
  scriptCommand,
  metadata,
  env,
  shell,
}: RunScriptOptions<ScriptMetadata>): RunScriptResult<ScriptMetadata> => {
  const startTime = new Date();

  const { argv, cleanup } = createScriptExecutor(
    scriptCommand.command,
    shell ?? "os",
  );

  const proc = Bun.spawn(argv, {
    cwd: scriptCommand.workingDirectory || process.cwd(),
    env: { ...process.env, ...env, FORCE_COLOR: "1" },
    stdout: "pipe",
    stderr: "pipe",
    stdin: "ignore",
  });

  proc.exited.finally(cleanup);

  async function* pipeOutput(
    streamName: OutputStreamName,
  ): SimpleAsyncIterable<OutputChunk> {
    const stream = proc[streamName];
    if (stream) {
      for await (const chunk of stream) {
        yield createOutputChunk(streamName, chunk);
      }
    }
  }

  const output = mergeAsyncIterables([
    pipeOutput("stdout"),
    pipeOutput("stderr"),
  ]);

  const exit = proc.exited.then<RunScriptExit<ScriptMetadata>>((exitCode) => {
    const endTime = new Date();
    return {
      exitCode,
      signal: proc.signalCode,
      success: exitCode === 0,
      startTimeISO: startTime.toISOString(),
      endTimeISO: endTime.toISOString(),
      durationMs: endTime.getTime() - startTime.getTime(),
      metadata,
    };
  });

  return {
    output,
    exit,
    metadata,
    kill: (exit) => proc.kill(exit),
  };
};
