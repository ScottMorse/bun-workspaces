import { expect, test, describe } from "bun:test";
import { createFileSystemProject, PROJECT_ERRORS } from "../src/project";
import { getProjectRoot } from "./testProjects";

describe("Test FileSystemProject", () => {
  test("runWorkspaceScript: simple success", async () => {
    const project = createFileSystemProject({
      rootDirectory: getProjectRoot("default"),
    });

    const { output, exit } = project.runWorkspaceScript({
      workspaceNameOrAlias: "application-a",
      scriptName: "a-workspaces",
    });

    for await (const { text, textAnsiSanitized, streamName } of output) {
      expect(text).toMatch("script for a workspaces");
      expect(textAnsiSanitized).toMatch("script for a workspaces");
      expect(streamName).toBe("stdout");
    }

    const exitResult = await exit;

    expect(exitResult).toEqual({
      exitCode: 0,
      success: true,
      startTimeISO: expect.any(String),
      endTimeISO: expect.any(String),
      durationMs: expect.any(Number),
      signal: null,
      metadata: {
        workspace: {
          name: "application-a",
          path: "applications/applicationA",
          matchPattern: "applications/*",
          scripts: ["a-workspaces", "all-workspaces", "application-a"],
          aliases: [],
        },
      },
    });
  });

  test("runWorkspaceScript: using workspace alias", async () => {
    const project = createFileSystemProject({
      rootDirectory: getProjectRoot("workspaceConfigPackageOnly"),
    });

    const { output, exit } = project.runWorkspaceScript({
      workspaceNameOrAlias: "appA",
      scriptName: "a-workspaces",
    });

    for await (const { text, textAnsiSanitized, streamName } of output) {
      expect(text).toMatch("script for a workspaces");
      expect(textAnsiSanitized).toMatch("script for a workspaces");
      expect(streamName).toBe("stdout");
    }

    const exitResult = await exit;

    expect(exitResult).toEqual({
      exitCode: 0,
      success: true,
      startTimeISO: expect.any(String),
      endTimeISO: expect.any(String),
      durationMs: expect.any(Number),
      signal: null,
      metadata: {
        workspace: {
          name: "application-1a",
          path: "applications/application-a",
          matchPattern: "applications/*",
          scripts: ["a-workspaces", "all-workspaces", "application-a"],
          aliases: ["appA"],
        },
      },
    });
  });

  test("runWorkspaceScript: invalid workspace", async () => {
    const project = createFileSystemProject({
      rootDirectory: getProjectRoot("default"),
    });

    try {
      project.runWorkspaceScript({
        workspaceNameOrAlias: "invalid-workspace",
        scriptName: "a-workspaces",
      });
    } catch (error) {
      expect(error).toBeInstanceOf(PROJECT_ERRORS.ProjectWorkspaceNotFound);
    }
  });

  test("runWorkspaceScript: expected output", async () => {
    const project = createFileSystemProject({
      rootDirectory: getProjectRoot("runScriptWithMixedOutput"),
    });

    const { output, exit } = project.runWorkspaceScript({
      workspaceNameOrAlias: "fail1",
      scriptName: "test-exit",
    });

    const expectedOutput = [
      {
        text: "fail1 stdout 1",
        textAnsiSanitized: "fail1 stdout 1",
        streamName: "stdout",
      },
      {
        text: "fail1 stderr 1",
        textAnsiSanitized: "fail1 stderr 1",
        streamName: "stderr",
      },
      {
        text: "fail1 stdout 2",
        textAnsiSanitized: "fail1 stdout 2",
        streamName: "stdout",
      },
    ] as const;

    let i = 0;
    for await (const { text, textAnsiSanitized, streamName } of output) {
      const expected = expectedOutput[i];
      expect(text).toMatch(expected.text);
      expect(textAnsiSanitized).toMatch(expected.textAnsiSanitized);
      expect(streamName).toBe(expected.streamName);
      i++;
    }

    const exitResult = await exit;
    expect(exitResult).toEqual({
      exitCode: 1,
      success: false,
      startTimeISO: expect.any(String),
      endTimeISO: expect.any(String),
      durationMs: expect.any(Number),
      signal: null,
      metadata: {
        workspace: {
          name: "fail1",
          path: "packages/fail1",
          matchPattern: "packages/**/*",
          scripts: ["test-exit"],
          aliases: [],
        },
      },
    });
  });

  test("runScriptAcrossWorkspaces: simple success", async () => {
    const project = createFileSystemProject({
      rootDirectory: getProjectRoot("default"),
    });

    const { output, completion } = project.runScriptAcrossWorkspaces({
      workspacePatterns: ["library-b"],
      script: "b-workspaces",
    });

    for await (const { outputChunk, scriptMetadata } of output) {
      expect(outputChunk.text).toMatch("script for b workspaces");
      expect(outputChunk.textAnsiSanitized).toMatch("script for b workspaces");
      expect(outputChunk.streamName).toBe("stdout");
      expect(scriptMetadata.workspace).toEqual({
        name: "library-b",
        path: "libraries/libraryB",
        matchPattern: "libraries/**/*",
        scripts: ["all-workspaces", "b-workspaces", "library-b"],
        aliases: [],
      });
    }

    const completionResult = await completion;
    expect(completionResult).toEqual({
      totalCount: 1,
      successCount: 1,
      failureCount: 0,
      allSuccess: true,
      startTimeISO: expect.any(String),
      endTimeISO: expect.any(String),
      durationMs: expect.any(Number),
      scriptDetails: [
        {
          exitCode: 0,
          success: true,
          startTimeISO: expect.any(String),
          endTimeISO: expect.any(String),
          durationMs: expect.any(Number),
          signal: null,
          metadata: {
            workspace: {
              name: "library-b",
              path: "libraries/libraryB",
              matchPattern: "libraries/**/*",
              scripts: ["all-workspaces", "b-workspaces", "library-b"],
              aliases: [],
            },
          },
        },
      ],
    });
  });

  test("runScriptAcrossWorkspaces: some workspaces", async () => {
    const project = createFileSystemProject({
      rootDirectory: getProjectRoot("simple1"),
    });

    const { output, completion } = project.runScriptAcrossWorkspaces({
      workspacePatterns: ["application-1b", "library*"],
      script: "b-workspaces",
    });

    const expectedOutput = [
      {
        outputChunk: {
          streamName: "stdout" as const,
          text: "script for b workspaces\n",
          textAnsiSanitized: "script for b workspaces\n",
        },
        scriptMetadata: {
          workspace: {
            name: "application-1b",
            matchPattern: "applications/*",
            path: "applications/applicationB",
            scripts: ["all-workspaces", "application-b", "b-workspaces"],
            aliases: [],
          },
        },
      },
      {
        outputChunk: {
          streamName: "stdout" as const,
          text: "script for b workspaces\n",
          textAnsiSanitized: "script for b workspaces\n",
        },
        scriptMetadata: {
          workspace: {
            name: "library-1b",
            matchPattern: "libraries/*",
            path: "libraries/libraryB",
            scripts: ["all-workspaces", "b-workspaces", "library-b"],
            aliases: [],
          },
        },
      },
    ];

    const outputChunks = [];
    for await (const chunk of output) {
      outputChunks.push(chunk);
    }

    expect(outputChunks).toEqual(expectedOutput);

    const completionResult = await completion;
    expect(completionResult).toEqual({
      totalCount: 2,
      successCount: 2,
      failureCount: 0,
      allSuccess: true,
      startTimeISO: expect.any(String),
      endTimeISO: expect.any(String),
      durationMs: expect.any(Number),
      scriptDetails: [
        {
          exitCode: 0,
          success: true,
          startTimeISO: expect.any(String),
          endTimeISO: expect.any(String),
          durationMs: expect.any(Number),
          signal: null,
          metadata: {
            workspace: {
              name: "application-1b",
              matchPattern: "applications/*",
              path: "applications/applicationB",
              scripts: ["all-workspaces", "application-b", "b-workspaces"],
              aliases: [],
            },
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
            workspace: {
              name: "library-1b",
              matchPattern: "libraries/*",
              path: "libraries/libraryB",
              scripts: ["all-workspaces", "b-workspaces", "library-b"],
              aliases: [],
            },
          },
        },
      ],
    });
  });

  test("runScriptAcrossWorkspaces: no workspaces", async () => {
    const project = createFileSystemProject({
      rootDirectory: getProjectRoot("simple1"),
    });

    const { output, completion } = project.runScriptAcrossWorkspaces({
      workspacePatterns: [],
      script: "all-workspaces",
    });

    let count = 0;
    for await (const _ of output) {
      count++;
    }

    expect(count).toBe(0);

    const completionResult = await completion;

    expect(completionResult).toEqual({
      totalCount: 0,
      successCount: 0,
      failureCount: 0,
      allSuccess: true,
      startTimeISO: expect.any(String),
      endTimeISO: expect.any(String),
      durationMs: expect.any(Number),
      scriptDetails: [],
    });
  });

  test("runScriptAcrossWorkspaces: all workspaces", async () => {
    const project = createFileSystemProject({
      rootDirectory: getProjectRoot("simple1"),
    });

    const { output, completion } = project.runScriptAcrossWorkspaces({
      workspacePatterns: ["*"],
      script: "all-workspaces",
    });

    const expectedOutput = [
      {
        outputChunk: {
          streamName: "stdout" as const,
          text: "script for all workspaces\n",
          textAnsiSanitized: "script for all workspaces\n",
        },
        scriptMetadata: {
          workspace: {
            name: "application-1a",
            matchPattern: "applications/*",
            path: "applications/applicationA",
            scripts: ["a-workspaces", "all-workspaces", "application-a"],
            aliases: [],
          },
        },
      },
      {
        outputChunk: {
          streamName: "stdout" as const,
          text: "script for all workspaces\n",
          textAnsiSanitized: "script for all workspaces\n",
        },
        scriptMetadata: {
          workspace: {
            name: "application-1b",
            matchPattern: "applications/*",
            path: "applications/applicationB",
            scripts: ["all-workspaces", "application-b", "b-workspaces"],
            aliases: [],
          },
        },
      },
      {
        outputChunk: {
          streamName: "stdout" as const,
          text: "script for all workspaces\n",
          textAnsiSanitized: "script for all workspaces\n",
        },
        scriptMetadata: {
          workspace: {
            name: "library-1a",
            matchPattern: "libraries/*",
            path: "libraries/libraryA",
            scripts: ["a-workspaces", "all-workspaces", "library-a"],
            aliases: [],
          },
        },
      },
      {
        outputChunk: {
          streamName: "stdout" as const,
          text: "script for all workspaces\n",
          textAnsiSanitized: "script for all workspaces\n",
        },
        scriptMetadata: {
          workspace: {
            name: "library-1b",
            matchPattern: "libraries/*",
            path: "libraries/libraryB",
            scripts: ["all-workspaces", "b-workspaces", "library-b"],
            aliases: [],
          },
        },
      },
    ];

    const outputChunks = [];
    for await (const chunk of output) {
      outputChunks.push(chunk);
    }

    expect(outputChunks).toEqual(expectedOutput);

    const completionResult = await completion;

    expect(completionResult).toEqual({
      totalCount: 4,
      successCount: 4,
      failureCount: 0,
      allSuccess: true,
      startTimeISO: expect.any(String),
      endTimeISO: expect.any(String),
      durationMs: expect.any(Number),
      scriptDetails: [
        {
          exitCode: 0,
          signal: null,
          success: true,
          startTimeISO: expect.any(String),
          endTimeISO: expect.any(String),
          durationMs: expect.any(Number),
          metadata: {
            workspace: {
              name: "application-1a",
              matchPattern: "applications/*",
              path: "applications/applicationA",
              scripts: ["a-workspaces", "all-workspaces", "application-a"],
              aliases: [],
            },
          },
        },
        {
          exitCode: 0,
          signal: null,
          success: true,
          startTimeISO: expect.any(String),
          endTimeISO: expect.any(String),
          durationMs: expect.any(Number),
          metadata: {
            workspace: {
              name: "application-1b",
              matchPattern: "applications/*",
              path: "applications/applicationB",
              scripts: ["all-workspaces", "application-b", "b-workspaces"],
              aliases: [],
            },
          },
        },
        {
          exitCode: 0,
          signal: null,
          success: true,
          startTimeISO: expect.any(String),
          endTimeISO: expect.any(String),
          durationMs: expect.any(Number),
          metadata: {
            workspace: {
              name: "library-1a",
              matchPattern: "libraries/*",
              path: "libraries/libraryA",
              scripts: ["a-workspaces", "all-workspaces", "library-a"],
              aliases: [],
            },
          },
        },
        {
          exitCode: 0,
          signal: null,
          success: true,
          startTimeISO: expect.any(String),
          endTimeISO: expect.any(String),
          durationMs: expect.any(Number),
          metadata: {
            workspace: {
              name: "library-1b",
              matchPattern: "libraries/*",
              path: "libraries/libraryB",
              scripts: ["all-workspaces", "b-workspaces", "library-b"],
              aliases: [],
            },
          },
        },
      ],
    });
  });

  test("runScriptAcrossWorkspaces: with args", async () => {
    const project = createFileSystemProject({
      rootDirectory: getProjectRoot("runScriptWithEchoArgs"),
    });

    const { output } = project.runScriptAcrossWorkspaces({
      workspacePatterns: ["application-*"],
      script: "test-echo",
      args: "--arg1=value1 --arg2=value2",
    });

    const expectedOutput = [
      {
        outputChunk: {
          streamName: "stdout" as const,
          text: "passed args: --arg1=value1 --arg2=value2\n",
          textAnsiSanitized: "passed args: --arg1=value1 --arg2=value2\n",
        },
        scriptMetadata: {
          workspace: {
            name: "application-1a",
            matchPattern: "applications/*",
            path: "applications/applicationA",
            scripts: ["test-echo"],
            aliases: [],
          },
        },
      },
      {
        outputChunk: {
          streamName: "stdout" as const,
          text: "passed args: --arg1=value1 --arg2=value2\n",
          textAnsiSanitized: "passed args: --arg1=value1 --arg2=value2\n",
        },
        scriptMetadata: {
          workspace: {
            name: "application-1b",
            matchPattern: "applications/*",
            path: "applications/applicationB",
            scripts: ["test-echo"],
            aliases: [],
          },
        },
      },
    ];

    const outputChunks = [];
    for await (const chunk of output) {
      outputChunks.push(chunk);
    }

    expect(outputChunks).toEqual(expectedOutput);
  });

  test("runScriptAcrossWorkspaces: with failures", async () => {
    const project = createFileSystemProject({
      rootDirectory: getProjectRoot("runScriptWithFailures"),
    });

    const { output, completion } = project.runScriptAcrossWorkspaces({
      workspacePatterns: ["*"],
      script: "test-exit",
    });

    const expectedOutput = [
      {
        outputChunk: {
          streamName: "stderr" as const,
          text: "fail1\n",
          textAnsiSanitized: "fail1\n",
        },
        scriptMetadata: {
          workspace: {
            name: "fail1",
            matchPattern: "packages/**/*",
            path: "packages/fail1",
            scripts: ["test-exit"],
            aliases: [],
          },
        },
      },
      {
        outputChunk: {
          streamName: "stderr" as const,
          text: "fail2\n",
          textAnsiSanitized: "fail2\n",
        },
        scriptMetadata: {
          workspace: {
            name: "fail2",
            matchPattern: "packages/**/*",
            path: "packages/fail2",
            scripts: ["test-exit"],
            aliases: [],
          },
        },
      },
      {
        outputChunk: {
          streamName: "stdout" as const,
          text: "success1\n",
          textAnsiSanitized: "success1\n",
        },
        scriptMetadata: {
          workspace: {
            name: "success1",
            matchPattern: "packages/**/*",
            path: "packages/success1",
            scripts: ["test-exit"],
            aliases: [],
          },
        },
      },
      {
        outputChunk: {
          streamName: "stdout" as const,
          text: "success2\n",
          textAnsiSanitized: "success2\n",
        },
        scriptMetadata: {
          workspace: {
            name: "success2",
            matchPattern: "packages/**/*",
            path: "packages/success2",
            scripts: ["test-exit"],
            aliases: [],
          },
        },
      },
    ];

    const outputChunks = [];
    for await (const chunk of output) {
      outputChunks.push(chunk);
    }

    expect(outputChunks).toEqual(expectedOutput);

    const completionResult = await completion;

    expect(completionResult).toEqual({
      totalCount: 4,
      successCount: 2,
      failureCount: 2,
      allSuccess: false,
      startTimeISO: expect.any(String),
      endTimeISO: expect.any(String),
      durationMs: expect.any(Number),
      scriptDetails: [
        {
          exitCode: 1,
          signal: null,
          success: false,
          startTimeISO: expect.any(String),
          endTimeISO: expect.any(String),
          durationMs: expect.any(Number),
          metadata: {
            workspace: {
              name: "fail1",
              matchPattern: "packages/**/*",
              path: "packages/fail1",
              scripts: ["test-exit"],
              aliases: [],
            },
          },
        },
        {
          exitCode: 2,
          signal: null,
          success: false,
          startTimeISO: expect.any(String),
          endTimeISO: expect.any(String),
          durationMs: expect.any(Number),
          metadata: {
            workspace: {
              name: "fail2",
              matchPattern: "packages/**/*",
              path: "packages/fail2",
              scripts: ["test-exit"],
              aliases: [],
            },
          },
        },
        {
          exitCode: 0,
          signal: null,
          success: true,
          startTimeISO: expect.any(String),
          endTimeISO: expect.any(String),
          durationMs: expect.any(Number),
          metadata: {
            workspace: {
              name: "success1",
              matchPattern: "packages/**/*",
              path: "packages/success1",
              scripts: ["test-exit"],
              aliases: [],
            },
          },
        },
        {
          exitCode: 0,
          signal: null,
          success: true,
          startTimeISO: expect.any(String),
          endTimeISO: expect.any(String),
          durationMs: expect.any(Number),
          metadata: {
            workspace: {
              name: "success2",
              matchPattern: "packages/**/*",
              path: "packages/success2",
              scripts: ["test-exit"],
              aliases: [],
            },
          },
        },
      ],
    });
  });

  test("runScriptAcrossWorkspaces: parallel", async () => {
    const project = createFileSystemProject({
      rootDirectory: getProjectRoot("runScriptWithDelays"),
    });

    const { output, completion } = project.runScriptAcrossWorkspaces({
      workspacePatterns: ["*"],
      script: "test-delay",
      parallel: true,
    });

    const expectedOutput = [
      {
        outputChunk: {
          streamName: "stdout" as const,
          text: "first\n",
          textAnsiSanitized: "first\n",
        },
        scriptMetadata: {
          workspace: {
            name: "first",
            matchPattern: "packages/**/*",
            path: "packages/first",
            scripts: ["test-delay"],
            aliases: [],
          },
        },
      },
      {
        outputChunk: {
          streamName: "stdout" as const,
          text: "second\n",
          textAnsiSanitized: "second\n",
        },
        scriptMetadata: {
          workspace: {
            name: "second",
            matchPattern: "packages/**/*",
            path: "packages/second",
            scripts: ["test-delay"],
            aliases: [],
          },
        },
      },
      {
        outputChunk: {
          streamName: "stdout" as const,
          text: "third\n",
          textAnsiSanitized: "third\n",
        },
        scriptMetadata: {
          workspace: {
            name: "third",
            matchPattern: "packages/**/*",
            path: "packages/third",
            scripts: ["test-delay"],
            aliases: [],
          },
        },
      },
      {
        outputChunk: {
          streamName: "stdout" as const,
          text: "fourth\n",
          textAnsiSanitized: "fourth\n",
        },
        scriptMetadata: {
          workspace: {
            name: "fourth",
            matchPattern: "packages/**/*",
            path: "packages/fourth",
            scripts: ["test-delay"],
            aliases: [],
          },
        },
      },
      {
        outputChunk: {
          streamName: "stdout" as const,
          text: "fifth\n",
          textAnsiSanitized: "fifth\n",
        },
        scriptMetadata: {
          workspace: {
            name: "fifth",
            matchPattern: "packages/**/*",
            path: "packages/fifth",
            scripts: ["test-delay"],
            aliases: [],
          },
        },
      },
    ];

    const outputChunks = [];
    for await (const chunk of output) {
      outputChunks.push(chunk);
    }

    expect(outputChunks).toEqual(expectedOutput);

    const completionResult = await completion;

    expect(completionResult.durationMs).toBeGreaterThan(1000);
    expect(completionResult.durationMs).toBeLessThan(1100);

    expect(completionResult).toEqual({
      totalCount: 5,
      successCount: 5,
      failureCount: 0,
      allSuccess: true,
      startTimeISO: expect.any(String),
      endTimeISO: expect.any(String),
      durationMs: expect.any(Number),
      scriptDetails: [
        {
          exitCode: 0,
          signal: null,
          success: true,
          startTimeISO: expect.any(String),
          endTimeISO: expect.any(String),
          durationMs: expect.any(Number),
          metadata: {
            workspace: {
              name: "fifth",
              matchPattern: "packages/**/*",
              path: "packages/fifth",
              scripts: ["test-delay"],
              aliases: [],
            },
          },
        },
        {
          exitCode: 0,
          signal: null,
          success: true,
          startTimeISO: expect.any(String),
          endTimeISO: expect.any(String),
          durationMs: expect.any(Number),
          metadata: {
            workspace: {
              name: "first",
              matchPattern: "packages/**/*",
              path: "packages/first",
              scripts: ["test-delay"],
              aliases: [],
            },
          },
        },
        {
          exitCode: 0,
          signal: null,
          success: true,
          startTimeISO: expect.any(String),
          endTimeISO: expect.any(String),
          durationMs: expect.any(Number),
          metadata: {
            workspace: {
              name: "fourth",
              matchPattern: "packages/**/*",
              path: "packages/fourth",
              scripts: ["test-delay"],
              aliases: [],
            },
          },
        },
        {
          exitCode: 0,
          signal: null,
          success: true,
          startTimeISO: expect.any(String),
          endTimeISO: expect.any(String),
          durationMs: expect.any(Number),
          metadata: {
            workspace: {
              name: "second",
              matchPattern: "packages/**/*",
              path: "packages/second",
              scripts: ["test-delay"],
              aliases: [],
            },
          },
        },
        {
          exitCode: 0,
          signal: null,
          success: true,
          startTimeISO: expect.any(String),
          endTimeISO: expect.any(String),
          durationMs: expect.any(Number),
          metadata: {
            workspace: {
              name: "third",
              matchPattern: "packages/**/*",
              path: "packages/third",
              scripts: ["test-delay"],
              aliases: [],
            },
          },
        },
      ],
    });
  });
});
