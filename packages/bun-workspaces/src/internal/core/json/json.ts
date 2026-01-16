export type JSONData = JSONPrimitive | JSONObject | JSONArray;

type JsonPrimitiveMap = {
  string: string;
  number: number;
  boolean: boolean;
  null: null;
};

export type JSONPrimitiveName = keyof JsonPrimitiveMap;

export type NameToJsonPrimitive<Name extends JSONPrimitiveName> =
  JsonPrimitiveMap[Name];

export type JSONPrimitive = NameToJsonPrimitive<JSONPrimitiveName>;

export interface JSONObject {
  [key: string]: JSONData;
}

export type JSONArray = JSONData[];

export const isJsonObject = <T extends JSONObject = JSONObject>(
  value: unknown,
): value is T => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};
