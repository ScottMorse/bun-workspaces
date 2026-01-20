import { describe, expect, test } from "bun:test";
import { createFileSystemProject } from "../src";
import { loadRootConfig } from "../src/config/rootConfig";
import { determineParallelMax, resolveScriptShell } from "../src/runScript";
import { getProjectRoot } from "./testProjects";

describe("Test project root config", () => {
  test("Test loadRootConfig", () => {
    expect(loadRootConfig(getProjectRoot("default"))).toEqual({
      defaults: {
        parallelMax: determineParallelMax("default"),
        shell: resolveScriptShell("default"),
      },
    });

    expect(loadRootConfig(getProjectRoot("rootConfigJsoncFile"))).toEqual({
      defaults: {
        parallelMax: 5,
        shell: "system",
      },
    });

    expect(loadRootConfig(getProjectRoot("rootConfigPackage"))).toEqual({
      defaults: {
        parallelMax: 5,
        shell: "system",
      },
    });

    expect(loadRootConfig(getProjectRoot("rootConfigParallelMaxOnly"))).toEqual(
      {
        defaults: {
          parallelMax: 5,
          shell: resolveScriptShell("default"),
        },
      },
    );
  });

  test("Test loadRootConfig - invalid parallel max", () => {
    expect(() =>
      loadRootConfig(getProjectRoot("rootConfigInvalidParallel")),
    ).toThrow(
      "Root config is invalid: config.defaults.parallelMax must be number",
    );
  });

  test("Test loadRootConfig - invalid shell", () => {
    expect(() =>
      loadRootConfig(getProjectRoot("rootConfigInvalidShell")),
    ).toThrow(
      "Invalid shell option: something wrong (accepted values: bun, system)",
    );
  });

  test("Test loadRootConfig - invalid JSON", () => {
    expect(() =>
      loadRootConfig(getProjectRoot("rootConfigInvalidJson")),
    ).toThrow("Invalid JSON");
  });

  test("Test loadRootConfig - invalid type", () => {
    expect(() =>
      loadRootConfig(getProjectRoot("rootConfigInvalidType")),
    ).toThrow("Root config is invalid: config.defaults must be object");
  });

  test("FileSystemProject - loads root config", () => {
    expect(
      createFileSystemProject({
        rootDirectory: getProjectRoot("default"),
      }).config.root,
    ).toEqual({
      defaults: {
        parallelMax: determineParallelMax("default"),
        shell: resolveScriptShell("default"),
      },
    });

    expect(
      createFileSystemProject({
        rootDirectory: getProjectRoot("rootConfigJsoncFile"),
      }).config.root,
    ).toEqual({
      defaults: {
        parallelMax: 5,
        shell: "system",
      },
    });
  });

  test("FileSystemProject - uses parallel max from config", async () => {
    const project = createFileSystemProject({
      rootDirectory: getProjectRoot("rootConfigJsoncFile"),
    });

    let outputText = "";
    const { output, summary } = project.runScriptAcrossWorkspaces({
      workspacePatterns: ["workspace-a"],
      script: "debug-parallel-max",
      parallel: true,
    });

    for await (const { outputChunk } of output) {
      outputText += outputChunk.decode();
    }

    await summary;

    await expect(outputText.trim()).toBe("5");
  });

  test("FileSystemProject - uses shell option from config", async () => {
    const project = createFileSystemProject({
      rootDirectory: getProjectRoot("rootConfigJsoncFile"),
    });

    let outputText = "";
    const { output, summary } = project.runScriptAcrossWorkspaces({
      workspacePatterns: ["workspace-a"],
      script: "debug-shell",
      parallel: true,
    });

    for await (const { outputChunk } of output) {
      outputText += outputChunk.decode();
    }

    await summary;

    await expect(outputText.trim()).toBe("system");
  });
});
