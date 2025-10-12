/* eslint-disable no-console */
import path from "node:path";
import packageJson from "../package.json";
import { runBuild } from "./build";

const IS_DRY_RUN = process.env.DRY_RUN === "true";

const promptVersion = async () => {
  const prompt = `New version to publish? (current: ${packageJson.version}): `;
  process.stdout.write(prompt);

  let version: string | null = null;
  for await (const line of console) {
    const input = line.trim();
    if (input && input !== packageJson.version) {
      version = input;
    }
    break;
  }

  return { isNewVersion: !!version, version: version ?? packageJson.version };
};

const runScript = async (parts: string[], workspacePath?: string) => {
  const proc = await Bun.spawn(parts, {
    cwd: getWorkspacePath(workspacePath),
    stdout: "inherit",
    stderr: "inherit",
  });
  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    throw new Error(`Failed to run script "${parts.join(" ")}"`);
  }
};

const getWorkspacePath = (p?: string) =>
  path.resolve(__dirname, "../", p ?? "");

if (import.meta.main) {
  const { version, isNewVersion } = await promptVersion();

  const oldPackage = { ...packageJson };
  if (isNewVersion) {
    const newPackage = {
      ...packageJson,
    };

    newPackage.version = version;

    await Bun.write(
      getWorkspacePath("package.json"),
      JSON.stringify(newPackage, null, 2),
    );
  }

  await runScript(["bun", "run", "build:test"]);

  await runBuild();

  await runScript(
    ["bun", "publish", ...(IS_DRY_RUN ? ["--dry-run"] : [])],
    "dist",
  );

  const tag = "v" + version;

  if (IS_DRY_RUN) {
    await Bun.write(
      getWorkspacePath("package.json"),
      JSON.stringify(oldPackage, null, 2),
    );
  } else {
    if (isNewVersion) {
      await runScript(["git", "add", "package.json"]);
      await runScript([
        "git",
        "commit",
        "-m",
        "[Automated::publish script]: Updated version to " + version,
      ]);
    }

    await runScript(["git", "tag", tag]);
    await runScript(["git", "push", "origin", version]);
  }

  const releaseUrl =
    packageJson.repository.url.replace(".git", "") + "/releases/new?tag=" + tag;

  console.log("\nPublished " + version + (IS_DRY_RUN ? " (dry run)" : ""));
  console.log("\nCreate a release at " + releaseUrl + "\n");

  await runScript(["xdg-open", releaseUrl]);
}
