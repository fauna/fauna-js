import { QueryRequestBuilder } from "../../src/query-request-builder";

describe("QueryRequestBuilder", () => {
  it("parses with no variables", () => {
    const queryRequestBuilder = QueryRequestBuilder.newBuilder`'foo'.length`;
    const queryRequest = queryRequestBuilder.toQueryRequest();
    expect(queryRequest.query).toBe("'foo'.length");
    expect(queryRequest.arguments).toStrictEqual({});
  });

  it("parses with a string variable", () => {
    const str = "foo";
    const queryRequestBuilder = QueryRequestBuilder.newBuilder`${str}.length`;
    const queryRequest = queryRequestBuilder.toQueryRequest();
    expect(queryRequest.query).toBe("arg0.length");
    expect(queryRequest.arguments).toStrictEqual({
      arg0: "foo",
    });
  });

  it("parses with a number variable", () => {
    const num = 8;
    const queryRequestBuilder = QueryRequestBuilder.newBuilder`'foo'.length == ${num}`;
    const queryRequest = queryRequestBuilder.toQueryRequest();
    expect(queryRequest.query).toBe("'foo'.length == arg0");
    expect(queryRequest.arguments).toStrictEqual({
      arg0: 8,
    });
  });

  it("parses with a boolean variable", () => {
    const bool = true;
    const queryRequestBuilder = QueryRequestBuilder.newBuilder`val.enabled == ${bool}`;
    const queryRequest = queryRequestBuilder.toQueryRequest();
    expect(queryRequest.query).toBe("val.enabled == arg0");
    expect(queryRequest.arguments).toStrictEqual({
      arg0: true,
    });
  });

  it("parses with a null variable", () => {
    const queryRequestBuilder = QueryRequestBuilder.newBuilder`value: ${null}`;
    const queryRequest = queryRequestBuilder.toQueryRequest();
    expect(queryRequest.query).toBe("value: arg0");
    expect(queryRequest.arguments).toStrictEqual({
      arg0: null,
    });
  });

  it("parses with an object variable", () => {
    const obj = { foo: "bar", bar: "baz" };
    const queryRequestBuilder = QueryRequestBuilder.newBuilder`value: ${obj}`;
    const queryRequest = queryRequestBuilder.toQueryRequest();
    expect(queryRequest.query).toBe("value: arg0");
    expect(queryRequest.arguments).toStrictEqual({
      arg0: { foo: "bar", bar: "baz" },
    });
  });

  it("parses with an array variable", () => {
    const arr = [1, 2, 3];
    const queryRequestBuilder = QueryRequestBuilder.newBuilder`value: ${arr}`;
    const queryRequest = queryRequestBuilder.toQueryRequest();
    expect(queryRequest.query).toBe("value: arg0");
    expect(queryRequest.arguments).toStrictEqual({
      arg0: [1, 2, 3],
    });
  });

  it("parses with multiple variables", () => {
    const str = "bar";
    const num = 17;
    const queryRequestBuilder = QueryRequestBuilder.newBuilder`${str}.length == ${
      num + 3
    }`;
    const queryRequest = queryRequestBuilder.toQueryRequest();
    expect(queryRequest.query).toBe("arg0.length == arg1");
    expect(queryRequest.arguments).toStrictEqual({
      arg0: "bar",
      arg1: 20,
    });
  });

  it("parses nested expressions", () => {
    const str = "baz";
    const num = 17;
    const innerQueryRequestBuilder = QueryRequestBuilder.newBuilder`Math.add(${num}, 3)`;
    const queryRequestBuilder = QueryRequestBuilder.newBuilder`${str}.length == ${innerQueryRequestBuilder}`;
    const queryRequest = queryRequestBuilder.toQueryRequest();
    expect(queryRequest.query).toBe("arg0.length == Math.add(arg1, 3)");
    expect(queryRequest.arguments).toStrictEqual({
      arg0: "baz",
      arg1: 17,
    });
  });

  it("adds headers if passed in", () => {
    const str = "baz";
    const num = 17;
    const innerQueryRequestBuilder = QueryRequestBuilder.newBuilder`Math.add(${num}, 3)`;
    const queryRequestBuilder = QueryRequestBuilder.newBuilder`${str}.length == ${innerQueryRequestBuilder}`;
    const queryRequest = queryRequestBuilder.toQueryRequest({
      last_txn: "2022-01-01T00:00:0Z",
      linearized: true,
      timeout_ms: 600,
      max_contention_retries: 4,
      tags: { a: "tag" },
      traceparent: "00-750efa5fb6a131eb2cf4db39f28366cb-5669e71839eca76b-00",
    });
    expect(queryRequest).toMatchObject({
      last_txn: "2022-01-01T00:00:0Z",
      linearized: true,
      timeout_ms: 600,
      max_contention_retries: 4,
      tags: { a: "tag" },
      traceparent: "00-750efa5fb6a131eb2cf4db39f28366cb-5669e71839eca76b-00",
    });
    expect(queryRequest.query).toBe("arg0.length == Math.add(arg1, 3)");
    expect(queryRequest.arguments).toStrictEqual({
      arg0: "baz",
      arg1: 17,
    });
  });
});
