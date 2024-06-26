import {
  DateStub,
  Document,
  DocumentReference,
  LONG_MIN,
  LONG_MAX,
  Module,
  NamedDocument,
  NamedDocumentReference,
  NullDocument,
  Page,
  TaggedTypeFormat,
  TimeStub,
  EmbeddedSet,
} from "../../src";
import { TaggedDouble, TaggedInt, TaggedLong } from "../../src/wire-protocol";

const testBytesString =
  "This is a test string 🚀 with various characters: !@#$%^&*()_+=-`~[]{}|;:'\",./<>?";
const testBuffer = Buffer.from(testBytesString);
const testBytesBase64 = Buffer.from(testBytesString).toString("base64");

const testArrayBufferU8 = new ArrayBuffer(4);
const testArrayBufferViewU8 = new Uint8Array(testArrayBufferU8);
testArrayBufferViewU8[1] = 1;
testArrayBufferViewU8[2] = 2;
testArrayBufferViewU8[3] = 3;
testArrayBufferViewU8[4] = 4;

describe.each`
  long_type
  ${"number"}
  ${"bigint"}
`("tagged format with long_type $long_type", ({ long_type }) => {
  const decodeOptions = { long_type };
  it("can be decoded", () => {
    const allTypes = `{
      "name": "fir",
      "age": { "@int": "200" },
      "birthdate": { "@date": "1823-02-08" },
      "circumference": { "@double": "3.82" },
      "created_at": { "@time": "2003-02-08T13:28:12.000555+00:00" },
      "extras": {
        "nest": {
          "@object": {
            "num_sticks": { "@int": "58" },
            "@extras": { "egg": { "fertilized": false } }
          }
        }
      },
      "measurements": [
        {
          "id": { "@int": "1" },
          "employee": { "@int": "3" },
          "time": { "@time": "2013-02-08T12:00:05.000123+00:00" }
        },
        {
          "id": { "@int": "2" },
          "employee": { "@int": "5" },
          "time": { "@time": "2023-02-08T14:22:01.000001+00:00" }
        }
      ],
      "molecules": { "@long": "999999999999999999" },
      "null": null,
      "mod": { "@mod": "Bugs" },
      "docReference": {
        "@ref": { "coll": { "@mod": "Bugs" }, "id": "123" }
      },
      "doc": {
        "@doc": { 
          "coll": { "@mod": "Bugs" },
          "id": "123",
          "ts": { "@time": "2023-03-20T00:00:00Z" }
        }
      },
      "namedDocReference": {
        "@ref": { "coll": { "@mod": "Collection" }, "name": "Bugs" }
      },
      "namedDoc": {
        "@doc": { 
          "coll": { "@mod": "Collection" },
          "name": "Bugs",
          "ts": { "@time": "2023-03-20T00:00:00Z" }
        }
      },
      "nullDoc": {
        "@ref": { 
          "coll": { "@mod": "Bugs" }, 
          "id": "123", 
          "exists": false, 
          "cause": "not found"
        }
      },
      "page": { "@set": { "data": ["a", "b"] } },
      "embeddedSet": { "@set": "abc123" },
      "bytes": { "@bytes": "${testBytesBase64}" }
    }`;

    const bugs_mod = new Module("Bugs");
    const collection_mod = new Module("Collection");
    const doc_ts = TimeStub.from("2023-03-20T00:00:00Z");
    const docReference = new DocumentReference({
      coll: bugs_mod,
      id: "123",
    });
    const doc: Document = new Document({
      coll: bugs_mod,
      id: "123",
      ts: doc_ts,
    });
    const namedDocReference = new NamedDocumentReference({
      coll: collection_mod,
      name: "Bugs",
    });
    const namedDoc = new NamedDocument({
      coll: collection_mod,
      name: "Bugs",
      ts: doc_ts,
    });
    const nullDoc = new NullDocument(docReference, "not found");

    const page = new Page({ data: ["a", "b"] });
    const embeddedSet = new EmbeddedSet("abc123");

    const result = TaggedTypeFormat.decode(allTypes, decodeOptions);
    expect(result.name).toEqual("fir");
    expect(result.age).toEqual(200);
    expect(result.birthdate).toBeInstanceOf(DateStub);
    expect(result.circumference).toEqual(3.82);
    expect(result.created_at).toBeInstanceOf(TimeStub);
    expect(result.extras.nest.num_sticks).toEqual(58);
    expect(result.extras.nest["@extras"].egg.fertilized).toBe(false);
    expect(result.measurements).toHaveLength(2);
    expect(result.measurements[0].id).toEqual(1);
    expect(result.measurements[0].employee).toEqual(3);
    expect(result.measurements[0].time).toBeInstanceOf(TimeStub);
    expect(result.measurements[1].id).toEqual(2);
    expect(result.measurements[1].employee).toEqual(5);
    expect(result.measurements[1].time).toBeInstanceOf(TimeStub);
    expect(result.molecules).toEqual(
      // eslint-disable-next-line @typescript-eslint/no-loss-of-precision
      long_type === "number"
        ? 999999999999999999
        : BigInt("999999999999999999"),
    );
    expect(result.null).toBeNull();
    expect(result.mod).toStrictEqual(bugs_mod);
    expect(result.docReference).toStrictEqual(docReference);
    expect(result.doc).toStrictEqual(doc);
    expect(result.namedDocReference).toStrictEqual(namedDocReference);
    expect(result.namedDoc).toStrictEqual(namedDoc);
    expect(result.nullDoc).toStrictEqual(nullDoc);
    expect(result.page).toStrictEqual(page);
    expect(result.embeddedSet).toStrictEqual(embeddedSet);
    expect(Buffer.from(result.bytes).toString()).toEqual(testBytesString);
  });

  it("can be encoded", () => {
    const bugs_mod = new Module("Bugs");
    const collection_mod = new Module("Collection");

    const encoded = TaggedTypeFormat.encode({
      // literals
      double: 4.14,
      int: 32,
      name: "Hello, World",
      null: null,
      // objects and arrays
      child: { more: { itsworking: DateStub.from("1983-04-15") } },
      extra: [
        {
          id: 1,
          time: new Date(),
        },
        {
          id: 2,
          time: new Date(),
        },
      ],
      "@foobar": {
        date: DateStub.from("1888-08-08"),
      },
      // dates and times
      date: DateStub.from("1923-05-13"),
      time: TimeStub.from("2023-03-20T00:00:00Z"),
      datetime: new Date("2023-03-20T00:00:00Z"),
      // Document types
      mod: bugs_mod,
      docReference: new DocumentReference({ coll: bugs_mod, id: "123" }),
      doc: new Document({
        coll: bugs_mod,
        id: "123",
        ts: TimeStub.from("2023-03-20T00:00:00Z"),
      }),
      namedDocReference: new NamedDocumentReference({
        coll: collection_mod,
        name: "Bugs",
      }),
      namedDoc: new NamedDocument({
        coll: collection_mod,
        name: "Bugs",
        ts: TimeStub.from("2023-03-20T00:00:00Z"),
      }),
      nullDoc: new NullDocument(
        new DocumentReference({ coll: bugs_mod, id: "123" }),
        "not found",
      ),
      bytes_array_buffer: testArrayBufferU8,
      bytes_array_buffer_view_u8: testArrayBufferViewU8,
      bytes_from_string: testBuffer,
      // Set types
      // TODO: uncomment to add test once core accepts `@set` tagged values
      // page: new Page({ data: ["a", "b"] }),
      // TODO: uncomment to add test once core accepts `@set` tagged values
      // page_string: new Page({ after: "abc123" }),
    });

    expect(encoded).toMatchObject({
      "@object": {
        // literals
        double: { "@double": "4.14" },
        int: { "@int": "32" },
        name: "Hello, World",
        null: null,
        // objects and arrays
        child: { more: { itsworking: { "@date": "1983-04-15" } } },
        extra: [{ id: { "@int": "1" } }, { id: { "@int": "2" } }],
        "@foobar": { date: { "@date": "1888-08-08" } },
        // Document types
        mod: { "@mod": "Bugs" },
        docReference: { "@ref": { coll: { "@mod": "Bugs" }, id: "123" } },
        doc: { "@ref": { coll: { "@mod": "Bugs" }, id: "123" } },
        namedDocReference: {
          "@ref": { coll: { "@mod": "Collection" }, name: "Bugs" },
        },
        namedDoc: { "@ref": { coll: { "@mod": "Collection" }, name: "Bugs" } },
        nullDoc: { "@ref": { coll: { "@mod": "Bugs" }, id: "123" } },
        bytes_array_buffer: {
          "@bytes": Buffer.from(testArrayBufferU8).toString("base64"),
        },
        bytes_array_buffer_view_u8: {
          "@bytes": Buffer.from(testArrayBufferViewU8).toString("base64"),
        },
        bytes_from_string: { "@bytes": testBytesBase64 },
        // Set types
        // TODO: expect set types to be encoded as `@set` tagged values
      },
    });
  });

  it("can be encoded as interpolation query", () => {
    const bugs_mod = new Module("Bugs");
    const collection_mod = new Module("Collection");

    const encoded = TaggedTypeFormat.encodeInterpolation({
      // literals
      double: 4.14,
      int: 32,
      name: "Hello, World",
      null: null,
      number: 48,
      // objects and arrays
      child: { more: { itsworking: DateStub.from("1983-04-15") } },
      extra: [
        {
          id: 1,
          time: new Date(),
        },
        {
          id: 2,
          time: new Date(),
        },
      ],
      "@foobar": {
        date: DateStub.from("1888-08-08"),
      },
      // dates and times
      date: DateStub.from("1923-05-13"),
      time: TimeStub.from("2023-03-20T00:00:00Z"),
      datetime: new Date("2023-03-20T00:00:00Z"),
      // Document types
      mod: bugs_mod,
      docReference: new DocumentReference({ coll: bugs_mod, id: "123" }),
      doc: new Document({
        coll: bugs_mod,
        id: "123",
        ts: TimeStub.from("2023-03-20T00:00:00Z"),
      }),
      namedDocReference: new NamedDocumentReference({
        coll: collection_mod,
        name: "Bugs",
      }),
      namedDoc: new NamedDocument({
        coll: collection_mod,
        name: "Bugs",
        ts: TimeStub.from("2023-03-20T00:00:00Z"),
      }),
      nullDoc: new NullDocument(
        new DocumentReference({ coll: bugs_mod, id: "123" }),
        "not found",
      ),
      bytes_array_buffer: testArrayBufferU8,
      bytes_array_buffer_view_u8: testArrayBufferViewU8,
      bytes_from_string: testBuffer,
      // Set types
      // TODO: uncomment to add test once core accepts `@set` tagged values
      // page: new Page({ data: ["a", "b"] }),
      // TODO: uncomment to add test once core accepts `@set` tagged values
      // page_string: new Page({ after: "abc123" }),
    });

    expect(encoded).toMatchObject({
      object: {
        // literals
        double: { value: { "@double": "4.14" } },
        int: { value: { "@int": "32" } },
        name: { value: "Hello, World" },
        null: { value: null },
        // objects and arrays
        child: {
          object: {
            more: {
              object: { itsworking: { value: { "@date": "1983-04-15" } } },
            },
          },
        },
        extra: { array: expect.arrayContaining([]) },
        "@foobar": {
          object: {
            date: { value: { "@date": "1888-08-08" } },
          },
        },
        // Document types
        mod: { value: { "@mod": "Bugs" } },
        docReference: {
          value: {
            "@ref": { coll: { "@mod": "Bugs" }, id: "123" },
          },
        },
        doc: {
          value: {
            "@ref": { coll: { "@mod": "Bugs" }, id: "123" },
          },
        },
        namedDocReference: {
          value: {
            "@ref": { coll: { "@mod": "Collection" }, name: "Bugs" },
          },
        },
        namedDoc: {
          value: {
            "@ref": { coll: { "@mod": "Collection" }, name: "Bugs" },
          },
        },
        nullDoc: {
          value: {
            "@ref": { coll: { "@mod": "Bugs" }, id: "123" },
          },
        },
        bytes_array_buffer: {
          value: {
            "@bytes": Buffer.from(testArrayBufferU8).toString("base64"),
          },
        },
        bytes_array_buffer_view_u8: {
          value: {
            "@bytes": Buffer.from(testArrayBufferViewU8).toString("base64"),
          },
        },
        bytes_from_string: { value: { "@bytes": testBytesBase64 } },
      },
      // Set types
      // TODO: expect set types to be encoded as `@set` tagged values
    });
  });

  it("handles conflicts", () => {
    const result: any = TaggedTypeFormat.encode({
      date: { "@date": DateStub.from("2022-11-01") },
      time: { "@time": TimeStub.from("2022-11-02T05:00:00.000Z") },
      int: { "@int": 1 },
      long: { "@long": BigInt("99999999999999999") },
      double: { "@double": 1.99 },
    });

    expect(result).toMatchObject({
      date: { "@object": { "@date": { "@date": "2022-11-01" } } },
      time: { "@object": { "@time": { "@time": "2022-11-02T05:00:00.000Z" } } },
      int: { "@object": { "@int": { "@int": "1" } } },
      long: { "@object": { "@long": { "@long": "99999999999999999" } } },
      double: { "@object": { "@double": { "@double": "1.99" } } },
    });
  });

  it("handles conflicts in interpolation queries", () => {
    const result = TaggedTypeFormat.encodeInterpolation({
      date: { "@date": DateStub.from("2022-11-01") },
      time: { "@time": TimeStub.from("2022-11-02T05:00:00.000Z") },
      int: { "@int": 1 },
      long: { "@long": BigInt("99999999999999999") },
      double: { "@double": 1.99 },
    });

    expect(result).toMatchObject({
      object: {
        date: { object: { "@date": { value: { "@date": "2022-11-01" } } } },
        time: {
          object: {
            "@time": { value: { "@time": "2022-11-02T05:00:00.000Z" } },
          },
        },
        int: { object: { "@int": { value: { "@int": "1" } } } },
        long: {
          object: { "@long": { value: { "@long": "99999999999999999" } } },
        },
        double: { object: { "@double": { value: { "@double": "1.99" } } } },
      },
    });
  });

  it("handles nested conflict types", () => {
    const encoded = TaggedTypeFormat.encode({
      "@date": {
        "@date": {
          "@time": new Date("2022-12-02T02:00:00.000Z"),
        },
      },
    });

    expect(encoded).toMatchObject({
      "@object": {
        "@date": {
          "@object": {
            "@date": {
              "@object": {
                "@time": { "@time": "2022-12-02T02:00:00.000Z" },
              },
            },
          },
        },
      },
    });
  });

  it("handles nested conflict types in interpolation queries", () => {
    const encoded = TaggedTypeFormat.encodeInterpolation({
      "@date": {
        "@date": {
          "@time": new Date("2022-12-02T02:00:00.000Z"),
        },
      },
    });

    expect(encoded).toMatchObject({
      object: {
        "@date": {
          object: {
            "@date": {
              object: {
                "@time": { value: { "@time": "2022-12-02T02:00:00.000Z" } },
              },
            },
          },
        },
      },
    });
  });

  it("wraps user-provided `@` fields", () => {
    const encoded = TaggedTypeFormat.encodeInterpolation({
      "@foo": true,
    });

    expect(encoded).toMatchObject({ object: { "@foo": { value: true } } });
  });

  it.each`
    input                          | expected                           | expectedType | tag          | testCase
    ${LONG_MIN}                    | ${LONG_MIN}                        | ${long_type} | ${"@long"}   | ${"-(2**63)"}
    ${Number.MIN_SAFE_INTEGER - 1} | ${Number.MIN_SAFE_INTEGER - 1}     | ${"number"}  | ${"@double"} | ${"-(2**53)"}
    ${Number.MIN_SAFE_INTEGER}     | ${BigInt(Number.MIN_SAFE_INTEGER)} | ${long_type} | ${"@long"}   | ${"-(2**53 - 1)"}
    ${-(2 ** 31) - 1}              | ${BigInt(-(2 ** 31) - 1)}          | ${long_type} | ${"@long"}   | ${"-(2**31) - 1"}
    ${-(2 ** 31)}                  | ${-(2 ** 31)}                      | ${"number"}  | ${"@int"}    | ${"-(2**31)"}
    ${0}                           | ${0}                               | ${"number"}  | ${"@int"}    | ${"0 (Int)"}
    ${1}                           | ${1}                               | ${"number"}  | ${"@int"}    | ${"1 (Int)"}
    ${BigInt("0")}                 | ${0}                               | ${"number"}  | ${"@int"}    | ${"0 (Long)"}
    ${2 ** 31 - 1}                 | ${2 ** 31 - 1}                     | ${"number"}  | ${"@int"}    | ${"2**31 - 1"}
    ${2 ** 31}                     | ${BigInt(2 ** 31)}                 | ${long_type} | ${"@long"}   | ${"2**31"}
    ${Number.MAX_SAFE_INTEGER}     | ${BigInt(Number.MAX_SAFE_INTEGER)} | ${long_type} | ${"@long"}   | ${"2**53 - 1"}
    ${Number.MAX_SAFE_INTEGER + 1} | ${Number.MAX_SAFE_INTEGER + 1}     | ${"number"}  | ${"@double"} | ${"2**53"}
    ${LONG_MAX}                    | ${LONG_MAX}                        | ${long_type} | ${"@long"}   | ${"2**64 - 1"}
    ${1.3 ** 63}                   | ${1.3 ** 63}                       | ${"number"}  | ${"@double"} | ${"1.3**63"}
    ${1.3}                         | ${1.3}                             | ${"number"}  | ${"@double"} | ${"1.3"}
    ${0.000000008}                 | ${0.000000008}                     | ${"number"}  | ${"@double"} | ${"0.000000008"}
  `(
    `Properly encodes and decodes number $testCase`,
    async ({ input, expected, expectedType, tag, testCase }) => {
      if (long_type === "number" && typeof expected === "bigint") {
        expected = Number(expected);
        input = Number(expected);
        if (
          expected > Number.MAX_SAFE_INTEGER ||
          expected < Number.MIN_SAFE_INTEGER
        ) {
          tag = "@double";
        }
      }
      testCase;
      const encoded = TaggedTypeFormat.encode(input) as
        | TaggedInt
        | TaggedLong
        | TaggedDouble;
      const encodedKey = Object.keys(encoded)[0];
      expect(encodedKey).toEqual(tag);
      const decoded = TaggedTypeFormat.decode(
        JSON.stringify(encoded),
        decodeOptions,
      );
      expect(typeof decoded).toBe(expectedType);
      expect(decoded).toEqual(expected);
    },
  );

  it.each`
    input                       | testCase
    ${LONG_MIN - BigInt(1)}     | ${"lower than -(2**63) - 1"}
    ${LONG_MAX + BigInt(1)}     | ${"greater than 2**63"}
    ${Number.NEGATIVE_INFINITY} | ${"NEGATIVE_INFINITY"}
    ${Number.POSITIVE_INFINITY} | ${"POSITIVE_INFINITY"}
  `("Throws if BigInt value is $testCase", async ({ input }) => {
    expect(() => TaggedTypeFormat.encode(input)).toThrow();
  });
});
