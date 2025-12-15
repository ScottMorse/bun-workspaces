import { availableParallelism } from "node:os";
import { expect, test, describe } from "bun:test";
import { getUserEnvVar } from "../src/config/userEnvVars";
import { createFileSystemProject, PROJECT_ERRORS } from "../src/project";
import { getProjectRoot } from "./testProjects";

describe("Test FileSystemProject", () => {
  test("runWorkspaceScript: simple success", async () => {
    const project = createFileSystemProject({
      rootDirectory: getProjectRoot("default"),
    });

    const { output, exit } = project.runWorkspaceScript({
      workspaceNameOrAlias: "application-a",
      script: "a-workspaces",
    });

    for await (const chunk of output) {
      expect(chunk.decode()).toMatch("script for a workspaces");
      expect(chunk.decode({ stripAnsi: true })).toMatch(
        "script for a workspaces",
      );
      expect(chunk.streamName).toBe("stdout");
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
      script: "a-workspaces",
    });

    for await (const chunk of output) {
      expect(chunk.decode()).toMatch("script for a workspaces");
      expect(chunk.decode({ stripAnsi: true })).toMatch(
        "script for a workspaces",
      );
      expect(chunk.streamName).toBe("stdout");
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
        script: "a-workspaces",
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
      script: "test-exit",
    });

    const expectedOutput = [
      {
        text: "fail1 stdout 1",
        textNoAnsi: "fail1 stdout 1",
        streamName: "stdout",
      },
      {
        text: "fail1 stderr 1",
        textNoAnsi: "fail1 stderr 1",
        streamName: "stderr",
      },
      {
        text: "fail1 stdout 2",
        textNoAnsi: "fail1 stdout 2",
        streamName: "stdout",
      },
    ] as const;

    let i = 0;
    for await (const chunk of output) {
      const expected = expectedOutput[i];
      expect(chunk.decode()).toMatch(expected.text);
      expect(chunk.decode({ stripAnsi: true })).toMatch(expected.textNoAnsi);
      expect(chunk.streamName).toBe(expected.streamName);
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

  test("runWorkspaceScript: runtime metadata", async () => {
    const project = createFileSystemProject({
      rootDirectory: getProjectRoot("runScriptWithRuntimeMetadataDebug"),
    });

    const plainResult = project.runWorkspaceScript({
      workspaceNameOrAlias: "application-a",
      script: "test-echo",
    });

    for await (const chunk of plainResult.output) {
      expect(chunk.decode()).toBe(
        `${project.rootDirectory} test-root application-a ${project.rootDirectory}/applications/application-a applications/application-a test-echo\n`,
      );
      expect(chunk.decode({ stripAnsi: true })).toBe(
        `${project.rootDirectory} test-root application-a ${project.rootDirectory}/applications/application-a applications/application-a test-echo\n`,
      );
      expect(chunk.streamName).toBe("stdout");
    }

    const argsResult = project.runWorkspaceScript({
      workspaceNameOrAlias: "application-a",
      script: "test-echo",
      args: "--arg1=<projectPath> --arg2=<projectName> --arg3=<workspaceName> --arg4=<workspacePath> --arg5=<workspaceRelativePath> --arg6=<scriptName>",
    });

    for await (const chunk of argsResult.output) {
      expect(chunk.decode()).toBe(
        `${project.rootDirectory} test-root application-a ${project.rootDirectory}/applications/application-a applications/application-a test-echo --arg1=${project.rootDirectory} --arg2=test-root --arg3=application-a --arg4=${project.rootDirectory}/applications/application-a --arg5=applications/application-a --arg6=test-echo\n`,
      );
      expect(chunk.decode({ stripAnsi: true })).toBe(
        `${project.rootDirectory} test-root application-a ${project.rootDirectory}/applications/application-a applications/application-a test-echo --arg1=${project.rootDirectory} --arg2=test-root --arg3=application-a --arg4=${project.rootDirectory}/applications/application-a --arg5=applications/application-a --arg6=test-echo\n`,
      );
      expect(chunk.streamName).toBe("stdout");
    }
  });

  test("runWorkspaceScript: runtime metadata (inline)", async () => {
    const project = createFileSystemProject({
      rootDirectory: getProjectRoot("runScriptWithRuntimeMetadataDebug"),
    });

    const anonymousScriptResult = project.runWorkspaceScript({
      workspaceNameOrAlias: "application-a",
      script:
        "echo '<projectPath> <projectName> <workspaceName> <workspacePath> <workspaceRelativePath> <scriptName>'",
      inline: true,
    });

    for await (const chunk of anonymousScriptResult.output) {
      expect(chunk.decode()).toBe(
        `${project.rootDirectory} test-root application-a ${project.rootDirectory}/applications/application-a applications/application-a \n`,
      );
      expect(chunk.decode({ stripAnsi: true })).toBe(
        `${project.rootDirectory} test-root application-a ${project.rootDirectory}/applications/application-a applications/application-a \n`,
      );
      expect(chunk.streamName).toBe("stdout");
    }

    const namedScriptResult = project.runWorkspaceScript({
      workspaceNameOrAlias: "application-a",
      script:
        "echo '<projectPath> <projectName> <workspaceName> <workspacePath> <workspaceRelativePath> <scriptName>'",
      inline: { scriptName: "my-named-script" },
    });

    for await (const chunk of namedScriptResult.output) {
      expect(chunk.decode()).toBe(
        `${project.rootDirectory} test-root application-a ${project.rootDirectory}/applications/application-a applications/application-a my-named-script\n`,
      );
      expect(chunk.decode({ stripAnsi: true })).toBe(
        `${project.rootDirectory} test-root application-a ${project.rootDirectory}/applications/application-a applications/application-a my-named-script\n`,
      );
      expect(chunk.streamName).toBe("stdout");
    }
  });

  test("runScriptAcrossWorkspaces: simple success", async () => {
    const project = createFileSystemProject({
      rootDirectory: getProjectRoot("default"),
    });

    const { output, summary } = project.runScriptAcrossWorkspaces({
      workspacePatterns: ["library-b"],
      script: "b-workspaces",
    });

    for await (const { outputChunk, scriptMetadata } of output) {
      expect(outputChunk.decode()).toMatch("script for b workspaces");
      expect(outputChunk.decode({ stripAnsi: true })).toMatch(
        "script for b workspaces",
      );
      expect(outputChunk.streamName).toBe("stdout");
      expect(scriptMetadata.workspace).toEqual({
        name: "library-b",
        path: "libraries/libraryB",
        matchPattern: "libraries/**/*",
        scripts: ["all-workspaces", "b-workspaces", "library-b"],
        aliases: [],
      });
    }

    const summaryResult = await summary;
    expect(summaryResult).toEqual({
      totalCount: 1,
      successCount: 1,
      failureCount: 0,
      allSuccess: true,
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

    const { output, summary } = project.runScriptAcrossWorkspaces({
      workspacePatterns: ["application-1b", "library*"],
      script: "b-workspaces",
    });

    const expectedOutput = [
      {
        outputChunk: {
          streamName: "stdout" as const,
          text: "script for b workspaces\n",
          textNoAnsi: "script for b workspaces\n",
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
          textNoAnsi: "script for b workspaces\n",
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

    let i = 0;
    for await (const { outputChunk } of output) {
      expect(outputChunk.decode()).toBe(expectedOutput[i].outputChunk.text);
      expect(outputChunk.decode({ stripAnsi: true })).toBe(
        expectedOutput[i].outputChunk.textNoAnsi,
      );
      expect(outputChunk.streamName).toBe(
        expectedOutput[i].outputChunk.streamName,
      );
      i++;
    }

    const summaryResult = await summary;
    expect(summaryResult).toEqual({
      totalCount: 2,
      successCount: 2,
      failureCount: 0,
      allSuccess: true,
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

    const { output, summary } = project.runScriptAcrossWorkspaces({
      workspacePatterns: [],
      script: "all-workspaces",
    });

    let count = 0;
    for await (const _ of output) {
      count++;
    }

    expect(count).toBe(0);

    const summaryResult = await summary;

    expect(summaryResult).toEqual({
      totalCount: 0,
      successCount: 0,
      failureCount: 0,
      allSuccess: true,
      startTimeISO: expect.any(String),
      endTimeISO: expect.any(String),
      durationMs: expect.any(Number),
      scriptResults: [],
    });
  });

  test("runScriptAcrossWorkspaces: all workspaces", async () => {
    const project = createFileSystemProject({
      rootDirectory: getProjectRoot("simple1"),
    });

    const { output, summary } = project.runScriptAcrossWorkspaces({
      workspacePatterns: ["*"],
      script: "all-workspaces",
    });

    const expectedOutput = [
      {
        outputChunk: {
          streamName: "stdout" as const,
          text: "script for all workspaces\n",
          textNoAnsi: "script for all workspaces\n",
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
          textNoAnsi: "script for all workspaces\n",
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
          textNoAnsi: "script for all workspaces\n",
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
          textNoAnsi: "script for all workspaces\n",
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

    let i = 0;
    for await (const { outputChunk } of output) {
      expect(outputChunk.decode()).toBe(expectedOutput[i].outputChunk.text);
      expect(outputChunk.decode({ stripAnsi: true })).toBe(
        expectedOutput[i].outputChunk.textNoAnsi,
      );
      expect(outputChunk.streamName).toBe(
        expectedOutput[i].outputChunk.streamName,
      );
      i++;
    }

    const summaryResult = await summary;

    expect(summaryResult).toEqual({
      totalCount: 4,
      successCount: 4,
      failureCount: 0,
      allSuccess: true,
      startTimeISO: expect.any(String),
      endTimeISO: expect.any(String),
      durationMs: expect.any(Number),
      scriptResults: [
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
          textNoAnsi: "passed args: --arg1=value1 --arg2=value2\n",
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
          textNoAnsi: "passed args: --arg1=value1 --arg2=value2\n",
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

    let i = 0;
    for await (const { outputChunk } of output) {
      expect(outputChunk.decode()).toBe(expectedOutput[i].outputChunk.text);
      expect(outputChunk.decode({ stripAnsi: true })).toBe(
        expectedOutput[i].outputChunk.textNoAnsi,
      );
      expect(outputChunk.streamName).toBe(
        expectedOutput[i].outputChunk.streamName,
      );
      i++;
    }
  });

  test("runScriptAcrossWorkspaces: runtime metadata", async () => {
    const project = createFileSystemProject({
      rootDirectory: getProjectRoot("runScriptWithRuntimeMetadataDebug"),
    });

    const plainResult = project.runScriptAcrossWorkspaces({
      workspacePatterns: ["application-*"],
      script: "test-echo",
    });

    let i = 0;
    for await (const { outputChunk: chunk } of plainResult.output) {
      const appLetter = i === 0 ? "a" : "b";
      expect(chunk.decode()).toBe(
        `${project.rootDirectory} test-root application-${appLetter} ${project.rootDirectory}/applications/application-${appLetter} applications/application-${appLetter} test-echo\n`,
      );
      expect(chunk.decode({ stripAnsi: true })).toBe(
        `${project.rootDirectory} test-root application-${appLetter} ${project.rootDirectory}/applications/application-${appLetter} applications/application-${appLetter} test-echo\n`,
      );
      expect(chunk.streamName).toBe("stdout");
      i++;
    }

    const argsResult = project.runScriptAcrossWorkspaces({
      workspacePatterns: ["application-*"],
      script: "test-echo",
      args: "--arg1=<projectPath> --arg2=<projectName> --arg3=<workspaceName> --arg4=<workspacePath> --arg5=<workspaceRelativePath> --arg6=<scriptName>",
    });

    let j = 0;
    for await (const { outputChunk: chunk } of argsResult.output) {
      const appLetter = j === 0 ? "a" : "b";
      expect(chunk.decode()).toBe(
        `${project.rootDirectory} test-root application-${appLetter} ${project.rootDirectory}/applications/application-${appLetter} applications/application-${appLetter} test-echo --arg1=${project.rootDirectory} --arg2=test-root --arg3=application-${appLetter} --arg4=${project.rootDirectory}/applications/application-${appLetter} --arg5=applications/application-${appLetter} --arg6=test-echo\n`,
      );
      expect(chunk.decode({ stripAnsi: true })).toBe(
        `${project.rootDirectory} test-root application-${appLetter} ${project.rootDirectory}/applications/application-${appLetter} applications/application-${appLetter} test-echo --arg1=${project.rootDirectory} --arg2=test-root --arg3=application-${appLetter} --arg4=${project.rootDirectory}/applications/application-${appLetter} --arg5=applications/application-${appLetter} --arg6=test-echo\n`,
      );
      expect(chunk.streamName).toBe("stdout");
      j++;
    }
  });

  test("runScriptAcrossWorkspaces: runtime metadata (inline)", async () => {
    const project = createFileSystemProject({
      rootDirectory: getProjectRoot("runScriptWithRuntimeMetadataDebug"),
    });

    const anonymousScriptResult = project.runScriptAcrossWorkspaces({
      workspacePatterns: ["application-*"],
      script:
        "echo '<projectPath> <workspaceName> <workspacePath> <workspaceRelativePath> <scriptName>'",
      inline: true,
    });

    let k = 0;
    for await (const { outputChunk: chunk } of anonymousScriptResult.output) {
      const appLetter = k === 0 ? "a" : "b";
      expect(chunk.decode()).toBe(
        `${project.rootDirectory} application-${appLetter} ${project.rootDirectory}/applications/application-${appLetter} applications/application-${appLetter} \n`,
      );
      expect(chunk.decode({ stripAnsi: true })).toBe(
        `${project.rootDirectory} application-${appLetter} ${project.rootDirectory}/applications/application-${appLetter} applications/application-${appLetter} \n`,
      );
      expect(chunk.streamName).toBe("stdout");
      k++;
    }

    const namedScriptResult = project.runScriptAcrossWorkspaces({
      workspacePatterns: ["application-*"],
      script:
        "echo '<projectPath> <workspaceName> <workspacePath> <workspaceRelativePath> <scriptName>'",
      inline: { scriptName: "my-named-script" },
    });

    let l = 0;
    for await (const { outputChunk: chunk } of namedScriptResult.output) {
      const appLetter = l === 0 ? "a" : "b";

      expect(chunk.decode()).toBe(
        `${project.rootDirectory} application-${appLetter} ${project.rootDirectory}/applications/application-${appLetter} applications/application-${appLetter} my-named-script\n`,
      );
      expect(chunk.decode({ stripAnsi: true })).toBe(
        `${project.rootDirectory} application-${appLetter} ${project.rootDirectory}/applications/application-${appLetter} applications/application-${appLetter} my-named-script\n`,
      );
      expect(chunk.streamName).toBe("stdout");
      l++;
    }
  });

  test("Inline script env var metadata", async () => {
    const project = createFileSystemProject({
      rootDirectory: getProjectRoot("default"),
    });

    const singleResult = project.runWorkspaceScript({
      workspaceNameOrAlias: "application-a",
      script: "bun run <projectPath>/../testScriptMetadataEnv.ts",
      inline: { scriptName: "test-script-metadata-env" },
    });

    let output = "";
    for await (const chunk of singleResult.output) {
      output += chunk.decode();
    }

    expect(output).toBe(`${project.rootDirectory}
test-root
application-a
${project.rootDirectory}/applications/applicationA
applications/applicationA
test-script-metadata-env
`);

    const multiResult = project.runScriptAcrossWorkspaces({
      workspacePatterns: ["application-b"],
      script: "bun run <projectPath>/../testScriptMetadataEnv.ts",
      inline: { scriptName: "test-script-metadata-env-b" },
    });

    output = "";
    for await (const { outputChunk: chunk } of multiResult.output) {
      output += chunk.decode();
    }
    expect(output).toBe(`${project.rootDirectory}
test-root
application-b
${project.rootDirectory}/applications/applicationB
applications/applicationB
test-script-metadata-env-b
`);
  });

  test("runScriptAcrossWorkspaces: with failures", async () => {
    const project = createFileSystemProject({
      rootDirectory: getProjectRoot("runScriptWithFailures"),
    });

    const { output, summary } = project.runScriptAcrossWorkspaces({
      workspacePatterns: ["*"],
      script: "test-exit",
    });

    const expectedOutput = [
      {
        outputChunk: {
          streamName: "stderr" as const,
          text: "fail1\n",
          textNoAnsi: "fail1\n",
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
          textNoAnsi: "fail2\n",
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
          textNoAnsi: "success1\n",
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
          textNoAnsi: "success2\n",
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

    let i = 0;
    for await (const { outputChunk } of output) {
      expect(outputChunk.decode()).toBe(expectedOutput[i].outputChunk.text);
      expect(outputChunk.decode({ stripAnsi: true })).toBe(
        expectedOutput[i].outputChunk.textNoAnsi,
      );
      expect(outputChunk.streamName).toBe(
        expectedOutput[i].outputChunk.streamName,
      );
      i++;
    }

    const summaryResult = await summary;

    expect(summaryResult).toEqual({
      totalCount: 4,
      successCount: 2,
      failureCount: 2,
      allSuccess: false,
      startTimeISO: expect.any(String),
      endTimeISO: expect.any(String),
      durationMs: expect.any(Number),
      scriptResults: [
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

    const { output, summary } = project.runScriptAcrossWorkspaces({
      workspacePatterns: ["*"],
      script: "test-delay",
      parallel: true,
    });

    const expectedOutput = [
      {
        outputChunk: {
          streamName: "stdout" as const,
          text: "first\n",
          textNoAnsi: "first\n",
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
          textNoAnsi: "second\n",
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
          textNoAnsi: "third\n",
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
          textNoAnsi: "fourth\n",
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
          textNoAnsi: "fifth\n",
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

    let i = 0;
    for await (const { outputChunk } of output) {
      expect(outputChunk.decode()).toBe(expectedOutput[i].outputChunk.text);
      expect(outputChunk.decode({ stripAnsi: true })).toBe(
        expectedOutput[i].outputChunk.textNoAnsi,
      );
      expect(outputChunk.streamName).toBe(
        expectedOutput[i].outputChunk.streamName,
      );
      i++;
    }

    const summaryResult = await summary;

    expect(summaryResult.durationMs).toBeGreaterThan(1000);
    expect(summaryResult.durationMs).toBeLessThan(1500);

    expect(summaryResult).toEqual({
      totalCount: 5,
      successCount: 5,
      failureCount: 0,
      allSuccess: true,
      startTimeISO: expect.any(String),
      endTimeISO: expect.any(String),
      durationMs: expect.any(Number),
      scriptResults: [
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

  test.each([1, 2, 3, "default", "auto", "unbounded", "100%", "50%"])(
    "runScriptAcrossWorkspaces: parallel with max (%p)",
    async (max) => {
      const project = createFileSystemProject({
        rootDirectory: getProjectRoot("runScriptWithDebugParallelMax"),
      });

      const { output } = project.runScriptAcrossWorkspaces({
        workspacePatterns: ["*"],
        script: "test-debug",
        parallel: { max },
      });

      for await (const { outputChunk } of output) {
        const maxValue = outputChunk.decode().trim();
        if (typeof max === "number") {
          expect(maxValue).toBe(max.toString());
        } else if (max === "default") {
          expect(maxValue).toBe(
            getUserEnvVar("parallelMaxDefault")?.trim() ??
              availableParallelism().toString(),
          );
        } else if (max === "auto") {
          expect(maxValue).toBe(availableParallelism().toString());
        } else if (max === "unbounded") {
          expect(maxValue).toBe("Infinity");
        } else if (max.endsWith("%")) {
          expect(maxValue).toBe(
            Math.max(
              1,
              Math.floor(
                (availableParallelism() * parseFloat(max.slice(0, -1))) / 100,
              ),
            ).toString(),
          );
        }
      }
    },
  );
});
