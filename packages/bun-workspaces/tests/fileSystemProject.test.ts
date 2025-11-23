import { expect, test, describe } from "bun:test";
import { createFileSystemProject } from "../src/project";
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
});
