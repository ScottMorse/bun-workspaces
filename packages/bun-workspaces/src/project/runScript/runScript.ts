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
};

export type RunScriptResult = {
  output: AsyncIterable<OutputChunk>;
  exit: Promise<RunScriptExit>;
};

export interface RunScriptOptions {
  scriptCommand: ScriptCommand;
}

export const runScript = async ({ scriptCommand }: RunScriptOptions) => {
  const proc = Bun.spawn(scriptCommand.command.split(/\s+/g), {
    cwd: scriptCommand.workingDirectory,
    env: { ...process.env, FORCE_COLOR: "1" },
    stdout: "pipe",
    stderr: "pipe",
  });

  async function* pipeOutput(
    streamName: "stdout" | "stderr",
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

  const exit = proc.exited.then((exit) => ({
    code: exit,
    signal: proc.signalCode,
  }));

  return { output, exit };
};
