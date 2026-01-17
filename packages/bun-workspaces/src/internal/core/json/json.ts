import { isTypeof } from "../language";


type JSONPrimitiveMap = {
  string: string;
  number: number;
  boolean: boolean;
  null: null;
};

export type JSONPrimitiveName = keyof JSONPrimitiveMap;

export type NameToJSONPrimitive<Name extends JSONPrimitiveName> =
  JSONPrimitiveMap[Name];

export type JSONPrimitive = NameToJSONPrimitive<JSONPrimitiveName>;

export interface JSONObject {
  [key: string]: JSONData;
}

export type JSONArray = JSONData[];

export type JSONData = JSONPrimitive | JSONObject | JSONArray;

export const isJSONPrimitive = (value: unknown): value is JSONPrimitive =>  isTypeof(value,"string", "number", "boolean") || value === null;


export const isJSONArray = <T extends JSONArray = JSONArray>(value: unknown): value is T =>  Array.isArray(value) && value.every(isJSON);

export const isJSONObject = <T extends JSONObject = JSONObject>(
  value: unknown,
): value is T =>  typeof value === "object" && value !== null && (value as object)?.constructor === Object

export const isJSON = (value: unknown): value is JSONData =>  isJSONPrimitive(value) || isJSONArray(value) || isJSONObject(value);
