import { mergeAsyncIterables } from "../../internal/mergeAsyncIterables";
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

export type RunScriptExit = {
  code: number;
  signal: NodeJS.Signals | null;
  success: boolean;
  startTimeISO: string;
  endTimeISO: string;
  durationMs: number;
};

export type RunScriptResult = {
  output: AsyncIterable<OutputChunk>;
  exit: Promise<RunScriptExit>;
};

export type RunScriptOptions = {
  scriptCommand: ScriptCommand;
  outputPrefix?: string;
};

/**
 * Run some script and get an async output stream of
 * stdout and stderr chunks and a result object
 * containing exit details.
 */
export const runScript = ({
  scriptCommand,
  outputPrefix = "",
}: RunScriptOptions) => {
  const startTime = new Date();

  const proc = Bun.spawn(scriptCommand.command.split(/\s+/g), {
    cwd: scriptCommand.workingDirectory,
    env: { ...process.env, FORCE_COLOR: "1" },
    stdout: "pipe",
    stderr: "pipe",
  });

  async function* pipeOutput(
    streamName: OutputStreamName,
  ): AsyncIterable<OutputChunk> {
    const stream = proc[streamName];
    if (stream) {
      for await (const chunk of stream) {
        const text = outputPrefix + new TextDecoder().decode(chunk);
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

  const exit = proc.exited.then<RunScriptExit>((code) => {
    const endTime = new Date();
    return {
      code,
      signal: proc.signalCode,
      success: code === 0,
      startTimeISO: startTime.toISOString(),
      endTimeISO: endTime.toISOString(),
      durationMs: endTime.getTime() - startTime.getTime(),
    };
  });

  return { output, exit };
};
