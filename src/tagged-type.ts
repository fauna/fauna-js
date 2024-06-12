import base64 from "base64-js";

import { ClientError } from "./errors";
import {
  DateStub,
  Document,
  DocumentReference,
  Module,
  NamedDocument,
  NamedDocumentReference,
  TimeStub,
  Page,
  NullDocument,
  EmbeddedSet,
  StreamToken,
} from "./values";
import {
  QueryValue,
  QueryInterpolation,
  ObjectFragment,
  ArrayFragment,
  FQLFragment,
  ValueFragment,
  TaggedType,
  TaggedLong,
  TaggedInt,
  TaggedDouble,
  TaggedObject,
  EncodedObject,
  TaggedTime,
  TaggedDate,
  TaggedMod,
  TaggedRef,
  TaggedBytes,
} from "./wire-protocol";
import { Query, QueryArgument, QueryArgumentObject } from "./query-builder";

export interface DecodeOptions {
  long_type: "number" | "bigint";
}

/**
 * TaggedType provides the encoding/decoding of the Fauna Tagged Type formatting
 */
export class TaggedTypeFormat {
  /**
   * Encode the value to the Tagged Type format for Fauna
   *
   * @param input - value that will be encoded
   * @returns Map of result
   */
  static encode(input: QueryArgument): TaggedType {
    return encode(input);
  }

  /**
   * Encode the value to a QueryInterpolation to send to Fauna
   *
   * @param input - value that will be encoded
   * @returns Map of result
   */
  static encodeInterpolation(input: QueryArgument): QueryInterpolation {
    return encodeInterpolation(input);
  }

  /**
   * Decode the JSON string result from Fauna to remove Tagged Type formatting.
   *
   * @param input - JSON string result from Fauna
   * @returns object of result of FQL query
   */
  static decode(input: string, decodeOptions: DecodeOptions): any {
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
        let ref: DocumentReference | NamedDocumentReference;
        if (obj.id) {
          ref = new DocumentReference(obj);
        } else {
          ref = new NamedDocumentReference(obj);
        }
        if ("exists" in obj && obj.exists === false) {
          return new NullDocument(ref, obj.cause);
        }
        return ref;
      } else if (value["@set"]) {
        if (typeof value["@set"] === "string") {
          return new EmbeddedSet(value["@set"]);
        }
        return new Page(value["@set"]);
      } else if (value["@int"]) {
        return Number(value["@int"]);
      } else if (value["@long"]) {
        const bigInt = BigInt(value["@long"]);
        if (decodeOptions.long_type === "number") {
          if (
            bigInt > Number.MAX_SAFE_INTEGER ||
            bigInt < Number.MIN_SAFE_INTEGER
          ) {
            console.warn(`Value is too large to be represented as a number. \
Returning as Number with loss of precision. Use long_type 'bigint' instead.`);
          }
          return Number(bigInt);
        }
        return bigInt;
      } else if (value["@double"]) {
        return Number(value["@double"]);
      } else if (value["@date"]) {
        return DateStub.from(value["@date"]);
      } else if (value["@time"]) {
        return TimeStub.from(value["@time"]);
      } else if (value["@object"]) {
        return value["@object"];
      } else if (value["@stream"]) {
        return new StreamToken(value["@stream"]);
      } else if (value["@bytes"]) {
        return base64toBuffer(value["@bytes"]);
      }

      return value;
    });
  }
}

export const LONG_MIN = BigInt("-9223372036854775808");
export const LONG_MAX = BigInt("9223372036854775807");
export const INT_MIN = -(2 ** 31);
export const INT_MAX = 2 ** 31 - 1;

