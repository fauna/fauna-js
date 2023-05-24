import { fql } from "../../src";
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

  it("succeeds with FQL string interpolation", async () => {
    const codeName = "Alice";
    const queryBuilder = fql`
      let name = ${codeName}
      "Hello, #{name}"
    `;
    const response = await client.query(queryBuilder);
    expect(response.data).toBe("Hello, Alice");
  });
});
