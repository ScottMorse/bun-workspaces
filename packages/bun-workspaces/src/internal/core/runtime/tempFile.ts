import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { logger } from "../../logger";
import { BUN_WORKSPACES_VERSION } from "../../version";
import { createShortId } from "../language/string/id";
import { runOnExit } from "./onExit";

const TEMP_BASE_PACKAGE_DIR = path.join(os.tmpdir(), "bun-workspaces");

const TEMP_PARENT_DIR = path.join(
  TEMP_BASE_PACKAGE_DIR,
  BUN_WORKSPACES_VERSION,
);

export type CreateTempFileOptions = {
  name: string;
  content: string;
  mode?: fs.Mode;
};

class TempDir {
  public readonly id = createShortId(6);
  public readonly dir: string;

  constructor() {
    this.dir = path.join(TEMP_PARENT_DIR, this.id);
  }

  initialize(clean = false) {
    if (fs.existsSync(this.dir)) return;

    fs.mkdirSync(this.dir, { recursive: true });
    fs.chmodSync(this.dir, 0o700);

    if (clean) {
      for (const dir of fs.readdirSync(path.resolve(TEMP_BASE_PACKAGE_DIR))) {
        if (dir !== BUN_WORKSPACES_VERSION) {
          logger.debug(
            `Removing temp dir: ${path.join(TEMP_BASE_PACKAGE_DIR, dir)}`,
          );
          fs.rmSync(path.join(TEMP_PARENT_DIR, dir), {
            force: true,
            recursive: true,
          });
        }
      }
    }

    runOnExit(() => {
      logger.debug(`Removing temp dir: ${this.dir}`);
      fs.rmSync(this.dir, { force: true, recursive: true });
    });

    logger.debug(`Created temp dir: ${this.dir}`);
  }

  createFilePath(fileName: string) {
    return path.join(this.dir, fileName);
  }

  createFile({ name, content, mode }: CreateTempFileOptions) {
    this.initialize();
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

export const DEFAULT_TEMP_DIR = new TempDir();
