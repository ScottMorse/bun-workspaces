import path from "node:path";
import { getProjectRoot, type TestProjectName } from "../testProjects";

export interface SetupTestOptions {
  testProject?: TestProjectName;
}

export interface OutputText {
  raw: string;
  sanitized: string;
}

export interface SetupTestResult {
  run: (...argv: string[]) => Promise<{
    subprocess: Bun.Subprocess<"ignore", "pipe", "pipe">;
    outputLines: OutputLine[];
    combinedOutput: OutputText;
  }>;
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
      [path.resolve(__dirname, "../../bin/cli.js"), ...argv],
      {
        cwd: testProjectRoot,
        env: { ...process.env, FORCE_COLOR: "1" },
        stdout: "pipe",
        stderr: "pipe",
      },
    );

    const outputLines: OutputLine[] = [];
    const pipeOutput = async (source: "stdout" | "stderr") => {
      const stream = subprocess[source];
      if (stream) {
        for await (const chunk of stream) {
          outputLines.push(
            ...new TextDecoder()
              .decode(chunk)
              .split("\n")
              .map((line) => ({
                text: {
                  raw: line,
                  sanitized: sanitizeText(line),
                },
                source,
              })),
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
      subprocess,
      outputLines: outputLines.filter((line) => line.text.sanitized.trim()),
      combinedOutput: {
        raw: outputLines.map((line) => line.text.raw).join("\n"),
        sanitized: outputLines.map((line) => line.text.sanitized).join("\n"),
      },
    };
  };

  return { run };
};
