import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const TEMP_DIR = path.join(os.tmpdir(), "bun-workspaces");

export const createTempFilePath = (fileName: string) =>
  path.join(TEMP_DIR, fileName);

export const createTempFile = (fileName: string, fileContent: string) => {
  const filePath = createTempFilePath(fileName);

  fs.mkdirSync(TEMP_DIR, { recursive: true });
  fs.writeFileSync(filePath, fileContent, { encoding: "utf8" });

  let isClean = false;
  const cleanup = () => {
    if (!isClean) {
      fs.rmSync(filePath, { force: true });
      isClean = true;
    }
  };

  process.on("exit", cleanup);

  return { filePath, cleanup };
};
