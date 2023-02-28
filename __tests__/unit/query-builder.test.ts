import { fql } from "../../src/query-builder";

describe("fql method producing QueryBuilders", () => {
  it("parses with no variables", () => {
    const queryBuilder = fql`'foo'.length`;
    const queryRequest = queryBuilder.toQuery();
    expect(queryRequest.query).toBe("'foo'.length");
    expect(queryRequest.arguments).toStrictEqual({});
  });

  it("parses with a string variable", () => {
    const str = "foo";
    const queryBuilder = fql`${str}.length`;
    const queryRequest = queryBuilder.toQuery();
    expect(queryRequest.query).toBe("arg0.length");
    expect(queryRequest.arguments).toStrictEqual({
      arg0: "foo",
    });
  });

  it("parses with a number variable", () => {
    const num = 8;
    const queryBuilder = fql`'foo'.length == ${num}`;
    const queryRequest = queryBuilder.toQuery();
    expect(queryRequest.query).toBe("'foo'.length == arg0");
    expect(queryRequest.arguments).toStrictEqual({
      arg0: 8,
    });
  });

  it("parses with a boolean variable", () => {
    const bool = true;
    const queryBuilder = fql`val.enabled == ${bool}`;
    const queryRequest = queryBuilder.toQuery();
    expect(queryRequest.query).toBe("val.enabled == arg0");
    expect(queryRequest.arguments).toStrictEqual({
      arg0: true,
    });
  });

  it("parses with a null variable", () => {
    const queryBuilder = fql`value: ${null}`;
    const queryRequest = queryBuilder.toQuery();
    expect(queryRequest.query).toBe("value: arg0");
    expect(queryRequest.arguments).toStrictEqual({
      arg0: null,
    });
  });

  it("parses with an object variable", () => {
    const obj = { foo: "bar", bar: "baz" };
    const queryBuilder = fql`value: ${obj}`;
    const queryRequest = queryBuilder.toQuery();
    expect(queryRequest.query).toBe("value: arg0");
    expect(queryRequest.arguments).toStrictEqual({
      arg0: { foo: "bar", bar: "baz" },
    });
  });

  it("parses with an object variable having a toQuery property", () => {
    const obj = { foo: "bar", bar: "baz", toQuery: "hehe" };
    const queryBuilder = fql`value: ${obj}`;
    const queryRequest = queryBuilder.toQuery();
    expect(queryRequest.query).toBe("value: arg0");
    expect(queryRequest.arguments).toStrictEqual({
      arg0: { foo: "bar", bar: "baz", toQuery: "hehe" },
    });
  });

  it("parses with an array variable", () => {
    const arr = [1, 2, 3];
    const queryBuilder = fql`value: ${arr}`;
    const queryRequest = queryBuilder.toQuery();
    expect(queryRequest.query).toBe("value: arg0");
    expect(queryRequest.arguments).toStrictEqual({
      arg0: [1, 2, 3],
    });
  });

  it("parses with multiple variables", () => {
    const str = "bar";
    const num = 17;
    const queryBuilder = fql`${str}.length == ${num + 3}`;
    const queryRequest = queryBuilder.toQuery();
    expect(queryRequest.query).toBe("arg0.length == arg1");
    expect(queryRequest.arguments).toStrictEqual({
      arg0: "bar",
      arg1: 20,
    });
  });

  it("parses nested expressions", () => {
    const str = "baz";
    const num = 17;
    const innerQueryBuilder = fql`Math.add(${num}, 3)`;
    const queryBuilder = fql`${str}.length == ${innerQueryBuilder}`;
    const queryRequest = queryBuilder.toQuery();
    expect(queryRequest.query).toBe("arg0.length == Math.add(arg1, 3)");
    expect(queryRequest.arguments).toStrictEqual({
      arg0: "baz",
      arg1: 17,
    });
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
    expect(queryRequest.query).toBe(
      "(arg0 + arg1).length == Math.add(Math.add(arg2, 3), arg3)"
    );
    expect(queryRequest.arguments).toStrictEqual({
      arg0: "baz",
      arg1: "bar",
      arg2: 17,
      arg3: 3,
    });
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
    expect(queryRequest.query).toBe("arg0.length == Math.add(arg1, 3)");
    expect(queryRequest.arguments).toStrictEqual({
      arg0: "baz",
      arg1: 17,
    });
  });
});
