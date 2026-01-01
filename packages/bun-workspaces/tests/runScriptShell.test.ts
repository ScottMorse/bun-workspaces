import { afterEach, describe, expect, test } from "bun:test";
import { createFileSystemProject } from "../src";
import { getUserEnvVarName } from "../src/config/userEnvVars";
import { IS_WINDOWS } from "../src/internal/runtime";
import { runScript } from "../src/runScript";
import { getProjectRoot } from "./testProjects/testProjects";
import { setupCliTest } from "./util/cliTestUtils";

const originalScriptShellDefault =
  process.env[getUserEnvVarName("scriptShellDefault")];

afterEach(() => {
  if (!originalScriptShellDefault) {
    delete process.env[getUserEnvVarName("scriptShellDefault")];
  } else {
    process.env[getUserEnvVarName("scriptShellDefault")] =
      originalScriptShellDefault;
  }
});

const OS_ONLY_COMMAND = IS_WINDOWS ? "exit /b 0" : "command : >/dev/null 2>&1";

describe("Test run script shell option", () => {
  test("Simple commands succeed in runScript", async () => {
    const bunResult = runScript({
      scriptCommand: {
        command: "echo $MY_VAR $_BW_SCRIPT_SHELL_OPTION",
        workingDirectory: process.cwd(),
      },
      metadata: {},
      env: { MY_VAR: "my test value" },
      shell: "bun",
    });

    for await (const chunk of bunResult.output) {
      expect(chunk.decode().trim()).toBe("my test value bun");
    }

    expect((await bunResult.exit).exitCode).toBe(0);

    const osResult = runScript({
      scriptCommand: {
        command: IS_WINDOWS
          ? `echo %MY_VAR% %_BW_SCRIPT_SHELL_OPTION%`
          : "echo $MY_VAR $_BW_SCRIPT_SHELL_OPTION",
        workingDirectory: process.cwd(),
      },
      metadata: {},
      env: { MY_VAR: "my test value" },
      shell: "system",
    });

    for await (const chunk of osResult.output) {
      expect(chunk.decode().trim()).toBe("my test value system");
    }

    expect((await osResult.exit).exitCode).toBe(0);
  });

  test("Command possible in system shell isn't in bun shell", async () => {
    const bunResult = runScript({
      scriptCommand: {
        command: OS_ONLY_COMMAND,
        workingDirectory: process.cwd(),
      },
      metadata: {},
      env: {},
      shell: "bun",
    });

    expect((await bunResult.exit).exitCode).toBe(1);

    const osResult = runScript({
      scriptCommand: {
        command: OS_ONLY_COMMAND,
        workingDirectory: process.cwd(),
      },
      metadata: {},
      env: {},
      shell: "system",
    });

    expect((await osResult.exit).exitCode).toBe(0);
  });

  test("CLI utilizes shell option", async () => {
    const defaultResult = await setupCliTest().run(
      "run-script",
      "echo $_BW_SCRIPT_SHELL_OPTION",
      "application-a",
      "-i",
      "--inline-name",
      "test",
    );
    expect(defaultResult.exitCode).toBe(0);
    expect(defaultResult.stdout.sanitizedCompactLines).toInclude(
      "[application-a:test] bun",
    );

    process.env[getUserEnvVarName("scriptShellDefault")] = "system";

    const osEnvResult = await setupCliTest().run(
      "run-script",
      IS_WINDOWS
        ? `echo %_BW_SCRIPT_SHELL_OPTION%`
        : "echo $_BW_SCRIPT_SHELL_OPTION",
      "application-a",
      "-i",
      "--inline-name",
      "test",
    );
    expect(osEnvResult.exitCode).toBe(0);
    expect(osEnvResult.stdout.sanitizedCompactLines).toInclude(
      "[application-a:test] system",
    );

    const explicitDefaultResult = await setupCliTest().run(
      "run-script",
      IS_WINDOWS
        ? `echo %_BW_SCRIPT_SHELL_OPTION%`
        : "echo $_BW_SCRIPT_SHELL_OPTION",
      "application-a",
      "--shell",
      "default",
      "-i",
      "--inline-name",
      "test",
    );
    expect(explicitDefaultResult.exitCode).toBe(0);
    expect(explicitDefaultResult.stdout.sanitizedCompactLines).toInclude(
      "[application-a:test] system",
    );

    process.env[getUserEnvVarName("scriptShellDefault")] = "bun";

    const bunEnvResult = await setupCliTest().run(
      "run-script",
      "echo $_BW_SCRIPT_SHELL_OPTION",
      "application-a",
      "-i",
      "--inline-name",
      "test",
    );
    expect(bunEnvResult.exitCode).toBe(0);
    expect(bunEnvResult.stdout.sanitizedCompactLines).toInclude(
      "[application-a:test] bun",
    );

    const explicitBunResult = await setupCliTest().run(
      "run-script",
      "echo $_BW_SCRIPT_SHELL_OPTION",
      "application-a",
      "--shell",
      "bun",
      "-i",
      "--inline-name",
      "test",
    );
    expect(explicitBunResult.exitCode).toBe(0);
    expect(explicitBunResult.stdout.sanitizedCompactLines).toInclude(
      "[application-a:test] bun",
    );

    const failingBunResult = await setupCliTest().run(
      "run-script",
      OS_ONLY_COMMAND,
      "application-a",
      "--shell",
      "bun",
      "-i",
      "--inline-name",
      "test",
    );
    expect(failingBunResult.exitCode).toBe(1);

    const explicitOsResult = await setupCliTest().run(
      "run-script",
      IS_WINDOWS
        ? `echo %_BW_SCRIPT_SHELL_OPTION%`
        : "echo $_BW_SCRIPT_SHELL_OPTION",
      "application-a",
      "--shell",
      "system",
      "-i",
      "--inline-name",
      "test",
    );
    expect(explicitOsResult.exitCode).toBe(0);
    expect(explicitOsResult.stdout.sanitizedCompactLines).toInclude(
      "[application-a:test] system",
    );

    const successfulOsOnlyResult = await setupCliTest().run(
      "run-script",
      OS_ONLY_COMMAND,
      "application-a",
      "--shell",
      "system",
      "-i",
      "--inline-name",
      "test",
    );
    expect(successfulOsOnlyResult.exitCode).toBe(0);
  });

  test("API - runWorkspaceScript utilizes shell option", async () => {
    const project = createFileSystemProject({
      rootDirectory: getProjectRoot("default"),
    });

    const defaultResult = await project.runWorkspaceScript({
      workspaceNameOrAlias: "application-a",
      script: "echo $_BW_SCRIPT_SHELL_OPTION",
      inline: true,
    });

    for await (const chunk of defaultResult.output) {
      expect(chunk.decode().trim()).toBe("bun");
    }
    expect((await defaultResult.exit).exitCode).toBe(0);

    process.env[getUserEnvVarName("scriptShellDefault")] = "system";

    const osEnvResult = await project.runWorkspaceScript({
      workspaceNameOrAlias: "application-a",
      script: IS_WINDOWS
        ? `echo %_BW_SCRIPT_SHELL_OPTION%`
        : "echo $_BW_SCRIPT_SHELL_OPTION",
      inline: true,
    });

    for await (const chunk of osEnvResult.output) {
      expect(chunk.decode().trim()).toBe("system");
    }
    expect((await osEnvResult.exit).exitCode).toBe(0);

    const explicitDefaultResult = await project.runWorkspaceScript({
      workspaceNameOrAlias: "application-a",
      script: IS_WINDOWS
        ? `echo %_BW_SCRIPT_SHELL_OPTION%`
        : "echo $_BW_SCRIPT_SHELL_OPTION",
      inline: { shell: "default" },
    });

    for await (const chunk of explicitDefaultResult.output) {
      expect(chunk.decode().trim()).toBe("system");
    }
    expect((await explicitDefaultResult.exit).exitCode).toBe(0);

    process.env[getUserEnvVarName("scriptShellDefault")] = "bun";

    const bunEnvResult = await project.runWorkspaceScript({
      workspaceNameOrAlias: "application-a",
      script: "echo $_BW_SCRIPT_SHELL_OPTION",
      inline: true,
    });

    for await (const chunk of bunEnvResult.output) {
      expect(chunk.decode().trim()).toBe("bun");
    }
    expect((await bunEnvResult.exit).exitCode).toBe(0);

    const explicitBunResult = await project.runWorkspaceScript({
      workspaceNameOrAlias: "application-a",
      script: "echo $_BW_SCRIPT_SHELL_OPTION",
      inline: { shell: "bun" },
    });

    for await (const chunk of explicitBunResult.output) {
      expect(chunk.decode().trim()).toBe("bun");
    }
    expect((await explicitBunResult.exit).exitCode).toBe(0);

    const failingBunResult = await project.runWorkspaceScript({
      workspaceNameOrAlias: "application-a",
      script: OS_ONLY_COMMAND,
      inline: { shell: "bun" },
    });

    expect((await failingBunResult.exit).exitCode).toBe(1);

    const explicitOsResult = await project.runWorkspaceScript({
      workspaceNameOrAlias: "application-a",
      script: IS_WINDOWS
        ? `echo %_BW_SCRIPT_SHELL_OPTION%`
        : "echo $_BW_SCRIPT_SHELL_OPTION",
      inline: { shell: "system" },
    });

    for await (const chunk of explicitOsResult.output) {
      expect(chunk.decode().trim()).toBe("system");
    }
    expect((await explicitOsResult.exit).exitCode).toBe(0);

    const successfulOsOnlyResult = await project.runWorkspaceScript({
      workspaceNameOrAlias: "application-a",
      script: OS_ONLY_COMMAND,
      inline: { shell: "system" },
    });

    expect((await successfulOsOnlyResult.exit).exitCode).toBe(0);
  });

  test("API - runScriptAcrossWorkspaces utilizes shell option", async () => {
    const project = createFileSystemProject({
      rootDirectory: getProjectRoot("default"),
    });

    const defaultResult = await project.runScriptAcrossWorkspaces({
      workspacePatterns: ["application-a"],
      script: "echo $_BW_SCRIPT_SHELL_OPTION",
      inline: true,
    });

    for await (const { outputChunk } of defaultResult.output) {
      expect(outputChunk.decode().trim()).toBe("bun");
    }
    expect((await defaultResult.summary).scriptResults[0].exitCode).toBe(0);

    process.env[getUserEnvVarName("scriptShellDefault")] = "system";

    const osEnvResult = await project.runScriptAcrossWorkspaces({
      workspacePatterns: ["application-a"],
      script: IS_WINDOWS
        ? `echo %_BW_SCRIPT_SHELL_OPTION%`
        : "echo $_BW_SCRIPT_SHELL_OPTION",
      inline: true,
    });

    for await (const { outputChunk } of osEnvResult.output) {
      expect(outputChunk.decode().trim()).toBe("system");
    }
    expect((await osEnvResult.summary).scriptResults[0].exitCode).toBe(0);

    const explicitDefaultResult = await project.runScriptAcrossWorkspaces({
      workspacePatterns: ["application-a"],
      script: IS_WINDOWS
        ? `echo %_BW_SCRIPT_SHELL_OPTION%`
        : "echo $_BW_SCRIPT_SHELL_OPTION",
      inline: { shell: "default" },
    });

    for await (const { outputChunk } of explicitDefaultResult.output) {
      expect(outputChunk.decode().trim()).toBe("system");
    }
    expect(
      (await explicitDefaultResult.summary).scriptResults[0].exitCode,
    ).toBe(0);

    process.env[getUserEnvVarName("scriptShellDefault")] = "bun";

    const bunEnvResult = await project.runScriptAcrossWorkspaces({
      workspacePatterns: ["application-a"],
      script: "echo $_BW_SCRIPT_SHELL_OPTION",
      inline: true,
    });

    for await (const { outputChunk } of bunEnvResult.output) {
      expect(outputChunk.decode().trim()).toBe("bun");
    }
    expect((await bunEnvResult.summary).scriptResults[0].exitCode).toBe(0);

    const explicitBunResult = await project.runScriptAcrossWorkspaces({
      workspacePatterns: ["application-a"],
      script: "echo $_BW_SCRIPT_SHELL_OPTION",
      inline: { shell: "bun" },
    });

    for await (const { outputChunk } of explicitBunResult.output) {
      expect(outputChunk.decode().trim()).toBe("bun");
    }
    expect((await explicitBunResult.summary).scriptResults[0].exitCode).toBe(0);

    const failingBunResult = await project.runScriptAcrossWorkspaces({
      workspacePatterns: ["application-a"],
      script: OS_ONLY_COMMAND,
      inline: { shell: "bun" },
    });

    expect((await failingBunResult.summary).scriptResults[0].exitCode).toBe(1);

    const explicitOsResult = await project.runScriptAcrossWorkspaces({
      workspacePatterns: ["application-a"],
      script: IS_WINDOWS
        ? `echo %_BW_SCRIPT_SHELL_OPTION%`
        : "echo $_BW_SCRIPT_SHELL_OPTION",
      inline: { shell: "system" },
    });

    for await (const { outputChunk } of explicitOsResult.output) {
      expect(outputChunk.decode().trim()).toBe("system");
    }
    expect((await explicitOsResult.summary).scriptResults[0].exitCode).toBe(0);

    const successfulOsOnlyResult = await project.runScriptAcrossWorkspaces({
      workspacePatterns: ["application-a"],
      script: OS_ONLY_COMMAND,
      inline: { shell: "system" },
    });

    expect(
      (await successfulOsOnlyResult.summary).scriptResults[0].exitCode,
    ).toBe(0);
  });
});
