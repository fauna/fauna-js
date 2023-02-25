/** A reference to a built in Fauna module; e.g. Date */
export type Module = string;
/** A reference to a document in Fauna */
export type DocumentReference = string;

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
    return new TaggedTypeEncoded(obj).result;
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
        return value["@mod"] as Module;
      } else if (value["@doc"]) {
        return value["@doc"] as DocumentReference;
      } else if (value["@int"]) {
        return Number(value["@int"]);
      } else if (value["@long"]) {
        return BigInt(value["@long"]);
      } else if (value["@double"]) {
        return Number(value["@double"]);
      } else if (value["@date"]) {
        return new Date(value["@date"] + "T00:00:00.000Z");
      } else if (value["@time"]) {
        return new Date(value["@time"]);
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
type TaggedObject = { "@object": Record<string, any> };
type TaggedTime = { "@time": string };

class TaggedTypeEncoded {
  readonly result: any;

  readonly #encodeMap = {
    bigint: (value: bigint): TaggedLong => {
      if (value >= -(2 ** 63) && value <= 2 ** 63 - 1) {
        return {
          "@long": value.toString(),
        };
      }
      throw new TypeError("Precision loss when converting int to Fauna type");
    },
    number: (value: number): TaggedDouble | TaggedInt | TaggedLong => {
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
    object: (input: any): TaggedObject | Record<string, any> => {
      let wrapped = false;
      const _out: Record<string, any> = {};

      for (const k in input) {
        if (k.startsWith("@")) {
          wrapped = true;
        }
        _out[k] = TaggedTypeFormat.encode(input[k]);
      }
      return wrapped ? { "@object": _out } : _out;
    },
    array: (input: Array<any>): Array<any> => {
      const _out: any = [];
      for (const i in input) _out.push(TaggedTypeFormat.encode(input[i]));
      return _out;
    },
    date: (dateValue: Date): TaggedDate | TaggedTime => {
      if (
        dateValue.getUTCHours() == 0 &&
        dateValue.getUTCMinutes() == 0 &&
        dateValue.getUTCSeconds() == 0 &&
        dateValue.getUTCMilliseconds() == 0
      ) {
        return { "@date": dateValue.toISOString().split("T")[0] };
      }

      return { "@time": dateValue.toISOString() };
    },
  };

  constructor(input: any) {
    // default to encoding directly as the input
    this.result = input;

    switch (typeof input) {
      case "bigint":
        this.result = this.#encodeMap["bigint"](input);
        break;
      case "string":
        this.result = this.#encodeMap["string"](input);
        break;
      case "number":
        this.result = this.#encodeMap["number"](input);
        break;
      case "object":
        if (input == null) {
          this.result = null;
        } else if (Array.isArray(input)) {
          this.result = this.#encodeMap["array"](input);
        } else if (input instanceof Date) {
          this.result = this.#encodeMap["date"](input);
        } else {
          this.result = this.#encodeMap["object"](input);
        }
        break;
    }
  }
}
