import path from "node:path";
import { test, expect, describe } from "bun:test";
import {
  getProjectCommandConfig,
  type CliProjectCommandName,
} from "../src/cli/projectCommands";
import { logger } from "../src/internal/logger";
import { getProjectRoot } from "./testProjects";
import {
  acknowledgeCommandTest,
  setupCliTest,
  USAGE_OUTPUT_PATTERN,
  validateAllCommandsTests,
  validateAllGlobalOptionTests,
} from "./util/cliTestUtils";

const listCommandAndAliases = (commandName: CliProjectCommandName) => {
  const config = getProjectCommandConfig(commandName);
  return [config.command.split(/\s+/)[0], ...config.aliases];
};

describe("Test CLI commands", () => {
  test("TODO IM AN IDIOT IF I DONT IMPLEMENT THIS", async () => {
    // Commands in invalid test projects just to confirm expected error messages come through
    // maybe loop through all commands for each invalid test project?
  });

  test.each(listCommandAndAliases("listWorkspaces"))(
    "List Workspaces: %s",
    async (command) => {
      acknowledgeCommandTest("listWorkspaces");

      const { run, assertLastWrite } = setupCliTest({
        testProject: "simple1",
      });

      await run(command);
      assertLastWrite(
        `Workspace: application-1a
 - Aliases: appA
 - Path: applications/applicationA
 - Glob Match: applications/*
 - Scripts: a-workspaces, all-workspaces, application-a
Workspace: application-1b
 - Aliases: appB
 - Path: applications/applicationB
 - Glob Match: applications/*
 - Scripts: all-workspaces, application-b, b-workspaces
Workspace: library-1a
 - Aliases: libA
 - Path: libraries/libraryA
 - Glob Match: libraries/*
 - Scripts: a-workspaces, all-workspaces, library-a
Workspace: library-1b
 - Aliases: libB
 - Path: libraries/libraryB
 - Glob Match: libraries/*
 - Scripts: all-workspaces, b-workspaces, library-b`,
        "commandOutput",
      );

      await run(command, "--name-only");
      assertLastWrite(
        `application-1a
application-1b
library-1a
library-1b`,
        "commandOutput",
      );

      const expectedJson = [
        {
          name: "application-1a",
          matchPattern: "applications/*",
          path: "applications/applicationA",
          scripts: ["a-workspaces", "all-workspaces", "application-a"],
          aliases: ["appA"],
        },
        {
          name: "application-1b",
          matchPattern: "applications/*",
          path: "applications/applicationB",
          scripts: ["all-workspaces", "application-b", "b-workspaces"],
          aliases: ["appB"],
        },
        {
          name: "library-1a",
          matchPattern: "libraries/*",
          path: "libraries/libraryA",
          scripts: ["a-workspaces", "all-workspaces", "library-a"],
          aliases: ["libA"],
        },
        {
          name: "library-1b",
          matchPattern: "libraries/*",
          path: "libraries/libraryB",
          scripts: ["all-workspaces", "b-workspaces", "library-b"],
          aliases: ["libB"],
        },
      ];

      await run(command, "--json");
      assertLastWrite(JSON.stringify(expectedJson), "commandOutput");

      await run(command, "--json", "--pretty");
      assertLastWrite(JSON.stringify(expectedJson, null, 2), "commandOutput");

      await run(command, "--name-only", "--json");
      assertLastWrite(
        JSON.stringify(expectedJson.map(({ name }) => name)),
        "commandOutput",
      );

      await run(command, "--name-only", "--json", "--pretty");
      assertLastWrite(
        JSON.stringify(
          expectedJson.map(({ name }) => name),
          null,
          2,
        ),
        "commandOutput",
      );

      const { run: runEmpty, assertLastWrite: assertLastWriteEmpty } =
        setupCliTest({
          testProject: "emptyWorkspaces",
        });

      await runEmpty(command);
      assertLastWriteEmpty("No workspaces found");
    },
  );

  test.each(listCommandAndAliases("listScripts"))(
    "List Scripts: %s",
    async (command) => {
      acknowledgeCommandTest("listScripts");

      const { run, assertLastWrite } = setupCliTest({
        testProject: "simple1",
      });

      await run(command);
      assertLastWrite(
        `Script: a-workspaces
 - application-1a
 - library-1a
Script: all-workspaces
 - application-1a
 - application-1b
 - library-1a
 - library-1b
Script: application-a
 - application-1a
Script: application-b
 - application-1b
Script: b-workspaces
 - application-1b
 - library-1b
Script: library-a
 - library-1a
Script: library-b
 - library-1b`,
        "commandOutput",
      );

      const expectedJson = [
        {
          name: "a-workspaces",
          workspaces: ["application-1a", "library-1a"],
        },
        {
          name: "all-workspaces",
          workspaces: [
            "application-1a",
            "application-1b",
            "library-1a",
            "library-1b",
          ],
        },
        {
          name: "application-a",
          workspaces: ["application-1a"],
        },
        {
          name: "application-b",
          workspaces: ["application-1b"],
        },
        {
          name: "b-workspaces",
          workspaces: ["application-1b", "library-1b"],
        },
        {
          name: "library-a",
          workspaces: ["library-1a"],
        },
        {
          name: "library-b",
          workspaces: ["library-1b"],
        },
      ];

      await run(command, "--json");
      assertLastWrite(JSON.stringify(expectedJson), "commandOutput");

      await run(command, "--json", "--pretty");
      assertLastWrite(JSON.stringify(expectedJson, null, 2), "commandOutput");

      await run(command, "--name-only", "--json");
      assertLastWrite(
        JSON.stringify(expectedJson.map(({ name }) => name)),
        "commandOutput",
      );

      await run(command, "--name-only", "--json", "--pretty");
      assertLastWrite(
        JSON.stringify(
          expectedJson.map(({ name }) => name),
          null,
          2,
        ),
        "commandOutput",
      );

      const { run: runEmpty, assertLastWrite: assertLastWriteEmpty } =
        setupCliTest({
          testProject: "emptyWorkspaces",
        });

      await runEmpty(command);
      assertLastWriteEmpty("No workspaces found");
    },
  );

  test.each(listCommandAndAliases("workspaceInfo"))(
    "Workspace Info: %s",
    async (command) => {
      acknowledgeCommandTest("workspaceInfo");

      const { run, assertLastWrite } = setupCliTest({
        testProject: "simple1",
      });

      await run(command, "application-1a");
      assertLastWrite(
        `Workspace: application-1a
 - Aliases: appA
 - Path: applications/applicationA
 - Glob Match: applications/*
 - Scripts: a-workspaces, all-workspaces, application-a`,
        "commandOutput",
      );

      await run(command, "application-1a", "--json");
      assertLastWrite(
        JSON.stringify({
          name: "application-1a",
          matchPattern: "applications/*",
          path: "applications/applicationA",
          scripts: ["a-workspaces", "all-workspaces", "application-a"],
          aliases: ["appA"],
        }),
        "commandOutput",
      );

      await run(command, "application-1a", "--json", "--pretty");
      assertLastWrite(
        JSON.stringify(
          {
            name: "application-1a",
            matchPattern: "applications/*",
            path: "applications/applicationA",
            scripts: ["a-workspaces", "all-workspaces", "application-a"],
            aliases: ["appA"],
          },
          null,
          2,
        ),
        "commandOutput",
      );

      await run(command, "does-not-exist");
      assertLastWrite(
        'Workspace "does-not-exist" not found (use command list-workspaces to list available workspaces)',
        "error",
      );

      const { run: runEmpty, assertLastWrite: assertLastWriteEmpty } =
        setupCliTest({
          testProject: "emptyWorkspaces",
        });

      await runEmpty(command, "application-1a");
      assertLastWriteEmpty(
        'Workspace "application-1a" not found (use command list-workspaces to list available workspaces)',
        "error",
      );
    },
  );

  test.each(listCommandAndAliases("scriptInfo"))(
    "Script Info: %s",
    async (command) => {
      acknowledgeCommandTest("scriptInfo");

      const { run, assertLastWrite } = setupCliTest({
        testProject: "simple1",
      });

      // Test basic script info output
      await run(command, "all-workspaces");
      assertLastWrite(
        `Script: all-workspaces
 - application-1a
 - application-1b
 - library-1a
 - library-1b`,
        "commandOutput",
      );

      // Test script with single workspace
      await run(command, "application-a");
      assertLastWrite(
        `Script: application-a
 - application-1a`,
        "commandOutput",
      );

      // Test JSON output
      await run(command, "all-workspaces", "--json");
      assertLastWrite(
        JSON.stringify({
          name: "all-workspaces",
          workspaces: [
            "application-1a",
            "application-1b",
            "library-1a",
            "library-1b",
          ],
        }),
        "commandOutput",
      );

      // Test JSON with pretty formatting
      await run(command, "all-workspaces", "--json", "--pretty");
      assertLastWrite(
        JSON.stringify(
          {
            name: "all-workspaces",
            workspaces: [
              "application-1a",
              "application-1b",
              "library-1a",
              "library-1b",
            ],
          },
          null,
          2,
        ),
        "commandOutput",
      );

      // Test --workspaces-only option
      await run(command, "all-workspaces", "--workspaces-only");
      assertLastWrite(
        `application-1a
application-1b
library-1a
library-1b`,
        "commandOutput",
      );

      // Test --workspaces-only with JSON
      await run(command, "all-workspaces", "--workspaces-only", "--json");
      assertLastWrite(
        JSON.stringify([
          "application-1a",
          "application-1b",
          "library-1a",
          "library-1b",
        ]),
        "commandOutput",
      );

      // Test --workspaces-only with JSON and pretty formatting
      await run(
        command,
        "all-workspaces",
        "--workspaces-only",
        "--json",
        "--pretty",
      );
      assertLastWrite(
        JSON.stringify(
          ["application-1a", "application-1b", "library-1a", "library-1b"],
          null,
          2,
        ),
        "commandOutput",
      );

      // Test error case - non-existent script
      await run(command, "does-not-exist");
      assertLastWrite(
        'Script not found: "does-not-exist" (use command list-scripts to list available scripts)',
        "error",
      );

      // Test with empty workspaces project
      const { run: runEmpty, assertLastWrite: assertLastWriteEmpty } =
        setupCliTest({
          testProject: "emptyWorkspaces",
        });

      await runEmpty(command, "all-workspaces");
      assertLastWriteEmpty(
        'Script not found: "all-workspaces" (use command list-scripts to list available scripts)',
        "error",
      );
    },
  );

  test.skip("Confirm all commands are tested", () => {
    validateAllCommandsTests();
  });
});
