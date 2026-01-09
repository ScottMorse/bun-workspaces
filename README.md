<img src="./packages/doc-website/src/docs/public/images/png/bwunster_64x70.png" alt="bun-workspaces" width="45" />

### [**See Full Documentation Here**: _https://bunworkspaces.com_](https://bunworkspaces.com)

# bun-workspaces

A CLI and API to enhance your monorepo development with Bun's [native workspaces](https://bun.sh/docs/install/workspaces) feature for nested JavaScript/TypeScript packages.

- Works right away, with no boilerplate required 🍔🍴
- Get metadata about your monorepo 🤖
- Run package.json scripts across workspaces 📋
- Run inline [Bun Shell](https://bun.com/docs/runtime/shell) scripts in workspaces ⌨️

This tool lets you decide the complexity of how you use it.
To get started, all you need is a normal project using [Bun's native workspaces](https://bun.sh/docs/install/workspaces) feature for nested JavaScript/TypeScript packages.

Think of this as a power suit you can snap onto native workspaces, rather than another monorepo framework.

Start running some [CLI commands](https://bunworkspaces.com/cli) right away in your repo, or take full advantage of the [scripting API](https://bunworkspaces.com/api) and its features.

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
# that have it in their package.json "scripts" field
bw run-script lint

# run is an alias for run-script
bw run lint my-workspace # Run for a single workspace
bw run lint my-workspace-a my-workspace-b # Run for multiple workspaces
bw run lint "my-workspace-*" # Run for matching workspace names
bw run lint --parallel # Run at the same time
bw run lint --args="--my-appended-args" # Add args to each script call
bw run lint --args="--my-arg=<workspaceName>" # Use the workspace name in args
bw run "bun build" --inline --inline-name=build # Run an inline command

# Show usage (you can pass --help to any command)
bw help
bw --help

# Show version
bw --version

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
// Below defaults to process.cwd() for the project root directory
// Pass { rootDirectory: "path/to/your/project" } to use a different root directory
const project = createFileSystemProject();

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
  for await (const chunk of output) {
    console.log(chunk.raw); // The raw output content (Uint8Array)
    console.log(chunk.decode()); // The output chunk's content (string)
    console.log(chunk.decode({ stripAnsi: true })); // Text with ANSI codes sanitized
    console.log(chunk.streamName); // The output stream, "stdout" or "stderr"
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
    // Optional. This will run in all matching workspaces that have my-script
    // Accepts same values as the CLI run-script command's workspace patterns
    // When not provided, all workspaces that have the script will be used.
    workspacePatterns: ["my-workspace", "my-pattern-*"],

    // Required. The package.json "scripts" field name to run
    script: "my-script",

    // Optional. Arguments to add to the command
    args: "--my --appended --args", // optional, arguments to add to the command

    // Optional. Whether to run the scripts in parallel
    parallel: true,
  });

  // Get a stream of script output
  for await (const { outputChunk, scriptMetadata } of output) {
    console.log(outputChunk.raw); // The raw output content (Uint8Array)
    console.log(outputChunk.decode()); // the output chunk's content (string)
    console.log(outputChunk.decode({ stripAnsi: true })); // text with ANSI codes sanitized (string)
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

_`bun-workspaces` is independent from the [Bun](https://bun.sh) project and is not affiliated with or endorsed by Anthropic. This project aims to enhance enhance the experience of Bun for its users._
