import { test, expect, describe } from "bun:test";
import { runScript, runScripts } from "../src/project/runScript";

// Sanity tests for lower level runScript and runScripts functions

describe("Run Single Script", () => {
  test("Simple success", async () => {
    const result = await runScript({
      scriptCommand: {
        command: "echo 'test-script 1'",
        workingDirectory: ".",
      },
      metadata: {},
    });

    let outputCount = 0;
    for await (const outputChunk of result.output) {
      expect(outputChunk.streamName).toBe("stdout");
      expect(outputChunk.text).toMatch(`test-script ${outputCount + 1}`);
      expect(outputChunk.textNoAnsi).toMatch(`test-script ${outputCount + 1}`);
      outputCount++;
    }
    const exit = await result.exit;
    expect(exit).toEqual({
      exitCode: 0,
      success: true,
      startTimeISO: expect.any(String),
      endTimeISO: expect.any(String),
      durationMs: expect.any(Number),
      signal: null,
      metadata: {},
    });
    expect(new Date(exit.startTimeISO).getTime()).toBeLessThan(
      new Date(exit.endTimeISO).getTime(),
    );
    expect(exit.durationMs).toBe(
      new Date(exit.endTimeISO).getTime() -
        new Date(exit.startTimeISO).getTime(),
    );
    expect(outputCount).toBe(1);
  });

  test("Simple failure", async () => {
    const result = await runScript({
      scriptCommand: {
        command: "echo 'test-script 1' && exit 2",
        workingDirectory: ".",
      },
      metadata: {},
    });

    let outputCount = 0;
    for await (const outputChunk of result.output) {
      expect(outputChunk.streamName).toBe("stdout");
      expect(outputChunk.text).toMatch(`test-script ${outputCount + 1}`);
      expect(outputChunk.textNoAnsi).toMatch(`test-script ${outputCount + 1}`);
      outputCount++;
    }
    const exit = await result.exit;
    expect(exit).toEqual({
      exitCode: 2,
      success: false,
      startTimeISO: expect.any(String),
      endTimeISO: expect.any(String),
      durationMs: expect.any(Number),
      signal: null,
      metadata: {},
    });
    expect(new Date(exit.startTimeISO).getTime()).toBeLessThan(
      new Date(exit.endTimeISO).getTime(),
    );
    expect(exit.durationMs).toBe(
      new Date(exit.endTimeISO).getTime() -
        new Date(exit.startTimeISO).getTime(),
    );
    expect(outputCount).toBe(1);
  });

  test("Simple failure with signal", async () => {
    const result = await runScript({
      scriptCommand: {
        command: "echo 'test-script 1' && kill -9 $$",
        workingDirectory: ".",
      },
      metadata: {},
    });

    let outputCount = 0;
    for await (const outputChunk of result.output) {
      expect(outputChunk.streamName).toBe("stdout");
      expect(outputChunk.text).toMatch(`test-script ${outputCount + 1}`);
      expect(outputChunk.textNoAnsi).toMatch(`test-script ${outputCount + 1}`);
      outputCount++;
    }
    const exit = await result.exit;
    expect(exit).toEqual({
      exitCode: 137,
      success: false,
      startTimeISO: expect.any(String),
      endTimeISO: expect.any(String),
      durationMs: expect.any(Number),
      signal: "SIGKILL",
      metadata: {},
    });
  });

  test("With stdout and stderr", async () => {
    const result = await runScript({
      scriptCommand: {
        command:
          "echo 'test-script 1' && sleep 0.1 && echo 'test-script 2' >&2 && sleep 0.1 && echo 'test-script 3'",
        workingDirectory: ".",
      },
      metadata: {},
    });

    let outputCount = 0;
    for await (const outputChunk of result.output) {
      expect(outputChunk.streamName).toBe(
        outputCount === 1 ? "stderr" : "stdout",
      );
      expect(outputChunk.text).toMatch(`test-script ${outputCount + 1}`);
      expect(outputChunk.textNoAnsi).toMatch(`test-script ${outputCount + 1}`);
      outputCount++;
    }

    const exit = await result.exit;
    expect(exit).toEqual({
      exitCode: 0,
      success: true,
      startTimeISO: expect.any(String),
      endTimeISO: expect.any(String),
      durationMs: expect.any(Number),
      signal: null,
      metadata: {},
    });
  });

  test("With ANSI escape codes", async () => {
    const result = await runScript({
      scriptCommand: {
        command: "echo -e '\x1b[31mtest-script 1\x1b[0m'",
        workingDirectory: ".",
      },
      metadata: {},
    });

    for await (const outputChunk of result.output) {
      expect(outputChunk.streamName).toBe("stdout");
      expect(outputChunk.text).toBe(`\x1b[31mtest-script 1\x1b[0m\n`);
      expect(outputChunk.textNoAnsi).toBe(`test-script 1\n`);
    }
  });
});

