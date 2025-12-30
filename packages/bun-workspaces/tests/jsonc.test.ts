import fs from "fs";
import path from "path";
import { describe, test, expect } from "bun:test";
import { isJsonObject, parseJsonc } from "../src/internal/core/json";

// Note that the parser is based on the package strip-json-comments. Tests are here for sanity.

describe("JSONC parser works", () => {
  test("Parse plain JSON", () => {
    expect(parseJsonc("{}")).toEqual({});
    expect(parseJsonc('{"name": "test"}')).toEqual({ name: "test" });
    expect(parseJsonc('{"name": "test", "version": "1.0.0"}')).toEqual({
      name: "test",
      version: "1.0.0",
    });
    expect(parseJsonc('{"number":42}')).toEqual({ number: 42 });
    expect(parseJsonc('{"number" : 42}')).toEqual({ number: 42 });
    expect(parseJsonc('{"number":  42  }')).toEqual({ number: 42 });
    expect(parseJsonc('{"boolean":true}')).toEqual({ boolean: true });
    expect(parseJsonc('{"boolean": false}')).toEqual({ boolean: false });
    expect(parseJsonc('{"null":null}')).toEqual({ null: null });
    expect(parseJsonc('{"null" : \nnull }')).toEqual({ null: null });
    expect(parseJsonc('{"array":[]}')).toEqual({ array: [] });
    expect(parseJsonc('{"array": [1,2,3]}')).toEqual({ array: [1, 2, 3] });
    expect(parseJsonc('{"array" : [ "a" , "b" , "c" ] }')).toEqual({
      array: ["a", "b", "c"],
    });
    expect(parseJsonc('{"nested":{"key":"value"}}')).toEqual({
      nested: { key: "value" },
    });
    expect(parseJsonc('{"nested" : { "key" : "value" } }')).toEqual({
      nested: { key: "value" },
    });
    expect(
      parseJsonc('{"mixed":[1,"string",\ntrue,false,null,{"obj":42},[1,2]]}'),
    ).toEqual({
      mixed: [1, "string", true, false, null, { obj: 42 }, [1, 2]],
    });
    expect(
      parseJsonc(
        '{"mixed" : [ 1 , "string" , true ,\nfalse , null , { "obj" : 42 } , [ 1 , 2 ] ] }',
      ),
    ).toEqual({
      mixed: [1, "string", true, false, null, { obj: 42 }, [1, 2]],
    });
    expect(parseJsonc('{"numbers":[0,-1,3.14,-2.5,1e10]}')).toEqual({
      numbers: [0, -1, 3.14, -2.5, 1e10],
    });
    expect(parseJsonc('{"emptyString":""}')).toEqual({ emptyString: "" });
    expect(parseJsonc('{"emptyArray":[],"emptyObject":{}}')).toEqual({
      emptyArray: [],
      emptyObject: {},
    });
  });

  test("Parse JSONC with comments", () => {
    expect(parseJsonc('{"name": "test" // comment\n}')).toEqual({
      name: "test",
    });
    expect(parseJsonc('{"name": "test" }/* comment */')).toEqual({
      name: "test",
    });
    expect(
      parseJsonc('{"name": "test", // comment\n"version": "1.0.0"}'),
    ).toEqual({ name: "test", version: "1.0.0" });
    expect(
      parseJsonc('{"name": "test", /* comment */\n"version": "1.0.0"}'),
    ).toEqual({ name: "test", version: "1.0.0" });
    expect(
      parseJsonc('{"name": "test", // comment\n"version": "1.0.0" }// comment'),
    ).toEqual({ name: "test", version: "1.0.0" });
    expect(
      parseJsonc(
        '{"name": "test", /* comment */\n"version": "1.0.0" }/* comment */',
      ),
    ).toEqual({ name: "test", version: "1.0.0" });
    expect(
      parseJsonc(
        '{"name": "test", /* comment */\n"version": "1.0.0" }/* comment */',
      ),
    ).toEqual({ name: "test", version: "1.0.0" });
    expect(
      parseJsonc(
        '{"name": "test", /* comment */\n"version": "1.0.0" /* comment */}',
      ),
    ).toEqual({ name: "test", version: "1.0.0" });
    expect(
      parseJsonc(
        '{"name": "test", /* comment */\n"version": "1.0.0" /* comment */}',
      ),
    ).toEqual({ name: "test", version: "1.0.0" });
  });

  test("Parse the project bun.lock", () => {
    expect(
      isJsonObject(
        parseJsonc(
          fs.readFileSync(
            path.join(
              __dirname,
              "..",
              "..",
              "..",
              process.env.IS_BUILD === "true" ? "../" : "",
              "bun.lock",
            ),
            "utf8",
          ),
        ),
      ),
    ).toBe(true);
  });
});
