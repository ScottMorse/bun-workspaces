import {
  type SimpleAsyncIterable,
  mergeAsyncIterables,
} from "../../internal/core";
import { IS_WINDOWS } from "../../internal/runtime";
import {
  createOutputChunk,
  type OutputChunk,
  type OutputStreamName,
} from "./outputChunk";
import type { ScriptCommand } from "./scriptCommand";

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
};

export type RunScriptOptions<ScriptMetadata extends object = object> = {
  scriptCommand: ScriptCommand;
  metadata: ScriptMetadata;
  env: Record<string, string>;
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
}: RunScriptOptions<ScriptMetadata>): RunScriptResult<ScriptMetadata> => {
  const startTime = new Date();

  if (!scriptCommand.command.includes("bun install")) {
    console.log(
      [
        ...(IS_WINDOWS ? ["cmd", "/d", "/s", "/c"] : ["sh", "-c"]),
        scriptCommand.command,
      ],
      {
        cwd: scriptCommand.workingDirectory || process.cwd(),
        env: { ...env, FORCE_COLOR: "1" },
        stdout: "pipe",
        stderr: "pipe",
        stdin: "ignore",
      },
    );
  }

  const proc = Bun.spawn(
    [
      ...(IS_WINDOWS ? ["cmd", "/d", "/s", "/c"] : ["sh", "-c"]),
      scriptCommand.command,
    ],
    {
      cwd: scriptCommand.workingDirectory || process.cwd(),
      env: { ...process.env, ...env, FORCE_COLOR: "1" },
      stdout: "pipe",
      stderr: "pipe",
      stdin: "ignore",
    },
  );

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

  return { output, exit, metadata };
};
