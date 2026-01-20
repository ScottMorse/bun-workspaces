import type { JSONSchema } from "json-schema-to-ts";

export const WORKSPACE_CONFIG_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    alias: {
      type: ["string", "array"],
      items: { type: "string" },
      uniqueItems: true,
    },
    scripts: {
      type: "object",
      additionalProperties: {
        type: "object",
        properties: {
          order: {
            type: "number",
          },
        },
        additionalProperties: false,
      },
    },
  },
} satisfies JSONSchema;
