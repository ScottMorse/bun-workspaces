export type JSONData = JSONPrimitive | JSONObject | JSONArray;

export type JSONPrimitive = string | number | boolean | null;

export interface JSONObject {
  [key: string]: JSONData;
}

export type JSONArray = JSONData[];

export const isJsonObject = <T extends JSONObject = JSONObject>(
  value: unknown,
): value is T => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};
