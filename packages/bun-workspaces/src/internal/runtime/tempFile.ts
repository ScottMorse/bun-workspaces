import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { runOnExit } from "../runtime/onExit";

const TEMP_DIR = path.join(os.tmpdir(), "bun-workspaces");

export const createTempDir = () => {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
};

export const cleanTempDir = () => {
  fs.rmSync(TEMP_DIR, { force: true, recursive: true });
  createTempDir();
};

export const createTempFilePath = (fileName: string) =>
  path.join(TEMP_DIR, fileName);

export const createTempFile = (fileName: string, fileContent: string) => {
  const filePath = createTempFilePath(fileName);

  createTempDir();
  fs.writeFileSync(filePath, fileContent, { encoding: "utf8" });

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