const encodeMap = {
  bigint: (value: bigint): TaggedLong | TaggedInt => {
    if (value < LONG_MIN || value > LONG_MAX) {
      throw new RangeError(
        "BigInt value exceeds max magnitude for a 64-bit Fauna long. Use a 'number' to represent doubles beyond that limit.",
      );
    }
    if (value >= INT_MIN && value <= INT_MAX) {
      return { "@int": value.toString() };
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

    if (!Number.isInteger(value)) {
      return { "@double": value.toString() };
    } else {
      if (value >= INT_MIN && value <= INT_MAX) {
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
  object: (input: QueryArgumentObject): TaggedObject | EncodedObject => {
    let wrapped = false;
    const _out: EncodedObject = {};

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
  array: (input: QueryArgument[]): TaggedType[] => input.map(encode),
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  set: (value: Page<QueryValue> | EmbeddedSet) => {
    throw new ClientError(
      "Page could not be encoded. Fauna does not accept encoded Set values, yet. Use Page.data and Page.after as arguments, instead.",
    );
    // TODO: uncomment to encode Pages once core starts accepting `@set` tagged values
    // if (value.data === undefined) {
    //   // if a Page has no data, then it must still have an 'after' cursor
    //   return { "@set": value.after };
    // }
    // return {
    //   "@set": { data: encodeMap["array"](value.data), after: value.after },
    // };
  },
  // TODO: encode as a tagged value if provided as a query arg?
  // streamToken: (value: StreamToken): TaggedStreamToken => ({ "@stream": value.token }),
  streamToken: (value: StreamToken): string => value.token,
  bytes: (value: ArrayBuffer | Uint8Array): TaggedBytes => ({
    "@bytes": bufferToBase64(value),
  }),
};

const encode = (input: QueryArgument): TaggedType => {
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
      } else if (input instanceof NullDocument) {
        return encode(input.ref);
      } else if (input instanceof Page) {
        return encodeMap["set"](input);
      } else if (input instanceof EmbeddedSet) {
        return encodeMap["set"](input);
      } else if (input instanceof StreamToken) {
        return encodeMap["streamToken"](input);
      } else if (input instanceof Uint8Array || input instanceof ArrayBuffer) {
        return encodeMap["bytes"](input);
      } else if (ArrayBuffer.isView(input)) {
        throw new ClientError(
          "Error encoding TypedArray to Fauna Bytes. Convert your TypedArray to Uint8Array or ArrayBuffer before passing it to Fauna. See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray",
        );
      } else if (input instanceof Query) {
        throw new TypeError(
          "Cannot encode instance of type 'Query'. Try using TaggedTypeFormat.encodeInterpolation instead.",
        );
      } else {
        return encodeMap["object"](input);
      }
    default:
      // catch "undefined", "symbol", and "function"
      throw new TypeError(
        `Passing ${typeof input} as a QueryArgument is not supported`,
      );
  }
  // anything here would be unreachable code
};

const encodeInterpolation = (input: QueryArgument): QueryInterpolation => {
  switch (typeof input) {
    case "bigint":
    case "string":
    case "number":
    case "boolean":
      return encodeValueInterpolation(encode(input));
    case "object":
      if (
        input == null ||
        input instanceof Date ||
        input instanceof DateStub ||
        input instanceof TimeStub ||
        input instanceof Module ||
        input instanceof DocumentReference ||
        input instanceof NamedDocumentReference ||
        input instanceof Page ||
        input instanceof EmbeddedSet ||
        input instanceof StreamToken ||
        input instanceof Uint8Array ||
        input instanceof ArrayBuffer ||
        ArrayBuffer.isView(input)
      ) {
        return encodeValueInterpolation(encode(input));
      } else if (input instanceof NullDocument) {
        return encodeInterpolation(input.ref);
      } else if (input instanceof Query) {
        return encodeQueryInterpolation(input);
      } else if (Array.isArray(input)) {
        return encodeArrayInterpolation(input);
      } else {
        return encodeObjectInterpolation(input);
      }
    default:
      // catch "undefined", "symbol", and "function"
      throw new TypeError(
        `Passing ${typeof input} as a QueryArgument is not supported`,
      );
  }
};

const encodeObjectInterpolation = (
  input: QueryArgumentObject,
): ObjectFragment => {
  const _out: EncodedObject = {};

  for (const k in input) {
    if (input[k] !== undefined) {
      _out[k] = encodeInterpolation(input[k]);
    }
  }
  return { object: _out };
};

const encodeArrayInterpolation = (
  input: Array<QueryArgument>,
): ArrayFragment => {
  const encodedItems = input.map(encodeInterpolation);
  return { array: encodedItems };
};

const encodeQueryInterpolation = (value: Query): FQLFragment => value.encode();

const encodeValueInterpolation = (value: TaggedType): ValueFragment => ({
  value,
});

function base64toBuffer(value: string): Uint8Array {
  return base64.toByteArray(value);
}

function bufferToBase64(value: ArrayBuffer | Uint8Array): string {
  const arr: Uint8Array =
    value instanceof Uint8Array ? value : new Uint8Array(value);

  return base64.fromByteArray(arr);
}
