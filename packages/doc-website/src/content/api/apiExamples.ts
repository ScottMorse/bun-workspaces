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
const subprocess = Bun.spawn(command.split(/\\s+/g), {
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

export const MULTI_METHOD_SCRIPTS_EXAMPLE = `
import { createFileSystemProject } from "bun-workspaces";

const myProject = createFileSystemProject({
  rootDirectory: "."
});

const targetWorkspaces = myProject.findWorkspacesByPattern("my-workspace-*");

const scriptCommands = targetWorkspaces.map((workspace) =>
  project.createScriptCommand({
    workspaceNameOrAlias: workspace.name,
    scriptName: "my-script",
  }),
);

// Run all scripts in series
for (const { command, workingDirectory } of scriptCommands) {
  const subprocess = Bun.spawn(command.split(/\\s+/g), {
    cwd: workingDirectory,
  });

  await subprocess.exited;
};

// Run all scripts in parallel
await Promise.allSettled(scriptCommands.map(({ command, workingDirectory }) =>
  Bun.spawn(command.split(/\\s+/g), {
    cwd: workingDirectory,
  }).exited,
));
`.trim();

export const SET_LOG_LEVEL_EXAMPLE = `
import { setLogLevel } from "bun-workspaces";

setLogLevel("debug");
setLogLevel("info"); // default
setLogLevel("warn");
setLogLevel("error"); // default when NODE_ENV is "test"
setLogLevel("silent");
`.trim();
