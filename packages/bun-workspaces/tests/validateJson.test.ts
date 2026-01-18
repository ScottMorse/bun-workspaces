import { describe, test, expect } from "bun:test";
import {
  type BunWorkspacesError,
  type INVALID_JSON_ERRORS,
  validateJSONShape,
} from "../src/internal/core";

const simplifyErrors = (errors: BunWorkspacesError[]) =>
  errors.map((error) => ({
    message: error.message,
    name: error.name as keyof typeof INVALID_JSON_ERRORS,
  }));

describe("validateJSONShape", () => {
  test("validateJSONShape - primitives", () => {
    expect(
      simplifyErrors(
        validateJSONShape("test", "test-label", { primitive: "string" }),
      ),
    ).toEqual([]);

    expect(
      simplifyErrors(
        validateJSONShape(123, "test-label", { primitive: "number" }),
      ),
    ).toEqual([]);

    expect(
      simplifyErrors(
        validateJSONShape(true, "test-label", { primitive: "boolean" }),
      ),
    ).toEqual([]);

    expect(
      simplifyErrors(
        validateJSONShape(false, "test-label", { primitive: "boolean" }),
      ),
    ).toEqual([]);

    expect(
      simplifyErrors(
        validateJSONShape(null, "test-label", { primitive: "null" }),
      ),
    ).toEqual([]);

    expect(
      simplifyErrors(
        validateJSONShape(123, "test-label", {
          primitive: ["number", "string"],
        }),
      ),
    ).toEqual([]);

    expect(
      simplifyErrors(
        validateJSONShape(false, "test-label", { primitive: "number" }),
      ),
    ).toEqual([
      {
        message: "Expected test-label to be of type number. Received: false",
        name: "NotJSONPrimitive",
      },
    ]);

    expect(
      simplifyErrors(
        validateJSONShape(123, "test-label", {
          primitive: ["string", "number"],
        }),
      ),
    ).toEqual([]);

    expect(
      simplifyErrors(
        validateJSONShape(null, "test-label", {
          primitive: ["number", "string", "boolean"],
        }),
      ),
    ).toEqual([
      {
        message:
          "Expected test-label to be of type number | string | boolean. Received: null",
        name: "NotJSONPrimitive",
      },
    ]);

    expect(
      simplifyErrors(
        validateJSONShape(null, "test-label", {
          primitive: ["number", "string", "boolean", "null"],
        }),
      ),
    ).toEqual([]);

    expect(
      simplifyErrors(
        validateJSONShape(null, "test-label", {
          primitive: ["number", "boolean", "string"],
        }),
      ),
    ).toEqual([
      {
        message:
          "Expected test-label to be of type number | boolean | string. Received: null",
        name: "NotJSONPrimitive",
      },
    ]);
  });

  test("validateJSONShape - not an object", () => {
    expect(
      simplifyErrors(
        validateJSONShape(123, "test-label", {
          properties: { test: { type: { primitive: ["string"] } } },
        }),
      ),
    ).toEqual([
      {
        message: "Expected test-label to be a JSON object. Received: 123",
        name: "NotJSONObject",
      },
    ]);

    expect(
      simplifyErrors(
        validateJSONShape(true, "test-label", {
          properties: { test: { type: { primitive: ["string"] } } },
        }),
      ),
    ).toEqual([
      {
        message: "Expected test-label to be a JSON object. Received: true",
        name: "NotJSONObject",
      },
    ]);

    expect(
      simplifyErrors(
        validateJSONShape(null, "test-label", {
          properties: { test: { type: { primitive: ["string"] } } },
        }),
      ),
    ).toEqual([
      {
        message: "Expected test-label to be a JSON object. Received: null",
        name: "NotJSONObject",
      },
    ]);

    expect(
      simplifyErrors(
        validateJSONShape(undefined, "test-label", {
          properties: { test: { type: { primitive: ["string"] } } },
        }),
      ),
    ).toEqual([
      {
        message: "Expected test-label to be a JSON value: undefined",
        name: "NotJSONValue",
      },
    ]);

    expect(
      simplifyErrors(
        validateJSONShape(
          () => {
            void 0;
          },
          "test-label",
          {
            properties: { test: { type: { primitive: ["string"] } } },
          },
        ),
      ),
    ).toEqual([
      {
        message: "Expected test-label to be a JSON value: () => {}",
        name: "NotJSONValue",
      },
    ]);

    expect(
      simplifyErrors(
        validateJSONShape([], "test-label", {
          properties: { test: { type: { primitive: ["string"] } } },
        }),
      ),
    ).toEqual([
      {
        message: "Expected test-label to be a JSON object. Received: array",
        name: "NotJSONObject",
      },
    ]);
  });

  test("validateJSONShape - objects - 1 level", () => {
    expect(
      simplifyErrors(
        validateJSONShape({}, "test-label", {
          properties: {
            test: { type: { primitive: ["string"] }, optional: true },
          },
        }),
      ),
    ).toEqual([]);

    expect(
      simplifyErrors(
        validateJSONShape({}, "test label", {
          properties: { test: { type: { primitive: ["string"] } } },
        }),
      ),
    ).toEqual([
      {
        name: "JSONObjectMissingProperty",
        message: "Expected test label to have property: test",
      },
    ]);

    expect(
      simplifyErrors(
        validateJSONShape(
          { test: ["my-value", "my-next-value"] },
          "test-label",
          {
            properties: {
              test: { type: { item: { primitive: ["string"] } } },
            },
          },
        ),
      ),
    ).toEqual([]);

    expect(
      simplifyErrors(
        validateJSONShape({ test2: false }, "test-label", {
          properties: {
            test: {
              type: { item: { primitive: ["string"] } },
              optional: true,
            },
            test2: { type: { primitive: "boolean" } },
          },
        }),
      ),
    ).toEqual([]);

    expect(
      simplifyErrors(
        validateJSONShape({ test2: false }, "test-label", {
          properties: {
            test: {
              type: { item: { primitive: ["null"] } },
            },
            test2: { type: { primitive: "boolean" }, optional: true },
          },
        }),
      ),
    ).toEqual([
      {
        name: "JSONObjectMissingProperty",
        message: "Expected test-label to have property: test",
      },
    ]);

    expect(
      simplifyErrors(
        validateJSONShape(
          { test: false, test2: {}, test3: true },
          "test-label",
          {
            properties: {
              test: { type: { primitive: "boolean" } },
              test2: { type: { properties: {} } },
            },
          },
        ),
      ),
    ).toEqual([
      {
        name: "JSONObjectUnexpectedProperty",
        message: "Object test-label has unexpected property: test3",
      },
    ]);
  });

  test("validateJSONShape - objects - deep", () => {
    expect(
      simplifyErrors(
        validateJSONShape(
          { test: { test2: { test3: "my-value" } } },
          "test-label",
          {
            properties: {
              test: {
                type: {
                  properties: {
                    test2: {
                      type: {
                        properties: {
                          test3: { type: { primitive: "string" } },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        ),
      ),
    ).toEqual([]);

    expect(
      simplifyErrors(
        validateJSONShape(
          { test: { test2: { test3: ["my-value", "my-next-value"] } } },
          "test-label",
          {
            properties: {
              test: {
                type: {
                  properties: {
                    test2: {
                      type: {
                        properties: {
                          test3: {
                            type: { item: { primitive: "string" } },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        ),
      ),
    ).toEqual([]);

    expect(
      simplifyErrors(
        validateJSONShape({ test: { test2: {} } }, "test-label", {
          properties: {
            test: {
              type: {
                properties: {
                  test2: {
                    type: {
                      properties: {
                        test3: {
                          type: { item: { primitive: "string" } },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        }),
      ),
    ).toEqual([
      {
        name: "JSONObjectMissingProperty",
        message: "Expected test-label.test.test2 to have property: test3",
      },
    ]);

    expect(
      simplifyErrors(
        validateJSONShape(
          {
            test: {
              test2: {
                test3: [
                  {
                    test4: "my-value",
                  },
                  {
                    test4: "my-next-value",
                    test5: "my-next-next-value",
                  },
                  {
                    test5: "my-next-next-next-next-value",
                  },
                ],
              },
            },
          },
          "test-label",
          {
            properties: {
              test: {
                type: {
                  properties: {
                    test2: {
                      type: {
                        properties: {
                          test3: {
                            type: {
                              item: {
                                properties: {
                                  test4: {
                                    type: { primitive: "string" },
                                    optional: true,
                                  },
                                  test5: { type: { primitive: "string" } },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        ),
      ),
    ).toEqual([
      {
        name: "JSONObjectMissingProperty",
        message:
          "Expected test-label.test.test2.test3[0] to have property: test5",
      },
    ]);

    expect(
      simplifyErrors(
        validateJSONShape(
          {
            test: {
              test2: {
                test3: [
                  {
                    test4: "my-value",
                  },
                  {
                    test4: "my-next-value",
                    test5: "my-next-next-value",
                  },
                  {
                    test5: "my-next-next-next-next-value",
                  },
                ],
              },
              test6: { test7: false },
            },
          },
          "test-label",
          {
            properties: {
              test: {
                type: {
                  properties: {
                    test2: {
                      type: {
                        properties: {
                          test3: {
                            type: {
                              item: {
                                properties: {
                                  test4: {
                                    type: { primitive: "string" },
                                  },
                                  test5: {
                                    type: { primitive: "string" },
                                    optional: true,
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                    test6: {
                      type: {
                        properties: {
                          test7: { type: { primitive: "null" } },
                        },
                      },
                    },
                    test8: { type: { primitive: "string" } },
                  },
                },
              },
            },
          },
        ),
      ),
    ).toEqual([
      {
        name: "JSONObjectMissingProperty",
        message:
          "Expected test-label.test.test2.test3[2] to have property: test4",
      },
      {
        name: "NotJSONPrimitive",
        message:
          "Expected test-label.test.test6.test7 to be of type null. Received: false",
      },
      {
        name: "JSONObjectMissingProperty",
        message: "Expected test-label.test to have property: test8",
      },
    ]);
  });

  test("validateJSONShape - arrays", () => {
    expect(
      simplifyErrors(
        validateJSONShape([], "test-label", {
          item: { primitive: "string" },
        }),
      ),
    ).toEqual([]);

    expect(
      simplifyErrors(
        validateJSONShape([123, "test"], "test-label", {
          item: { primitive: "string" },
        }),
      ),
    ).toEqual([
      {
        name: "NotJSONPrimitive",
        message: "Expected test-label[0] to be of type string. Received: 123",
      },
    ]);

    expect(
      simplifyErrors(
        validateJSONShape([123, "test"], "test-label", {
          item: { primitive: ["string", "number"] },
        }),
      ),
    ).toEqual([]);

    expect(
      simplifyErrors(
        validateJSONShape([{ test: "my-value", test2: null }], "test-label", {
          item: {
            properties: {
              test: { type: { primitive: "string" } },
              test2: { type: { primitive: ["null", "string"] } },
            },
          },
        }),
      ),
    ).toEqual([]);

    expect(
      simplifyErrors(
        validateJSONShape(
          [{ test: "my-value", test2: null, test3: {} }],
          "test-label",
          {
            item: {
              properties: {
                test: { type: { primitive: "string" } },
                test2: { type: { primitive: ["null", "string"] } },
                test3: {
                  type: {
                    properties: {
                      test4: { type: { primitive: "number" }, optional: true },
                    },
                  },
                },
              },
            },
          },
        ),
      ),
    ).toEqual([]);

    expect(
      simplifyErrors(
        validateJSONShape(
          [
            { test: "my-value", test2: null, test3: { test4: 123 } },
            { test: "my-value", test2: null, test3: { test4: "my-value" } },
          ],
          "test-label",
          {
            item: {
              properties: {
                test: { type: { primitive: "string" } },
                test2: { type: { primitive: ["null", "string"] } },
                test3: {
                  type: {
                    properties: {
                      test4: { type: { primitive: "number" }, optional: true },
                    },
                  },
                },
              },
            },
          },
        ),
      ),
    ).toEqual([
      {
        name: "NotJSONPrimitive",
        message:
          "Expected test-label[1].test3.test4 to be of type number. Received: my-value",
      },
    ]);
  });
});
