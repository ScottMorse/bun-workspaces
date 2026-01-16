import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { logger } from "../../logger";
import { BUN_WORKSPACES_VERSION } from "../../version";
import { runOnExit } from "./onExit";

const TEMP_PARENT_DIR = path.join(
  os.tmpdir(),
  "bun-workspaces",
  BUN_WORKSPACES_VERSION,
);

export type CreateTempFileOptions = {
  name: string;
  content: string;
  mode?: fs.Mode;
};

class TempDir {
  public readonly id = crypto.randomUUID();
  public readonly dir: string;

  constructor() {
    this.dir = path.join(TEMP_PARENT_DIR, this.id);
  }

  initialize(clean = false) {
    if (clean) {
      for (const dir of fs.readdirSync(path.resolve(TEMP_PARENT_DIR, ".."))) {
        if (dir !== BUN_WORKSPACES_VERSION) {
          fs.rmSync(path.join(TEMP_PARENT_DIR, dir), {
            force: true,
            recursive: true,
          });
        }
      }
    }

    fs.mkdirSync(this.dir, { recursive: true });
    fs.chmodSync(this.dir, 0o700);
    runOnExit(() => fs.rmSync(this.dir, { force: true, recursive: true }));

    logger.debug(`Created temp dir: ${this.dir}`);
  }

  createFilePath(fileName: string) {
    return path.join(this.dir, fileName);
  }

  createFile({ name, content, mode }: CreateTempFileOptions) {
    const filePath = this.createFilePath(name);
    fs.writeFileSync(filePath, content, {
      encoding: "utf8",
      mode,
    });
    return {
      filePath,
      cleanup: () => fs.rmSync(filePath, { force: true }),
    };
  }

  cleanup() {
    fs.rmSync(this.dir, { force: true, recursive: true });
  }
}

const TEMP_DIR = new TempDir();

export const createTempDir = TEMP_DIR.initialize.bind(TEMP_DIR);

export const createTempFile = TEMP_DIR.createFile.bind(TEMP_DIR);

export const createTempFilePath = TEMP_DIR.createFilePath.bind(TEMP_DIR);
