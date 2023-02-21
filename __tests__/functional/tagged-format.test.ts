import {
  TaggedTypeFormat,
  DocumentReference,
  Module,
} from "../../src/tagged-type";

describe("tagged format", () => {
  it("can be decoded", () => {
    const allTypes: string = `{
      "bugs_coll": { "@mod": "Bugs" },
      "bug": { "@doc": "Bugs:123" },
      "name": "fir",
      "age": { "@int": "200" },
      "birthdate": { "@date": "1823-02-08" },
      "molecules": { "@long": "999999999999999999" },
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
      ]
    }`;

    const bugs_mod: Module = "Bugs";
    const bugs_doc: DocumentReference = "Bugs:123";

    const result = TaggedTypeFormat.decode(allTypes);
    expect(result.bugs_coll).toBe(bugs_mod);
    expect(result.bug).toBe(bugs_doc);
    expect(result.name).toEqual("fir");
    expect(result.age).toEqual(200);
    expect(result.birthdate).toBeInstanceOf(Date);
    expect(result.molecules).toEqual(999999999999999999);
    expect(result.circumference).toEqual(3.82);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.extras.nest.num_sticks).toEqual(58);
    expect(result.extras.nest["@extras"].egg.fertilized).toBe(false);
    expect(result.measurements).toHaveLength(2);
    expect(result.measurements[0].id).toEqual(1);
    expect(result.measurements[0].employee).toEqual(3);
    expect(result.measurements[0].time).toBeInstanceOf(Date);
    expect(result.measurements[1].id).toEqual(2);
    expect(result.measurements[1].employee).toEqual(5);
    expect(result.measurements[1].time).toBeInstanceOf(Date);
  });

  it("can be encoded", () => {
    let result = JSON.stringify(
      TaggedTypeFormat.encode({
        child: { more: { itsworking: new Date("1983-04-15") } },
        date: new Date("1923-05-13"),
        decimal: 4.14,
        long: 32,
        name: "Hello, World",
        number: 48,
        time: new Date("2023-01-30T16:27:45.204243-05:00"),
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
          date: new Date("1888-08-08"),
        },
      })
    );

    // expect(result).toEqual(
    //   `{"child":{"more":{"itsworking":{"@date":"1983-04-15T00:00:00.000Z"}}},"date":{"@date":"1923-05-13T00:00:00.000Z"},"decimal":{"@decimal":4.14},"long":{"@int":32},"name":"Hello, World","number":{"@int":48},"time":{"@time":"2023-01-30T21:27:45.204Z"}}`
    // );
    const backToObj = JSON.parse(result)["@object"];
    expect(backToObj.decimal).toStrictEqual({ "@decimal": 4.14 });
    expect(backToObj.extra).toHaveLength(2);
    expect(backToObj.child.more.itsworking).toStrictEqual({
      "@date": "1983-04-15",
    });
  });

  it("handleds conflicts", () => {
    var result = TaggedTypeFormat.encode({
      date: { "@date": new Date("2022-11-01T00:00:00.000Z") },
      time: { "@time": new Date("2022-11-02T05:00:00.000Z") },
      int: { "@int": 1 },
      long: { "@long": 9999999999999 },
      double: { "@double": 1.99 },
    });
    expect(result["date"]["@object"]["@date"]).toStrictEqual({
      "@date": "2022-11-01",
    });
    expect(result["time"]["@object"]["@time"]).toStrictEqual({
      "@time": "2022-11-02T05:00:00.000Z",
    });
    expect(result["int"]["@object"]["@int"]).toStrictEqual({ "@int": 1 });
    expect(result["long"]["@object"]["@long"]).toStrictEqual({
      "@int": 9999999999999,
    });
    expect(result["double"]["@object"]["@double"]).toEqual({
      "@decimal": 1.99,
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
});
