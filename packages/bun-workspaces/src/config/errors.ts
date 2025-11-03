import { defineErrors } from "../internal/error";

export const ERRORS = defineErrors(
  "ConfigFileNotFound",
  "InvalidConfigFile",
  "InvalidConfigFileFormat",
);
