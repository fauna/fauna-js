import { TaggedTypeFormat, LONG_MIN, LONG_MAX } from "../../src/tagged-type";
import {
  DateStub,
  Document,
  DocumentReference,
  Module,
  Set,
  TimeStub,
} from "../../src/values";

describe("tagged format", () => {
  it("can be decoded", () => {
    const allTypes: string = `{
      "bugs_coll": { "@mod": "Bugs" },
      "bug_ref": { "@ref": { "coll": { "@mod": "Bugs" }, "id": "123" } },
      "bug_doc": { "@doc": { "coll": { "@mod": "Bugs" }, "id": "123", "ts": { "@time": "2023-03-20T00:00:00Z" } } },
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
      "set": { "@set": { "data": ["a", "b"] } }
    }`;

    const bugs_mod: Module = new Module("Bugs");
    const bugs_ref: DocumentReference = new DocumentReference({
      coll: bugs_mod,
      id: "123",
    });
    const doc_ts = TimeStub.from("2023-03-20T00:00:00Z");
    const bugs_doc: Document = new Document({
      coll: bugs_mod,
      id: "123",
      ts: doc_ts,
    });
    const set = new Set({ data: ["a", "b"] });

    const result = TaggedTypeFormat.decode(allTypes);
    expect(result.bugs_coll).toStrictEqual(bugs_mod);
    expect(result.bug_ref).toStrictEqual(bugs_ref);
    expect(result.bug_doc).toStrictEqual(bugs_doc);
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
    expect(result.molecules).toEqual(BigInt("999999999999999999"));
    expect(result.null).toBeNull();
    expect(result.set).toStrictEqual(set);
  });

  it("can be encoded", () => {
    let result = JSON.stringify(
      TaggedTypeFormat.encode({
        child: { more: { itsworking: DateStub.from("1983-04-15") } },
        date: DateStub.from("1923-05-13"),
        double: 4.14,
        int: 32,
        name: "Hello, World",
        null: null,
        number: 48,
        time: TimeStub.from("2023-01-30T16:27:45.204243-05:00"),
        datetime: new Date("2023-01-30T16:27:45.204243-05:00"),
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
      })
    );

    const backToObj = JSON.parse(result)["@object"];
    expect(backToObj.double).toStrictEqual({ "@double": "4.14" });
    expect(backToObj.extra).toHaveLength(2);
    expect(backToObj.child.more.itsworking).toStrictEqual({
      "@date": "1983-04-15",
    });
    expect(backToObj.null).toBeNull();
  });

  it("handles conflicts", () => {
    var result = TaggedTypeFormat.encode({
      date: { "@date": DateStub.from("2022-11-01") },
      time: { "@time": TimeStub.from("2022-11-02T05:00:00.000Z") },
      int: { "@int": 1 },
      long: { "@long": BigInt("99999999999999999") },
      double: { "@double": 1.99 },
    });
    expect(result["date"]["@object"]["@date"]).toStrictEqual({
      "@date": "2022-11-01",
    });
    expect(result["time"]["@object"]["@time"]).toStrictEqual({
      "@time": "2022-11-02T05:00:00.000Z",
    });
    expect(result["int"]["@object"]["@int"]).toStrictEqual({ "@int": "1" });
    expect(result["long"]["@object"]["@long"]).toStrictEqual({
      "@long": "99999999999999999",
    });
    expect(result["double"]["@object"]["@double"]).toEqual({
      "@double": "1.99",
    });
  });

  it("handles nested conflict types", () => {
    expect(
      JSON.stringify(
        TaggedTypeFormat.encode({
          "@date": {
            "@date": {
              "@time": new Date("2022-12-02T02:00:00.000Z"),
            },
          },
        })
      )
    ).toEqual(
      '{"@object":{"@date":{"@object":{"@date":{"@object":{"@time":{"@time":"2022-12-02T02:00:00.000Z"}}}}}}}'
    );
  });

  it("wraps user-provided `@` fields", () => {
    expect(
      JSON.stringify(
        TaggedTypeFormat.encode({
          "@foo": true,
        })
      )
    ).toEqual('{"@object":{"@foo":true}}');
  });

  // JS will actually fit big numbers into number but we use BigInt
  // any way so user can round trip longs.
  it.each`
    input                          | expected                           | expectedType | tag          | testCase
    ${LONG_MIN}                    | ${LONG_MIN}                        | ${"bigint"}  | ${"@long"}   | ${"-(2**63)"}
    ${Number.MIN_SAFE_INTEGER - 1} | ${Number.MIN_SAFE_INTEGER - 1}     | ${"number"}  | ${"@double"} | ${"-(2**53)"}
    ${Number.MIN_SAFE_INTEGER}     | ${BigInt(Number.MIN_SAFE_INTEGER)} | ${"bigint"}  | ${"@long"}   | ${"-(2**53 - 1)"}
    ${-(2 ** 31) - 1}              | ${BigInt(-(2 ** 31) - 1)}          | ${"bigint"}  | ${"@long"}   | ${"-(2**31) - 1"}
    ${-(2 ** 31)}                  | ${-(2 ** 31)}                      | ${"number"}  | ${"@int"}    | ${"-(2**31)"}
    ${0}                           | ${0}                               | ${"number"}  | ${"@int"}    | ${"0 (Int)"}
    ${1}                           | ${1}                               | ${"number"}  | ${"@int"}    | ${"1 (Int)"}
    ${BigInt("0")}                 | ${BigInt("0")}                     | ${"bigint"}  | ${"@long"}   | ${"0 (Long)"}
    ${2 ** 31 - 1}                 | ${2 ** 31 - 1}                     | ${"number"}  | ${"@int"}    | ${"2**31 - 1"}
    ${2 ** 31}                     | ${BigInt(2 ** 31)}                 | ${"bigint"}  | ${"@long"}   | ${"2**31"}
    ${Number.MAX_SAFE_INTEGER}     | ${BigInt(Number.MAX_SAFE_INTEGER)} | ${"bigint"}  | ${"@long"}   | ${"2**53 - 1"}
    ${Number.MAX_SAFE_INTEGER + 1} | ${Number.MAX_SAFE_INTEGER + 1}     | ${"number"}  | ${"@double"} | ${"2**53"}
    ${LONG_MAX}                    | ${LONG_MAX}                        | ${"bigint"}  | ${"@long"}   | ${"2**64 - 1"}
    ${1.3 ** 63}                   | ${1.3 ** 63}                       | ${"number"}  | ${"@double"} | ${"1.3**63"}
    ${1.3}                         | ${1.3}                             | ${"number"}  | ${"@double"} | ${"1.3"}
  `(
    "Properly encodes and decodes number $testCase",
    async ({ input, expected, expectedType, tag, testCase }) => {
      testCase;
      const encoded = TaggedTypeFormat.encode(input);
      const encodedKey = Object.keys(encoded)[0];
      expect(encodedKey).toEqual(tag);
      const decoded = TaggedTypeFormat.decode(JSON.stringify(encoded));
      expect(typeof decoded).toBe(expectedType);
      expect(decoded).toEqual(expected);
    }
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
