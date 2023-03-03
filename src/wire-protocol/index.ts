export * from "./request";
export * from "./response";

/**
 * A type to describe plain JSON object
 * @remarks Requiring plain JSON values as request arguments makes it a
 * Typescript error to provide a Class instance as an argument. This is
 * necessary because the driver does not have a way to ensure results are
 * encoded beack into the provided Class.
 */
export type JSONObject = {
  [key: string]: JSONValue;
};

/**
 * A type to describe plain JSON values
 * @remarks Requiring plain JSON values as request arguments makes it a
 * Typescript error to provide a Class instance as an argument. This is
 * necessary because the driver does not have a way to ensure results are
 * encoded beack into the provided Class.
 */
export type JSONValue =
  | null
  | string
  | number
  | bigint
  | boolean
  | JSONObject
  | Array<JSONValue>;
