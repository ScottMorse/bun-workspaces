export const CREATE_FS_PROJECT_EXAMPLE = `
import { createFileSystemProject } from "bun-workspaces";

const project = createFileSystemProject({
  rootDirectory: "./path/to/project/root"
});

console.log(project.name); // The name from the root package.json
console.log(project.workspaces); // An array of workspaces found in the project
`.trim();

export const CREATE_MEMORY_PROJECT_EXAMPLE = `
import { createMemoryProject } from "bun-workspaces";

const testProject = createMemoryProject({
  rootDirectory: "test-project-directory", // optional
  name: "test-project", // optional
  workspaces: [
    {
      name: "my-test-workspace",
      path: "my/test/workspace/path",
      matchPattern: "my/test/workspace/pattern/*",
      scripts: ["my-test-script"],
      aliases: ["test-alias"]
    }
  ]
});
`.trim();

export const FIND_WORKSPACE_BY_NAME_EXAMPLE = `
// Find a workspace by its package.json name (or returns null)
const workspace = project.findWorkspaceByName("my-workspace");`.trim();

export const FIND_WORKSPACE_BY_ALIAS_EXAMPLE = `
// Find a workspace by its alias (or returns null)
const workspace = project.findWorkspaceByAlias("my-alias");`.trim();

export const FIND_WORKSPACE_BY_NAME_OR_ALIAS_EXAMPLE = `
// Find a workspace by its package.json name or alias (or returns null)
const workspace = project.findWorkspaceByNameOrAlias("my-workspace");`.trim();

export const FIND_WORKSPACES_BY_PATTERN_EXAMPLE = `
// An array of workspaces whose names match the wildcard pattern
const workspaces = project.findWorkspacesByPattern("my-pattern-*");`.trim();

export const LIST_WORKSPACES_WITH_SCRIPT_EXAMPLE = `
// An array of workspaces that have "my-script" 
// in their package.json "scripts" field
const workspaces = project.listWorkspacesWithScript("my-script"));`.trim();

export const MAP_SCRIPTS_TO_WORKSPACES_EXAMPLE = `
// An object mapping all script names to the workspaces 
// that have them in their package.json "scripts" field
const scriptMap = project.mapScriptsToWorkspaces();

// An array of Workspaces
const { workspaces } = scriptMap["my-script"];
`.trim();

export const CREATE_SCRIPT_COMMAND_EXAMPLE = `

// Does not run a script, but provides
// metadata that can be used to do so.
const {
  commandDetails: { command, workingDirectory },
} = project.createScriptCommand({
  scriptName: "my-script",
  workspaceNameOrAlias: "my-workspace",
  method: "cd", // optional, defaults to "cd" (other option "filter")
  args: "--my-appended-args", // optional, append args to the command
});

// A means by which you may actually run the script
const subprocess = Bun.spawn(["sh", "-c", command], {
  cwd: workingDirectory,
});

`.trim();

export const WORKSPACE_EXAMPLE = `
{
  // The name of the workspace from its package.json
  name: "my-workspace",

  // The relative path to the workspace from the project root
  path: "my/workspace/path",

  // The glob pattern from the root package.json "workspaces" field
  // that this workspace was matched from
  matchPattern: "my/workspace/pattern/*",

  // The scripts available in the workspace's package.json
  scripts: ["my-script"],

  // Aliases assigned to the workspace via the "workspaceAliases" 
  // field in the config
  aliases: ["my-alias"]
}
`.trim();

export const SET_LOG_LEVEL_EXAMPLE = `
import { setLogLevel } from "bun-workspaces";

setLogLevel("debug");
setLogLevel("info"); // default
setLogLevel("warn");
setLogLevel("error"); // default when NODE_ENV is "test"
setLogLevel("silent");
`.trim();

