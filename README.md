<img src="./packages/doc-website/src/docs/public/bw-eye.png" alt="bun-workspaces" width="50" />

# bun-workspaces

This is a CLI that works on top of native [Bun workspaces](https://bun.sh/docs/install/workspaces) with no additional setup required. Get metadata about your workspaces and scripts, and run scripts across your workspaces.

### **[See Full Documentation Here](https://bunworkspaces.com)**

## Quick Start

You can install the CLI in your project or simply use `bunx bun-workspaces`.

```bash
$ bun add --dev bun-workspaces
$ bunx bun-workspaces --help
```

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
