"use strict";
module.exports = validate11;
module.exports.default = validate11;
const schema12 = {
  type: "object",
  additionalProperties: false,
  properties: {
    defaults: {
      type: "object",
      additionalProperties: false,
      properties: {
        parallelMax: { type: ["number", "string"] },
        shell: { type: "string" },
      },
    },
  },
};
function validate11(
  data,
  { instancePath = "", parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      const _errs1 = errors;
      for (const key0 in data) {
        if (!(key0 === "defaults")) {
          validate11.errors = [
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
        if (data.defaults !== undefined) {
          let data0 = data.defaults;
          const _errs2 = errors;
          if (errors === _errs2) {
            if (data0 && typeof data0 == "object" && !Array.isArray(data0)) {
              const _errs4 = errors;
              for (const key1 in data0) {
                if (!(key1 === "parallelMax" || key1 === "shell")) {
                  validate11.errors = [
                    {
                      instancePath: instancePath + "/defaults",
                      schemaPath: "#/properties/defaults/additionalProperties",
                      keyword: "additionalProperties",
                      params: { additionalProperty: key1 },
                      message: "must NOT have additional properties",
                    },
                  ];
                  return false;
                  break;
                }
              }
              if (_errs4 === errors) {
                if (data0.parallelMax !== undefined) {
                  let data1 = data0.parallelMax;
                  const _errs5 = errors;
                  if (
                    !(typeof data1 == "number" && isFinite(data1)) &&
                    typeof data1 !== "string"
                  ) {
                    validate11.errors = [
                      {
                        instancePath: instancePath + "/defaults/parallelMax",
                        schemaPath:
                          "#/properties/defaults/properties/parallelMax/type",
                        keyword: "type",
                        params: {
                          type: schema12.properties.defaults.properties
                            .parallelMax.type,
                        },
                        message: "must be number,string",
                      },
                    ];
                    return false;
                  }
                  var valid1 = _errs5 === errors;
                } else {
                  var valid1 = true;
                }
                if (valid1) {
                  if (data0.shell !== undefined) {
                    const _errs7 = errors;
                    if (typeof data0.shell !== "string") {
                      validate11.errors = [
                        {
                          instancePath: instancePath + "/defaults/shell",
                          schemaPath:
                            "#/properties/defaults/properties/shell/type",
                          keyword: "type",
                          params: { type: "string" },
                          message: "must be string",
                        },
                      ];
                      return false;
                    }
                    var valid1 = _errs7 === errors;
                  } else {
                    var valid1 = true;
                  }
                }
              }
            } else {
              validate11.errors = [
                {
                  instancePath: instancePath + "/defaults",
                  schemaPath: "#/properties/defaults/type",
                  keyword: "type",
                  params: { type: "object" },
                  message: "must be object",
                },
              ];
              return false;
            }
          }
        }
      }
    } else {
      validate11.errors = [
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
  validate11.errors = vErrors;
  return errors === 0;
}
