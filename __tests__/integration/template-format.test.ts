import { ClientError, fql, TimeStub } from "../../src";
import { getClient } from "../client";

const client = getClient({
  query_timeout_ms: 60_000,
});

afterAll(() => {
  client.close();
});

describe("query using template format", () => {
  it("succeeds with no arguments", async () => {
    const queryBuilder = fql`"hello world"`;
    const response = await client.query(queryBuilder);
    expect(response.data).toBe("hello world");
  });

  it("succeeds with a string variable", async () => {
    const str = "foo";
    const queryBuilder = fql`${str}.length`;
    const response = await client.query(queryBuilder);
    expect(response.data).toBe(3);
  });

  it("succeeds with an Int variable", async () => {
    const num = 3;
    const queryBuilder = fql`'foo'.length == ${num}`;
    const response = await client.query(queryBuilder);
    expect(response.data).toBe(true);
  });

  it("succeeds with a Long variable", async () => {
    const long = BigInt(2 ** 60);
    const queryBuilder = fql`${long} + ${long}`;
    const response = await client.query(queryBuilder, {
      long_type: "bigint",
    });
    expect(response.data).toBe(long + long);
  });

  it("succeeds with a Double variable", async () => {
    const double = 3.14;
    const queryBuilder = fql`2 * ${double}`;
    const response = await client.query(queryBuilder);
    expect(response.data).toBe(6.28);
  });

  it("succeeds with a boolean variable", async () => {
    const bool = true;
    const queryBuilder = fql`true && ${bool}`;
    const response = await client.query(queryBuilder);
    expect(response.data).toBe(true);
  });

  it("succeeds with a null variable", async () => {
    const queryBuilder = fql`${null}`;
    const response = await client.query(queryBuilder);
    expect(response.data).toBeNull();
  });

  it("succeeds with an object variable", async () => {
    const obj = { foo: "foo", bar: "bar" };
    const queryBuilder = fql`
      let x = ${obj}
      x.foo + x.bar
    `;
    const response = await client.query(queryBuilder);
    expect(response.data).toEqual("foobar");
  });

  it("succeeds with an array variable", async () => {
    const arr = [1, 2, 3];
    const queryBuilder = fql`
      let xs = ${arr}
      xs.map(x => x + 10)
    `;
    const response = await client.query(queryBuilder);
    expect(response.data).toEqual([11, 12, 13]);
  });

  it("succeeds with multiple variables", async () => {
    const str = "foo";
    const num = 3;
    const queryBuilder = fql`${str}.length == ${num}`;
    const response = await client.query(queryBuilder);
    expect(response.data).toBe(true);
  });

  it("succeeds with nested expressions", async () => {
    const str = "foo";
    const num = 6;
    const innerQuery = fql`(${num} - 3)`;
    const queryBuilder = fql`${str}.length == ${innerQuery}`;
    const response = await client.query(queryBuilder);
    expect(response.data).toBe(true);
  });

  it("succeeds with deep nested expressions", async () => {
    const str = "foo";
    const otherStr = "bar";
    const num = 6;
    const otherNum = 3;
    const deepFirst = fql`(${str} + ${otherStr})`;
    const deeperBuilder = fql`(${num} + 3)`;
    const innerQuery = fql`(${deeperBuilder} - ${otherNum})`;
    const queryBuilder = fql`${deepFirst}.length == ${innerQuery}`;
    const response = await client.query(queryBuilder);
    expect(response.data).toBe(true);
  });

  it("succeeds with deep nested expressions - example 2", async () => {
    const str = "foo";
    const otherStr = "bar";
    const num = 6;
    const otherNum = 3;
    const deepFirst = fql`(${str} + ${otherStr})`;
    const deeperBuilder = fql`(${num} + 3)`;
    const innerQuery = fql`(${deeperBuilder} + ${otherNum})`;
    const queryBuilder = fql`${deepFirst}.length + ${innerQuery}`;
    const response = await client.query(queryBuilder);
    expect(response.data).toBe(18);
  });

  it("succeeds with expressions nested within objects", async () => {
    const arg = {
      a: fql`1`,
      b: fql`2`,
    };
    const queryBuilder = fql`${arg}`;
    const response = await client.query(queryBuilder);
    expect(response.data).toStrictEqual({ a: 1, b: 2 });
  });

  it("succeeds with expressions nested within arrays", async () => {
    const arg = [fql`1`, fql`2`];
    const queryBuilder = fql`${arg}`;
    const response = await client.query(queryBuilder);
    expect(response.data).toEqual([1, 2]);
  });

  it("succeeds with expressions nested within arrays and objects combined", async () => {
    const arg = [
      [fql`1`],
      {
        a: fql`1`,
        b: fql`2`,
      },
    ];
    const queryBuilder = fql`${arg}`;
    const response = await client.query(queryBuilder);
    expect(response.data).toEqual([[1], { a: 1, b: 2 }]);
  });

  it("succeeds with multiple layers of nesting of arrays and objects", async () => {
    const other = { a: fql`3`, b: fql`4` };
    const arg = [
      [fql`1 + ${fql`2`}`],
      {
        a: fql`1`,
        b: fql`2`,
        c: other,
      },
    ];
    const queryBuilder = fql`${arg}`;
    const response = await client.query(queryBuilder);
    expect(response.data).toEqual([[3], { a: 1, b: 2, c: { a: 3, b: 4 } }]);
  });

  it("succeeds with FQL string interpolation", async () => {
    const codeName = "Alice";
    const queryBuilder = fql`
      let name = ${codeName}
      "Hello, #{name}"
    `;
    const response = await client.query(queryBuilder);
    expect(response.data).toBe("Hello, Alice");
  });

  it("succeeds with a Date arg", async () => {
    const date = new Date();
    const queryBuilder = fql`${date}`;
    const response = await client.query<TimeStub>(queryBuilder);
    expect(response.data.isoString).toBe(date.toISOString());
  });

  it("succeeds with an ArrayBuffer variable", async () => {
    const buf = new Uint8Array([1, 2, 3]);
    const queryBuilder = fql`${buf.buffer}`;
    const response = await client.query<Uint8Array>(queryBuilder);
    expect(response.data.byteLength).toBe(3);
    expect(response.data).toEqual(buf);
  });

  it("succeeds with Uint8Array variables", async () => {
    const buf = new Uint8Array([1, 2, 3]);
    const queryBuilder = fql`${buf}`;
    const response = await client.query<Uint8Array>(queryBuilder);
    expect(response.data.byteLength).toBe(3);
    expect(response.data).toEqual(buf);
  });

  /**
   * See table of various TypedArrays here
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray#typedarray_objects
   */
  it.each`
    ViewType
    ${Int8Array}
    ${Uint8ClampedArray}
    ${Int16Array}
    ${Uint16Array}
    ${Int32Array}
    ${Uint32Array}
    ${Float32Array}
    ${Float64Array}
  `("fails with $ViewType variables", async ({ ViewType }) => {
    const buf = new ViewType([1, 2]);

    await expect(client.query(fql`${buf}`)).rejects.toThrow(ClientError);
  });

  /**
   * See table of various TypedArrays here
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray#typedarray_objects
   */
  it.each`
    ViewType
    ${BigInt64Array}
    ${BigUint64Array}
  `("fails with $ViewType variables", async ({ ViewType }) => {
    const buf = new ViewType([BigInt(1), BigInt(2)]);

    await expect(client.query(fql`${buf}`)).rejects.toThrow(ClientError);
  });

  it("succeeds using Node Buffer to encode strings", async () => {
    const str =
      "This is a test string 🚀 with various characters: !@#$%^&*()_+=-`~[]{}|;:'\",./<>?";
    const buf = Buffer.from(str);
    const queryBuilder = fql`${buf}`;
    const response = await client.query<Uint8Array>(queryBuilder);

    const decoded = Buffer.from(response.data).toString();
    expect(decoded).toBe(str);
  });
});
