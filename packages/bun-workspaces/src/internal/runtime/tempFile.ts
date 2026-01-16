import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { logger } from "../logger";
import { runOnExit } from "../runtime/onExit";

const TEMP_DIR = path.join(os.tmpdir(), "bun-workspaces");

export const createTempDir = (clean = false) => {
  if (clean) {
    fs.rmSync(path.join(TEMP_DIR), { force: true, recursive: true });
  }
  fs.mkdirSync(TEMP_DIR, { recursive: true });
  fs.chmodSync(TEMP_DIR, 0o700);
  logger.debug(`Created temp dir: ${TEMP_DIR}`);
};

export const createTempFilePath = (fileName: string) =>
  path.join(TEMP_DIR, fileName);

export type CreateTempFileOptions = {
  fileName: string;
  fileContent: string;
  mode?: fs.Mode;
};

export const createTempFile = ({
  fileName,
  fileContent,
  mode,
}: CreateTempFileOptions) => {
  const filePath = createTempFilePath(fileName);

  createTempDir();
  fs.writeFileSync(filePath, fileContent, {
    encoding: "utf8",
    mode: mode ?? 0o644,
  });

  let isClean = false;
  const cleanup = () => {
    if (!isClean) {
      fs.rmSync(filePath, { force: true });
      isClean = true;
    }
  };

  runOnExit(cleanup);

  return { filePath, cleanup };
};
