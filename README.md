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

```bash
alias bw="bunx bun-workspaces"

# Usage (--help can also be passed to any command)
bw help
bw --help

# Get JSON metadata
bw list-workspaces --json --pretty # optionally pretty print JSON
bw list-scripts --json
bw workspace-info my-workspace --json
bw script-info my-script --json

# Run scripts across workspaces
bw run my-script
bw run my-script my-workspace
bw run my-script workspace-a workspace-b
bw run my-script "my-workspace-*"
bw run my-script --parallel
bw run my-script --args "--my --args"
bw run my-script --args "--my --args=<workspace>"
```

### API

```typescript
import { createFileSystemProject } from "bun-workspaces";

const project = createFileSystemProject({
  // typically a git repository root
  rootDirectory: "path/to/your/project",
});

const myWorkspace = project.findWorkspaceByNameOrAlias("my-workspace");

const wildcardWorkspaces = project.findWorkspacesByPattern("my-workspace-*");

const workspacesWithScript = project.listWorkspacesWithScript("my-script");

const {
  commandDetails: { command, workingDirectory },
} = project.createScriptCommand({
  scriptName: "my-script",
  workspaceNameOrAlias: myWorkspace.name,
});

const subprocess = Bun.spawn(command.split(/\s+/), {
  cwd: workingDirectory,
});
```

_`bun-workspaces` is independent from the [Bun](https://bun.sh) project and is not affiliated with or endorsed by Oven. This project aims to enhance enhance the experience of Bun for its users._
a
