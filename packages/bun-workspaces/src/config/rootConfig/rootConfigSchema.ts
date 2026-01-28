import type { JSONSchema } from "json-schema-to-ts";

export const ROOT_CONFIG_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    defaults: {
      type: "object",
      additionalProperties: false,
      properties: {
        parallelMax: {
          type: ["number", "string"],
        },
        shell: {
          type: "string",
        },
        includeRootWorkspace: {
          type: "boolean",
        },
      },
    },
  },
} as const satisfies JSONSchema;
