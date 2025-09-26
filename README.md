# bun-workspaces

This is a CLI meant to help manage [Bun workspaces](https://bun.sh/docs/install/workspaces).

This was created primarily due to issues and limitations with Bun's `--filter` option for running commands from workspaces.

## Installation

You can install the CLI in your project or simply use `bunx bun-workspaces`.

```bash
$ bun add --dev bun-workspaces
$ bunx bun-workspaces --help
```

### Config file

You can create a config file at `bw.json` in your project root, or you can pass a config file to the CLI with the `--configFile` (or `-c`) option.

#### Example config

In this config, "app-a" is an alias for package "@my-org/application-a" and "app-b" is an alias for package "@my-org/application-b".

CLI log levels are `debug`, `info`, `warn`, and `error` or `silent`. The default log level is `info`. Commands that are intended to print specific output will still print at `silent`, such as `list-workspaces`, `list-scripts`, `workspace-info`, `script-info`, etc., but other logs will be suppressed.

```json
{
  "workspaceAliases": {
    "app-a": "@my-org/application-a",
    "app-b": "@my-org/application-b"
  },
  "cli": {
    "logLevel": "warn"
  }
}
```

You can also pass a config file to the CLI with the `-c` or `--configFile` option.

### Examples

You might consider making a shorter alias in your `.bashrc`, `.zshrc`, or similar shell configuration file, such as `alias bw="bunx bun-workspaces"`, for convenience.

```bash
alias bw="bunx bun-workspaces"

# List all workspaces
bw list-workspaces
bw ls

# List workspace names only
bw list-workspaces --name-only

# Filter list of workspaces with wildcard
bw list-workspaces "my-*"

# List all workspace scripts
bw list-scripts

# List script names only
bw list-scripts --name-only

# Get info about a workspace
bw workspace-info my-workspace
bw info my-workspace

# Get info about a script
bw script-info my-script

# Only print list of workspace names that have the script
bw script-info my-script --workspaces-only

# Get JSON output
bw list-workspaces --json --pretty # optionally pretty print JSON
bw list-scripts --json
bw workspace-info my-workspace --json
bw script-info my-script --json

# Run a script for all
# workspaces that have it
# in their `scripts` field
bw run my-script

# Run a script for a specific workspace by its package.json name or alias from the config
bw run my-script my-workspace

# Run a script for multiple workspaces
bw run my-script workspace-a workspace-b

# Run a script for workspaces using wildcard (does not take into account workspace aliases)
bw run my-script "my-workspace-*"

# Run script in parallel for all workspaces
bw run my-script --parallel

# Append args to each script call
bw run my-script --args "--my --args"

# Use the workspace name in args
bw run my-script --args "--my --args=<workspace>"

# Help (--help can also be passed to any command)
bw help
bw --help

# Pass --cwd to any command
bw --cwd /path/to/your/project ls
bw --cwd /path/to/your/project run-script my-script

# Pass --configFile to any command
bw --configFile /path/to/your/config.json ls

# Pass --logLevel to any command (debug, info, warn, error, or silent)
bw --logLevel silent run my-script
```
