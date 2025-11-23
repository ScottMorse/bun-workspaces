import { mergeAsyncIterables } from "../../internal/mergeAsyncIterables";
import { IS_WINDOWS } from "../../internal/os";
import { sanitizeAnsi } from "../../internal/regex";
import type { ScriptCommand } from "./scriptCommand";

export type OutputStreamName = "stdout" | "stderr";

export type OutputChunk = {
  /** The source of the output, stdout or stderr */
  streamName: OutputStreamName;
  /** Raw output text */
  text: string;
  /** Stripped of ANSI escape codes */
  textAnsiSanitized: string;
};

export type RunScriptExit<ScriptMetadata extends object = object> = {
  code: number;
  signal: NodeJS.Signals | null;
  success: boolean;
  startTimeISO: string;
  endTimeISO: string;
  durationMs: number;
} & ScriptMetadata;

export type RunScriptResult<ScriptMetadata extends object = object> = {
  output: AsyncIterable<OutputChunk>;
  exit: Promise<RunScriptExit<ScriptMetadata>>;
  metadata: ScriptMetadata;
};

export type RunScriptOptions<ScriptMetadata extends object = object> = {
  scriptCommand: ScriptCommand;
  metadata: ScriptMetadata;
};

/**
 * Run some script and get an async output stream of
 * stdout and stderr chunks and a result object
 * containing exit details.
 */
export const runScript = <ScriptMetadata extends object = object>({
  scriptCommand,
  metadata,
}: RunScriptOptions<ScriptMetadata>): RunScriptResult<ScriptMetadata> => {
  const startTime = new Date();

  const proc = Bun.spawn(
    [...(IS_WINDOWS ? ["cmd", "/c"] : ["sh", "-c"]), scriptCommand.command],
    {
      cwd: scriptCommand.workingDirectory,
      env: { ...process.env, FORCE_COLOR: "1" },
      stdout: "pipe",
      stderr: "pipe",
    },
  );

  async function* pipeOutput(
    streamName: OutputStreamName,
  ): AsyncIterable<OutputChunk> {
    const stream = proc[streamName];
    if (stream) {
      for await (const chunk of stream) {
        const text = new TextDecoder().decode(chunk);
        yield {
          streamName,
          text,
          textAnsiSanitized: sanitizeAnsi(text),
        };
      }
    }
  }

  const output = mergeAsyncIterables([
    pipeOutput("stdout"),
    pipeOutput("stderr"),
  ]);

  const exit = proc.exited.then<RunScriptExit<ScriptMetadata>>((code) => {
    const endTime = new Date();
    return {
      ...metadata,
      code,
      signal: proc.signalCode,
      success: code === 0,
      startTimeISO: startTime.toISOString(),
      endTimeISO: endTime.toISOString(),
      durationMs: endTime.getTime() - startTime.getTime(),
    };
  });

  return { output, exit, metadata };
};
