import fs from "fs";
import path from "path";
import Ajv from "ajv";
import standaloneCode from "ajv/dist/standalone";
import {
  WORKSPACE_CONFIG_JSON_SCHEMA,
  ROOT_CONFIG_JSON_SCHEMA,
} from "../src/config";

const ajv = new Ajv({ code: { source: true }, allowUnionTypes: true });
const validateWorkspaceConfig = ajv.compile(WORKSPACE_CONFIG_JSON_SCHEMA);
const validateRootConfig = ajv.compile(ROOT_CONFIG_JSON_SCHEMA);
const workspaceModuleCode = standaloneCode(ajv, validateWorkspaceConfig);
const rootModuleCode = standaloneCode(ajv, validateRootConfig);

if (import.meta.main) {
  fs.writeFileSync(
    path.join(
      __dirname,
      "../src/internal/generated/ajv/validateWorkspaceConfig.js",
    ),
    workspaceModuleCode,
  );

  fs.writeFileSync(
    path.join(__dirname, "../src/internal/generated/ajv/validateRootConfig.js"),
    rootModuleCode,
  );
}
