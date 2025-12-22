import { defineErrors } from "../internal/core";

export const ERRORS = defineErrors(
  "ConfigFileNotFound",
  "InvalidConfigFile",
  "InvalidConfigFileFormat",
);
