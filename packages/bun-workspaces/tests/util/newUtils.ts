import path from "node:path";
import packageJson from "../../package.json";
import { getProjectRoot, type TestProjectName } from "../testProjects";

export interface SetupTestOptions {
  testProject?: TestProjectName;
}

export interface OutputText {
  raw: string;
  sanitized: string;
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

export interface OutputLine {
  text: OutputText;
  source: "stdout" | "stderr";
}

const sanitizeText = (text: string) =>
  // eslint-disable-next-line no-control-regex
  text.replace(/\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g, "");

export const setupTest = (
  { testProject = "default" }: SetupTestOptions = { testProject: "default" },
): SetupTestResult => {
  const testProjectRoot = getProjectRoot(testProject);

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

    await Promise.all([
      pipeOutput("stdout"),
      pipeOutput("stderr"),
      subprocess.exited,
    ]);

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