export const RUN_WORKSPACE_SCRIPT_EXAMPLE = `
const { output, exit } = project.runWorkspaceScript({
  workspaceNameOrAlias: "my-workspace",
  script: "my-script",
  args: "--my --appended --args", // optional, arguments to add to the command
});

// Get a stream of the script subprocess's output
for await (const { text, textNoAnsi, streamName } of output) {
  console.log(text); // the output chunk's content (string)
  console.log(textNoAnsi); // text with ANSI codes sanitized (string)
  console.log(streamName); // the output stream, "stdout" or "stderr"
}

// Get data about the script execution after it exits
const exitResult = await exit;

console.log(exitResult.exitCode); // the exit code (number)
console.log(exitResult.signal); // the exit signal (string), or null
console.log(exitResult.success); // true if exit code was 0
console.log(exitResult.startTimeISO); // Start time (ISO string)
console.log(exitResult.endTimeISO); // End time (ISO string)
console.log(exitResult.durationMs); // Duration in milliseconds (number)
console.log(exitResult.metadata.workspace); // The target workspace (Workspace)

`.trim();

export const RUN_SCRIPT_ACROSS_WORKSPACES_EXAMPLE = `

const { output, summary } = project.runScriptAcrossWorkspaces({
  workspacePatterns: ["*"], // this will run in all workspaces that have my-script
  script: "my-script",
  args: "--my --appended --args", // optional, arguments to add to the command
  parallel: true, // optional, run the scripts in parallel
});

// Get a stream of script output
for await (const { outputChunk, scriptMetadata } of output) {
  console.log(outputChunk.text); // the output chunk's content (string)
  console.log(outputChunk.textNoAnsi); // text with ANSI codes sanitized (string)
  console.log(outputChunk.streamName); // "stdout" or "stderr"

  // The metadata can distinguish which workspace script 
  // the current output chunk came from
  console.log(scriptMetadata.workspace); // Workspace object
}

// Get final summary data and script exit details after all scripts have completed
const summaryResult = await summary;

console.log(summaryResult.totalCount); // total number of scripts
console.log(summaryResult.allSuccess); // true if all scripts succeeded
console.log(summaryResult.successCount); // number of scripts that succeeded
console.log(summaryResult.failureCount); // number of scripts that failed
console.log(summaryResult.startTimeISO); // start time (ISO string)
console.log(summaryResult.endTimeISO); // end time (ISO string)
console.log(summaryResult.durationMs); // total duration in milliseconds (number)

// The exit result of each script as \`project.runWorkspaceScript\` resolves
for (const exitResult of summaryResult.scriptResults) {
  console.log(exitResult.exitCode); // the exit code (number)
  console.log(exitResult.signal); // the exit signal (string), or null
  console.log(exitResult.success); // true if exit code was 0
  console.log(exitResult.startTimeISO); // Start time (ISO string)
  console.log(exitResult.endTimeISO); // End time (ISO string)
  console.log(exitResult.durationMs); // Duration in milliseconds (number)
  console.log(exitResult.metadata.workspace); // The target workspace (Workspace)
}
`.trim();

export const API_QUICKSTART = `
import { createFileSystemProject } from "bun-workspaces";

// A Project contains the core functionality of bun-workspaces.
const project = createFileSystemProject({
  rootDirectory: "path/to/your/project",
});

// A Workspace that matches the name or alias "my-workspace"
const myWorkspace = project.findWorkspaceByNameOrAlias("my-workspace");

// Array of workspaces whose names match the wildcard pattern
const wildcardWorkspaces = project.findWorkspacesByPattern("my-workspace-*");

// Array of workspaces that have "my-script" in their package.json "scripts"
const workspacesWithScript = project.listWorkspacesWithScript("my-script");

// Run a script in a workspace
const runSingleScript = async () => {
  ${RUN_WORKSPACE_SCRIPT_EXAMPLE.split("\n").join("\n  ")}
}

// Run a script in all workspaces that have it in their package.json "scripts" field
const runManyScripts = async () => {
  ${RUN_SCRIPT_ACROSS_WORKSPACES_EXAMPLE.split("\n").join("\n  ")}
}
`.trim();
