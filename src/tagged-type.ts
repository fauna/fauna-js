export type Module = string;
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

class TaggedTypeEncoded {
  readonly result: any;

  readonly #encodeMap = {
    bigint: (value: bigint): { "@long": bigint } => {
      if (value >= -(2 ^ 63) + 1 && value <= 2 ** 63 - 1) {
        return {
          "@long": value,
        };
      }
      throw new TypeError("Precision loss when converting int to Fauna type");
    },
    number: (value: number): { [key: string]: number } => {
      if (`${value}`.includes(".")) {
        return { "@double": value };
      } else {
        if (value >= -(2 ^ 31) + 1 && value <= 2 ** 31 - 1) {
          return { "@int": value };
        } else if (value >= -(2 ^ 63) + 1 && value <= 2 ** 63 - 1) {
          return {
            "@long": value,
          };
        }
        return { "@double": value };
      }
    },
    string: (value: string): string => {
      return value;
    },
    object: (input: any): { [key: string]: string } => {
      let wrapped = false;
      const _out: { [key: string]: any } = {};

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
    date: (dateValue: Date): { [key: string]: string } => {
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
      case "string":
        this.result = this.#encodeMap["string"](input);
        break;
      case "number":
        this.result = this.#encodeMap["number"](input);
        break;
      case "object":
        if (Array.isArray(input)) {
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
