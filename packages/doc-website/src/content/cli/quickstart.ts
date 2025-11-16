export const CLI_QUICKSTART = `
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
bw run lint --args="--my-arg=<workspace>" # Use the workspace name in args

# Show usage (you can pass --help to any command)
bw help
bw --help

# Pass --cwd to any command
bw --cwd=/path/to/your/project ls
bw --cwd=/path/to/your/project run my-script

# Pass --log-level to any command (debug, info, warn, error, or silent)
bw --log-level=silent run my-script`.trim();
