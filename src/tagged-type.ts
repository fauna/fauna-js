import {
  DateStub,
  Document,
  DocumentReference,
  Module,
  NamedDocument,
  NamedDocumentReference,
  TimeStub,
  Page,
} from "./values";
import { QueryValueObject, QueryValue } from "./wire-protocol";

/**
 * TaggedType provides the encoding/decoding of the Fauna Tagged Type formatting
 */
export class TaggedTypeFormat {
  /**
   * Encode the Object to the Tagged Type format for Fauna
   *
   * @param obj - Object that will be encoded
   * @returns Map of result
   */
  static encode(obj: any): any {
    return encode(obj);
  }

  /**
   * Decode the JSON string result from Fauna to remove Tagged Type formatting.
   *
   * @param input - JSON string result from Fauna
   * @returns object of result of FQL query
   */
  static decode(input: string): any {
    return JSON.parse(input, (_, value: any) => {
      if (value == null) return null;
      if (value["@mod"]) {
        return new Module(value["@mod"]);
      } else if (value["@doc"]) {
        // WIP: The string-based ref is being removed from the API
        if (typeof value["@doc"] === "string") {
          const [modName, id] = value["@doc"].split(":");
          return new DocumentReference({ coll: modName, id: id });
        }
        // if not a docref string, then it is an object.
        const obj = value["@doc"];
        if (obj.id) {
          return new Document(obj);
        } else {
          return new NamedDocument(obj);
        }
      } else if (value["@ref"]) {
        const obj = value["@ref"];
        if (obj.id) {
          return new DocumentReference(obj);
        } else {
          return new NamedDocumentReference(obj);
        }
      } else if (value["@set"]) {
        return new Page(value["@set"]);
      } else if (value["@int"]) {
        return Number(value["@int"]);
      } else if (value["@long"]) {
        return BigInt(value["@long"]);
      } else if (value["@double"]) {
        return Number(value["@double"]);
      } else if (value["@date"]) {
        return DateStub.from(value["@date"]);
      } else if (value["@time"]) {
        return TimeStub.from(value["@time"]);
      } else if (value["@object"]) {
        return value["@object"];
      }

      return value;
    });
  }
}

type TaggedDate = { "@date": string };
type TaggedDouble = { "@double": string };
type TaggedInt = { "@int": string };
type TaggedLong = { "@long": string };
type TaggedMod = { "@mod": string };
type TaggedObject = { "@object": QueryValueObject };
type TaggedRef = {
  "@ref": { id: string; coll: TaggedMod } | { name: string; coll: TaggedMod };
};
// WIP: core does not accept `@set` tagged values
// type TaggedSet = { "@set": { data: QueryValue[]; after?: string } };
type TaggedTime = { "@time": string };

export const LONG_MIN = BigInt("-9223372036854775808");
export const LONG_MAX = BigInt("9223372036854775807");

const encodeMap = {
  bigint: (value: bigint): TaggedLong => {
    if (value < LONG_MIN || value > LONG_MAX) {
      throw new RangeError(
        "Precision loss when converting BigInt to Fauna type"
      );
    }

    return {
      "@long": value.toString(),
    };
  },
  number: (value: number): TaggedDouble | TaggedInt | TaggedLong => {
    if (
      value === Number.POSITIVE_INFINITY ||
      value === Number.NEGATIVE_INFINITY
    ) {
      throw new RangeError(`Cannot convert ${value} to a Fauna type.`);
    }

    if (`${value}`.includes(".")) {
      return { "@double": value.toString() };
    } else {
      if (value >= -(2 ** 31) && value <= 2 ** 31 - 1) {
        return { "@int": value.toString() };
      } else if (Number.isSafeInteger(value)) {
        return {
          "@long": value.toString(),
        };
      }
      return { "@double": value.toString() };
    }
  },
  string: (value: string): string => {
    return value;
  },
  object: (input: QueryValueObject): TaggedObject | QueryValueObject => {
    let wrapped = false;
    const _out: QueryValueObject = {};

    for (const k in input) {
      if (k.startsWith("@")) {
        wrapped = true;
      }
      if (input[k] !== undefined) {
        _out[k] = encode(input[k]);
      }
    }
    return wrapped ? { "@object": _out } : _out;
  },
  array: (input: Array<QueryValue>): Array<QueryValue> => {
    const _out: QueryValue = [];
    for (const i in input) _out.push(encode(input[i]));
    return _out;
  },
  date: (dateValue: Date): TaggedTime => ({
    "@time": dateValue.toISOString(),
  }),
  faunadate: (value: DateStub): TaggedDate => ({ "@date": value.dateString }),
  faunatime: (value: TimeStub): TaggedTime => ({ "@time": value.isoString }),
  module: (value: Module): TaggedMod => ({ "@mod": value.name }),
  documentReference: (value: DocumentReference): TaggedRef => ({
    "@ref": { id: value.id, coll: { "@mod": value.coll.name } },
  }),
  document: (value: Document): TaggedRef => ({
    "@ref": { id: value.id, coll: { "@mod": value.coll.name } },
  }),
  namedDocumentReference: (value: NamedDocumentReference): TaggedRef => ({
    "@ref": { name: value.name, coll: { "@mod": value.coll.name } },
  }),
  namedDocument: (value: NamedDocument): TaggedRef => ({
    "@ref": { name: value.name, coll: { "@mod": value.coll.name } },
  }),
  set: (value: Page<any>) => ({
    // WIP: core does not accept `@set` tagged values, yet, so just unwrap
    // "@set": { data: encodeMap["array"](value.data), after: value.after },
    data: encodeMap["array"](value.data),
    after: value.after,
  }),
};

const encode = (input: QueryValue): QueryValue => {
  if (input === undefined) {
    throw new TypeError("Passing undefined as a QueryValue is not supported");
  }
  switch (typeof input) {
    case "bigint":
      return encodeMap["bigint"](input);
    case "string":
      return encodeMap["string"](input);
    case "number":
      return encodeMap["number"](input);
    case "boolean":
      return input;
    case "object":
      if (input == null) {
        return null;
      } else if (Array.isArray(input)) {
        return encodeMap["array"](input);
      } else if (input instanceof Date) {
        return encodeMap["date"](input);
      } else if (input instanceof DateStub) {
        return encodeMap["faunadate"](input);
      } else if (input instanceof TimeStub) {
        return encodeMap["faunatime"](input);
      } else if (input instanceof Module) {
        return encodeMap["module"](input);
      } else if (input instanceof Document) {
        // Document extends DocumentReference, so order is important here
        return encodeMap["document"](input);
      } else if (input instanceof DocumentReference) {
        return encodeMap["documentReference"](input);
      } else if (input instanceof NamedDocument) {
        // NamedDocument extends NamedDocumentReference, so order is important here
        return encodeMap["namedDocument"](input);
      } else if (input instanceof NamedDocumentReference) {
        return encodeMap["namedDocumentReference"](input);
      } else if (input instanceof Page) {
        return encodeMap["set"](input);
      } else {
        return encodeMap["object"](input);
      }
  }
  // anything here would be dead code
};
