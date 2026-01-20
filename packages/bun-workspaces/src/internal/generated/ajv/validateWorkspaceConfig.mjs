"use strict";
module.exports = validate10;
module.exports.default = validate10;
const schema11 = {
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
        properties: { order: { type: "number" } },
        additionalProperties: false,
      },
    },
  },
};
function validate10(
  data,
  { instancePath = "", parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      const _errs1 = errors;
      for (const key0 in data) {
        if (!(key0 === "alias" || key0 === "scripts")) {
          validate10.errors = [
            {
              instancePath,
              schemaPath: "#/additionalProperties",
              keyword: "additionalProperties",
              params: { additionalProperty: key0 },
              message: "must NOT have additional properties",
            },
          ];
          return false;
          break;
        }
      }
      if (_errs1 === errors) {
        if (data.alias !== undefined) {
          let data0 = data.alias;
          const _errs2 = errors;
          if (typeof data0 !== "string" && !Array.isArray(data0)) {
            validate10.errors = [
              {
                instancePath: instancePath + "/alias",
                schemaPath: "#/properties/alias/type",
                keyword: "type",
                params: { type: schema11.properties.alias.type },
                message: "must be string,array",
              },
            ];
            return false;
          }
          if (errors === _errs2) {
            if (Array.isArray(data0)) {
              var valid1 = true;
              const len0 = data0.length;
              for (let i0 = 0; i0 < len0; i0++) {
                const _errs4 = errors;
                if (typeof data0[i0] !== "string") {
                  validate10.errors = [
                    {
                      instancePath: instancePath + "/alias/" + i0,
                      schemaPath: "#/properties/alias/items/type",
                      keyword: "type",
                      params: { type: "string" },
                      message: "must be string",
                    },
                  ];
                  return false;
                }
                var valid1 = _errs4 === errors;
                if (!valid1) {
                  break;
                }
              }
              if (valid1) {
                let i1 = data0.length;
                let j0;
                if (i1 > 1) {
                  const indices0 = {};
                  for (; i1--; ) {
                    let item0 = data0[i1];
                    if (typeof item0 !== "string") {
                      continue;
                    }
                    if (typeof indices0[item0] == "number") {
                      j0 = indices0[item0];
                      validate10.errors = [
                        {
                          instancePath: instancePath + "/alias",
                          schemaPath: "#/properties/alias/uniqueItems",
                          keyword: "uniqueItems",
                          params: { i: i1, j: j0 },
                          message:
                            "must NOT have duplicate items (items ## " +
                            j0 +
                            " and " +
                            i1 +
                            " are identical)",
                        },
                      ];
                      return false;
                      break;
                    }
                    indices0[item0] = i1;
                  }
                }
              }
            }
          }
          var valid0 = _errs2 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.scripts !== undefined) {
            let data2 = data.scripts;
            const _errs6 = errors;
            if (errors === _errs6) {
              if (data2 && typeof data2 == "object" && !Array.isArray(data2)) {
                for (const key1 in data2) {
                  let data3 = data2[key1];
                  const _errs9 = errors;
                  if (errors === _errs9) {
                    if (
                      data3 &&
                      typeof data3 == "object" &&
                      !Array.isArray(data3)
                    ) {
                      const _errs11 = errors;
                      for (const key2 in data3) {
                        if (!(key2 === "order")) {
                          validate10.errors = [
                            {
                              instancePath:
                                instancePath +
                                "/scripts/" +
                                key1.replace(/~/g, "~0").replace(/\//g, "~1"),
                              schemaPath:
                                "#/properties/scripts/additionalProperties/additionalProperties",
                              keyword: "additionalProperties",
                              params: { additionalProperty: key2 },
                              message: "must NOT have additional properties",
                            },
                          ];
                          return false;
                          break;
                        }
                      }
                      if (_errs11 === errors) {
                        if (data3.order !== undefined) {
                          let data4 = data3.order;
                          if (!(typeof data4 == "number" && isFinite(data4))) {
                            validate10.errors = [
                              {
                                instancePath:
                                  instancePath +
                                  "/scripts/" +
                                  key1
                                    .replace(/~/g, "~0")
                                    .replace(/\//g, "~1") +
                                  "/order",
                                schemaPath:
                                  "#/properties/scripts/additionalProperties/properties/order/type",
                                keyword: "type",
                                params: { type: "number" },
                                message: "must be number",
                              },
                            ];
                            return false;
                          }
                        }
                      }
                    } else {
                      validate10.errors = [
                        {
                          instancePath:
                            instancePath +
                            "/scripts/" +
                            key1.replace(/~/g, "~0").replace(/\//g, "~1"),
                          schemaPath:
                            "#/properties/scripts/additionalProperties/type",
                          keyword: "type",
                          params: { type: "object" },
                          message: "must be object",
                        },
                      ];
                      return false;
                    }
                  }
                  var valid3 = _errs9 === errors;
                  if (!valid3) {
                    break;
                  }
                }
              } else {
                validate10.errors = [
                  {
                    instancePath: instancePath + "/scripts",
                    schemaPath: "#/properties/scripts/type",
                    keyword: "type",
                    params: { type: "object" },
                    message: "must be object",
                  },
                ];
                return false;
              }
            }
            var valid0 = _errs6 === errors;
          } else {
            var valid0 = true;
          }
        }
      }
    } else {
      validate10.errors = [
        {
          instancePath,
          schemaPath: "#/type",
          keyword: "type",
          params: { type: "object" },
          message: "must be object",
        },
      ];
      return false;
    }
  }
  validate10.errors = vErrors;
  return errors === 0;
}
