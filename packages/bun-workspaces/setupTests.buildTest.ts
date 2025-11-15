// @ts-expect-error - Importing from mjs file in build for build:test script
import { setLogLevel } from "./src/index.mjs";

setLogLevel("silent");