describe("Run Multiple Scripts", () => {
  test("Run Scripts - simple series", async () => {
    const result = await runScripts({
      scripts: [
        {
          metadata: {
            name: "test-script name 1",
          },
          scriptCommand: {
            command: "echo 'test-script 1'",
            workingDirectory: "",
          },
        },
        {
          metadata: {
            name: "test-script name 2",
          },
          scriptCommand: {
            command: "echo 'test-script 2'",
            workingDirectory: "",
          },
        },
      ],
      parallel: false,
    });

    let i = 0;
    for await (const {
      outputChunk: output,
      scriptMetadata: metadata,
    } of result.output) {
      expect(metadata.name).toBe(`test-script name ${i + 1}`);
      expect(output.text).toMatch(`test-script ${i + 1}`);
      expect(output.textNoAnsi).toMatch(`test-script ${i + 1}`);
      i++;
    }

    const summary = await result.summary;
    expect(summary).toEqual({
      totalCount: 2,
      allSuccess: true,
      failureCount: 0,
      successCount: 2,
      startTimeISO: expect.any(String),
      endTimeISO: expect.any(String),
      durationMs: expect.any(Number),
      scriptResults: [
        {
          exitCode: 0,
          success: true,
          startTimeISO: expect.any(String),
          endTimeISO: expect.any(String),
          durationMs: expect.any(Number),
          signal: null,
          metadata: {
            name: "test-script name 1",
          },
        },
        {
          exitCode: 0,
          success: true,
          startTimeISO: expect.any(String),
          endTimeISO: expect.any(String),
          durationMs: expect.any(Number),
          signal: null,
          metadata: {
            name: "test-script name 2",
          },
        },
      ],
    });
  });

  test("Run Scripts - simple series with failure", async () => {
    const result = await runScripts({
      scripts: [
        {
          metadata: {
            name: "test-script name 1",
          },
          scriptCommand: {
            command: "echo 'test-script 1' && exit 1",
            workingDirectory: "",
          },
        },
        {
          metadata: {
            name: "test-script name 2",
          },
          scriptCommand: {
            command: "echo 'test-script 2'",
            workingDirectory: "",
          },
        },
      ],
      parallel: false,
    });

    let i = 0;
    for await (const {
      outputChunk: output,
      scriptMetadata: metadata,
    } of result.output) {
      expect(metadata.name).toBe(`test-script name ${i + 1}`);
      expect(output.text).toMatch(`test-script ${i + 1}`);
      expect(output.textNoAnsi).toMatch(`test-script ${i + 1}`);
      i++;
    }

    const summary = await result.summary;
    expect(summary).toEqual({
      totalCount: 2,
      allSuccess: false,
      failureCount: 1,
      successCount: 1,
      startTimeISO: expect.any(String),
      endTimeISO: expect.any(String),
      durationMs: expect.any(Number),
      scriptResults: [
        {
          exitCode: 1,
          success: false,
          startTimeISO: expect.any(String),
          endTimeISO: expect.any(String),
          durationMs: expect.any(Number),
          signal: null,
          metadata: {
            name: "test-script name 1",
          },
        },
        {
          exitCode: 0,
          success: true,
          startTimeISO: expect.any(String),
          endTimeISO: expect.any(String),
          durationMs: expect.any(Number),
          signal: null,
          metadata: {
            name: "test-script name 2",
          },
        },
      ],
    });
  });

  test("Run Scripts - simple parallel", async () => {
    const scripts = [
      {
        metadata: {
          name: "test-script name 1",
        },
        scriptCommand: {
          command: "sleep 0.5 && echo 'test-script 1'",
          workingDirectory: "",
        },
      },
      {
        metadata: {
          name: "test-script name 2",
        },
        scriptCommand: {
          command: "echo 'test-script 2' && exit 2",
          workingDirectory: "",
        },
      },
      {
        metadata: {
          name: "test-script name 3",
        },
        scriptCommand: {
          command: "sleep 0.25 && echo 'test-script 3'",
          workingDirectory: "",
        },
      },
    ];

    const result = await runScripts({
      scripts,
      parallel: true,
    });

    let i = 0;
    for await (const { outputChunk, scriptMetadata } of result.output) {
      expect(outputChunk.streamName).toBe("stdout");
      const scriptNum = i === 0 ? 2 : i === 1 ? 3 : 1;
      expect(scriptMetadata.name).toBe(`test-script name ${scriptNum}`);
      expect(outputChunk.text).toMatch(`test-script ${scriptNum}`);
      expect(outputChunk.textNoAnsi).toMatch(`test-script ${scriptNum}`);
      i++;
    }

    const summary = await result.summary;
    expect(summary).toEqual({
      totalCount: 3,
      allSuccess: false,
      failureCount: 1,
      successCount: 2,
      startTimeISO: expect.any(String),
      endTimeISO: expect.any(String),
      durationMs: expect.any(Number),
      scriptResults: [
        {
          exitCode: 0,
          success: true,
          startTimeISO: expect.any(String),
          endTimeISO: expect.any(String),
          durationMs: expect.any(Number),
          signal: null,
          metadata: {
            name: "test-script name 1",
          },
        },
        {
          exitCode: 2,
          success: false,
          startTimeISO: expect.any(String),
          endTimeISO: expect.any(String),
          durationMs: expect.any(Number),
          signal: null,
          metadata: {
            name: "test-script name 2",
          },
        },
        {
          exitCode: 0,
          success: true,
          startTimeISO: expect.any(String),
          endTimeISO: expect.any(String),
          durationMs: expect.any(Number),
          signal: null,
          metadata: {
            name: "test-script name 3",
          },
        },
      ],
    });
  });
});
