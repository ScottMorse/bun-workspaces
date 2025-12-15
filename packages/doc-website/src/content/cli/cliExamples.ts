import { getUserEnvVarName } from "bun-workspaces/src/config/userEnvVars";

export const CLI_QUICKSTART = `
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
bw run lint --args="--my-appended-args" # Add args to each script call
bw run lint --args="--my-arg=<workspaceName>" # Use the workspace name in args
bw run "bun build" --inline --inline-name=build # Run an inline command

bw run lint --parallel # Run in parallel (default is "auto")
bw run lint --parallel=2 # Run in parallel with a max of 2 concurrent scripts
bw run lint --parallel=auto # Run in parallel with a max of the available CPUs
bw run lint --parallel=50% # Run in parallel with a max of 50% of the available CPUs
bw run lint --parallel=unbounded # Run every script in parallel (use with caution)

# Show usage (you can pass --help to any command)
bw help
bw --help

# Show version
bw --version

# Pass --cwd to any command
bw --cwd=/path/to/your/project ls
bw --cwd=/path/to/your/project run my-script

# Pass --log-level to any command (debug, info, warn, error, or silent)
bw --log-level=silent run my-script`.trim();

export const INLINE_SCRIPT_EXAMPLE = `
# Run an inline command from the workspace directory
bw run "bun run build" --inline


`.trim();

export const CLI_PARALLEL_SCRIPTS_EXAMPLE = `
# Run in parallel (default is "auto" or value of ${getUserEnvVarName("parallelMaxDefault")} env var)
bw run my-script --parallel

# Same as the above command
bw run my-script --parallel=default

# Run in parallel with a max of the available logical CPUs
bw run my-script --parallel=auto

# Run in parallel with a max of 2 concurrent scripts
bw run my-script --parallel=2

# Run in parallel with a max of 50% of the available logical CPUs
bw run my-script --parallel=50%

# Run every script in parallel (use with caution)
bw run my-script --parallel=unbounded 
`.trim();
