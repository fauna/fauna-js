import { fql } from "../../src/query-builder";

describe("fql method producing QueryBuilders", () => {
  it("parses with no variables", () => {
    const queryBuilder = fql`'foo'.length`;
    const queryRequest = queryBuilder.toQuery();
    expect(queryRequest.query).toEqual({ fql: ["'foo'.length"] });
    expect(queryRequest.arguments).toStrictEqual({});
  });

  it("parses with a string variable", () => {
    const str = "foo";
    const queryBuilder = fql`${str}.length`;
    const queryRequest = queryBuilder.toQuery();
    expect(queryRequest.query).toEqual({
      fql: [{ value: "foo" }, ".length"],
    });
    expect(queryRequest.arguments).toStrictEqual({});
  });

  it("parses with a number variable", () => {
    const num = 8;
    const queryBuilder = fql`'foo'.length == ${num}`;
    const queryRequest = queryBuilder.toQuery();
    expect(queryRequest.query).toEqual({
      fql: ["'foo'.length == ", { value: { "@int": "8" } }],
    });
    expect(queryRequest.arguments).toStrictEqual({});
  });

  it("parses with a boolean variable", () => {
    const bool = true;
    const queryBuilder = fql`val.enabled == ${bool}`;
    const queryRequest = queryBuilder.toQuery();
    expect(queryRequest.query).toEqual({
      fql: ["val.enabled == ", { value: true }],
    });
    expect(queryRequest.arguments).toStrictEqual({});
  });

  it("parses with a null variable", () => {
    const queryBuilder = fql`value: ${null}`;
    const queryRequest = queryBuilder.toQuery();
    expect(queryRequest.query).toEqual({
      fql: ["value: ", { value: null }],
    });
    expect(queryRequest.arguments).toStrictEqual({});
  });

  it("parses with an object variable", () => {
    const obj = { foo: "bar", bar: "baz" };
    const queryBuilder = fql`value: ${obj}`;
    const queryRequest = queryBuilder.toQuery();
    expect(queryRequest.query).toEqual({
      fql: ["value: ", { value: { bar: "baz", foo: "bar" } }],
    });
    expect(queryRequest.arguments).toStrictEqual({});
  });

  it("parses with an object variable having a toQuery property", () => {
    const obj = { foo: "bar", bar: "baz", toQuery: "hehe" };
    const queryBuilder = fql`value: ${obj}`;
    const queryRequest = queryBuilder.toQuery();
    expect(queryRequest.query).toEqual({
      fql: ["value: ", { value: { bar: "baz", foo: "bar", toQuery: "hehe" } }],
    });
    expect(queryRequest.arguments).toStrictEqual({});
  });

  it("parses with an array variable", () => {
    const arr = [1, 2, 3];
    const queryBuilder = fql`value: ${arr}`;
    const queryRequest = queryBuilder.toQuery();
    expect(queryRequest.query).toEqual({
      fql: [
        "value: ",
        { value: [{ "@int": "1" }, { "@int": "2" }, { "@int": "3" }] },
      ],
    });
    expect(queryRequest.arguments).toStrictEqual({});
  });

  it("parses with multiple variables", () => {
    const str = "bar";
    const num = 17;
    const queryBuilder = fql`${str}.length == ${num + 3}`;
    const queryRequest = queryBuilder.toQuery();
    expect(queryRequest.query).toEqual({
      fql: [{ value: "bar" }, ".length == ", { value: { "@int": "20" } }],
    });
    expect(queryRequest.arguments).toStrictEqual({});
  });

  it("parses nested expressions", () => {
    const str = "baz";
    const num = 17;
    const innerQueryBuilder = fql`Math.add(${num}, 3)`;
    const queryBuilder = fql`${str}.length == ${innerQueryBuilder}`;
    const queryRequest = queryBuilder.toQuery();
    expect(queryRequest.query).toEqual({
      fql: [
        { value: "baz" },
        ".length == ",
        { fql: ["Math.add(", { value: { "@int": "17" } }, ", 3)"] },
      ],
    });
    expect(queryRequest.arguments).toStrictEqual({});
  });

  it("parses deep nested expressions", () => {
    const str = "baz";
    const otherStr = "bar";
    const num = 17;
    const otherNum = 3;
    const deepFirst = fql`(${str} + ${otherStr})`;
    const deeperBuilder = fql`Math.add(${num}, 3)`;
    const innerQueryBuilder = fql`Math.add(${deeperBuilder}, ${otherNum})`;
    const queryBuilder = fql`${deepFirst}.length == ${innerQueryBuilder}`;
    const queryRequest = queryBuilder.toQuery();
    expect(queryRequest.query).toEqual({
      fql: [
        { fql: ["(", { value: "baz" }, " + ", { value: "bar" }, ")"] },
        ".length == ",
        {
          fql: [
            "Math.add(",
            { fql: ["Math.add(", { value: { "@int": "17" } }, ", 3)"] },
            ", ",
            { value: { "@int": "3" } },
            ")",
          ],
        },
      ],
    });
    expect(queryRequest.arguments).toStrictEqual({});
  });

  it("adds headers if passed in", () => {
    const str = "baz";
    const num = 17;
    const innerQueryBuilder = fql`Math.add(${num}, 3)`;
    const queryBuilder = fql`${str}.length == ${innerQueryBuilder}`;
    const queryRequest = queryBuilder.toQuery({
      last_txn_ts: 1640995200000000,
      linearized: true,
      query_timeout_ms: 600,
      max_contention_retries: 4,
      query_tags: { a: "tag" },
      traceparent: "00-750efa5fb6a131eb2cf4db39f28366cb-5669e71839eca76b-00",
    });
    expect(queryRequest).toMatchObject({
      last_txn_ts: 1640995200000000,
      linearized: true,
      query_timeout_ms: 600,
      max_contention_retries: 4,
      query_tags: { a: "tag" },
      traceparent: "00-750efa5fb6a131eb2cf4db39f28366cb-5669e71839eca76b-00",
    });
    expect(queryRequest.query).toEqual({
      fql: [
        { value: "baz" },
        ".length == ",
        { fql: ["Math.add(", { value: { "@int": "17" } }, ", 3)"] },
      ],
    });
    expect(queryRequest.arguments).toStrictEqual({});
  });
});
