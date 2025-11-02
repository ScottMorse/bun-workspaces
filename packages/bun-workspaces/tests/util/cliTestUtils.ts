import path from "node:path";
import { expect } from "bun:test";
import packageJson from "../../package.json";
import { createRawPattern } from "../../src/internal/regex";
import { getProjectRoot, type TestProjectName } from "../testProjects";

export const USAGE_OUTPUT_PATTERN = new RegExp(
  createRawPattern(`Usage: bunx bun-workspaces [options] [command]

A CLI on top of native Bun workspaces

Options:`) +
    "(.|\n)*" +
    createRawPattern(`Commands:\n`) +
    "(.|\n)*display help for command$",
  "m",
);

export interface SetupTestOptions {
  testProject?: TestProjectName;
}

export interface OutputText {
  raw: string;
  sanitized: string;
}

export interface OutputLine {
  text: OutputText;
  source: "stdout" | "stderr";
}

export interface RunResult {
  outputLines: OutputLine[];
  stdoutAndErr: OutputText;
  stdout: OutputText;
  stderr: OutputText;
  exitCode: number;
}

export interface SetupTestResult {
  run: (...argv: string[]) => Promise<RunResult>;
}

export const assertOutputMatches = (output: string, pattern: string | RegExp) =>
  expect(output.trim()).toMatch(
    pattern instanceof RegExp
      ? pattern
      : new RegExp("^" + createRawPattern(pattern.trim()) + "$", "i"),
  );

export const setupCliTest = (
  { testProject = "default" }: SetupTestOptions = { testProject: "default" },
): SetupTestResult => {
  const testProjectRoot = getProjectRoot(testProject);

  const sanitizeText = (text: string) =>
    // eslint-disable-next-line no-control-regex
    text.replace(/\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g, "");

  const run = async (...argv: string[]) => {
    const subprocess = Bun.spawn(
      [
        path.resolve(__dirname, "../../", packageJson.bin["bun-workspaces"]),
        ...argv,
      ],
      {
        cwd: testProjectRoot,
        env: { ...process.env, FORCE_COLOR: "1" },
        stdout: "pipe",
        stderr: "pipe",
      },
    );

    const outputLines: OutputLine[] = [];
    const stdout: OutputText = {
      raw: "",
      sanitized: "",
    };
    const stderr: OutputText = {
      raw: "",
      sanitized: "",
    };
    const stdoutAndErr: OutputText = {
      raw: "",
      sanitized: "",
    };

    const appendOutputLine = (outputText: OutputText, line: string) => {
      outputText.raw += line + "\n";
      outputText.sanitized += sanitizeText(line) + "\n";
    };

    const pipeOutput = async (source: "stdout" | "stderr") => {
      const stream = subprocess[source];
      if (stream) {
        for await (const chunk of stream) {
          outputLines.push(
            ...new TextDecoder()
              .decode(chunk)
              .split("\n")
              .map((line) => {
                appendOutputLine(source === "stdout" ? stdout : stderr, line);
                appendOutputLine(stdoutAndErr, line);
                return {
                  text: {
                    raw: line,
                    sanitized: sanitizeText(line),
                  },
                  source,
                };
              }),
          );
        }
      }
    };

    await Promise.all([pipeOutput("stdout"), pipeOutput("stderr")]);

    return {
      outputLines,
      stdoutAndErr,
      stdout,
      stderr,
      exitCode: await subprocess.exited,
    };
  };

  return { run };
};
