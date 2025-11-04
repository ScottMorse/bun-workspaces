import { type RunScriptJsonOutputFile } from "bun-workspaces/src/cli/projectCommands/handleRunScript";

const start = new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 7);
const end = new Date(start.getTime() + 5136);
const durationMs = end.getTime() - start.getTime();

export const RUN_SCRIPT_EXAMPLE_JSON_OUTPUT: RunScriptJsonOutputFile = {
  script: "my-script",
  args: "my script args",
  parallel: false,
  totalCount: 2,
  successCount: 1,
  failureCount: 1,
  allSuccess: false,
  startTimeISO: start.toISOString(),
  endTimeISO: end.toISOString(),
  durationMs,
  workspaces: [
    {
      workspace: {
        name: "my-workspace-a",
        path: "packages/my-workspace-a",
        aliases: ["mwa"],
      },
      success: true,
      exitCode: 0,
      startTimeISO: start.toISOString(),
      endTimeISO: new Date(end.getTime() - durationMs * 0.75).toISOString(),
      durationMs: durationMs * 0.75,
    },
    {
      workspace: {
        name: "my-workspace-b",
        path: "packages/my-workspace-b",
        aliases: ["mwb"],
      },
      success: false,
      exitCode: 1,
      startTimeISO: new Date().toISOString(),
      endTimeISO: new Date(end.getTime() - durationMs * 0.25).toISOString(),
      durationMs: durationMs * 0.25,
    },
  ],
};
