<img src="./packages/doc-website/src/docs/public/bw-eye.png" alt="bun-workspaces" width="50" />

# bun-workspaces

### [**See Full Documentation Here:** _https://bunworkspaces.com_](https://bunworkspaces.com)

**_New: [An API is now officially released!](https://bunworkspaces.com/api)_**

This is a CLI and API that help you manage your monorepo on top of native [Bun workspaces](https://bun.sh/docs/install/workspaces), with no additional setup required. Get metadata about your workspaces and scripts, and run scripts across your workspaces.

<a href="https://buymeacoffee.com/scottmorse">
<img src="./packages/doc-website/src/docs/public/bmac-logo-circle.png" alt="Link to Buy Me A Coffee" width="60" />
</a>

## Quick Start

Installation:

```bash
$ # Install to use the API and/or lock your CLI version for your project
$ bun add --dev bun-workspaces
$ # Start using the CLI with or without the installation step
$ bunx bun-workspaces --help
```

### CLI

[Full CLI documentation here](https://bunworkspaces.com/cli)

```bash
alias bw="bunx bun-workspaces" # can place in .zshrc, .bashrc, or similar

# List all workspaces in your project
bw list-workspaces

# ls is an alias for list-workspaces
bw ls --json --pretty # Output as formatted JSON

# Run the lint script for all workspaces
# that have it in their "scripts" field
bw run-script lint

# run is an alias for run-script
bw run lint my-workspace # Run for a single workspace
bw run lint my-workspace-a my-workspace-b # Run for multiple workspaces
bw run lint "my-workspace-*" # Run for matching workspace names
bw run lint --parallel # Run at the same time
bw run lint --args="--my-appended-args" # Add args to each script call
bw run lint --args="--my-arg=<workspaceName>" # Use the workspace name in args

# Run an inline command from the workspace directory
bw run "echo 'this is my inline script for <workspaceName>'" --inline

# Show usage (you can pass --help to any command)
bw help
bw --help

# Pass --cwd to any command
bw --cwd=/path/to/your/project ls
bw --cwd=/path/to/your/project run my-script

# Pass --log-level to any command (debug, info, warn, error, or silent)
bw --log-level=silent run my-script
```

### API

[Full API documentation here](https://bunworkspaces.com/api)

```typescript
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
  const { output, exit } = project.runWorkspaceScript({
    workspaceNameOrAlias: "my-workspace",
    script: "my-script",
    args: "--my --appended --args", // optional, arguments to add to the command
  });

  // Get a stream of the script subprocess's output
  for await (const { text, textNoAnsi, streamName } of output) {
    console.log(text); // The output chunk's content (string)
    console.log(textNoAnsi); // Text with ANSI codes sanitized (string)
    console.log(streamName); // The output stream, "stdout" or "stderr"
  }

  // Get data about the script execution after it exits
  const exitResult = await exit;

  console.log(exitResult.exitCode); // The exit code (number)
  console.log(exitResult.signal); // The exit signal (string), or null
  console.log(exitResult.success); // true if exit code was 0
  console.log(exitResult.startTimeISO); // Start time (string)
  console.log(exitResult.endTimeISO); // End time (string)
  console.log(exitResult.durationMs); // Duration in milliseconds (number)
  console.log(exitResult.metadata.workspace); // The target workspace (Workspace)
};

// Run a script in all workspaces that have it in their package.json "scripts" field
const runManyScripts = async () => {
  const { output, summary } = project.runScriptAcrossWorkspaces({
    workspacePatterns: ["*"], // this will run in all workspaces that have my-script
    script: "my-script", // the package.json "scripts" field name to run
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

  console.log(summaryResult.totalCount); // Total number of scripts
  console.log(summaryResult.allSuccess); // true if all scripts succeeded
  console.log(summaryResult.successCount); // Number of scripts that succeeded
  console.log(summaryResult.failureCount); // Number of scripts that failed
  console.log(summaryResult.startTimeISO); // Start time (string)
  console.log(summaryResult.endTimeISO); // End time (string)
  console.log(summaryResult.durationMs); // Total duration in milliseconds (number)

  // The exit details of each workspace script
  for (const exitResult of summaryResult.scriptResults) {
    console.log(exitResult.exitCode); // The exit code (number)
    console.log(exitResult.signal); // The exit signal (string), or null
    console.log(exitResult.success); // true if exit code was 0
    console.log(exitResult.startTimeISO); // Start time (ISO string)
    console.log(exitResult.endTimeISO); // End time (ISO string)
    console.log(exitResult.durationMs); // Duration in milliseconds (number)
    console.log(exitResult.metadata.workspace); // The target workspace (Workspace)
  }
};
```

_`bun-workspaces` is independent from the [Bun](https://bun.sh) project and is not affiliated with or endorsed by Oven. This project aims to enhance enhance the experience of Bun for its users._
