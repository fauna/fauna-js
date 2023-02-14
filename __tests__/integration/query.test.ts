import fetch from "jest-fetch-mock";
import { env } from "process";
import { Client } from "../../src/client";
import {
  type ClientConfiguration,
  endpoints,
} from "../../src/client-configuration";
import {
  AuthenticationError,
  ClientError,
  NetworkError,
  ProtocolError,
  QueryCheckError,
  QueryRequest,
  QueryResponse,
  QueryRuntimeError,
  QueryTimeoutError,
} from "../../src/wire-protocol";
import { fql } from "../../src/query-builder";

const client = new Client({
  endpoint: env["endpoint"] ? new URL(env["endpoint"]) : endpoints.local,
  max_conns: 5,
  secret: env["secret"] || "secret",
  timeout_ms: 60_000,
});

function getTsa(tsa: TemplateStringsArray, ..._: any[]) {
  return tsa;
}

async function doQuery<T>(
  queryType: string,
  queryTsa: TemplateStringsArray,
  queryString: string,
  client: Client
): Promise<QueryResponse<T>> {
  if (queryType === "QueryRequest") {
    return client.query({ query: queryString });
  }
  return client.query(fql(queryTsa));
}

describe.each`
  queryType
  ${"QueryRequest"}
  ${"QueryBuilder"}
`("query with $queryType", ({ queryType }) => {
  type ResultType = {
    data: {
      data: {
        length: number;
      };
    };
    txn_time: string;
  };

  it("Can query an FQL-x endpoint", async () => {
    fetch.mockResponseOnce(
      JSON.stringify({ data: { length: 4, txn_time: Date.now() } })
    );

    const result: ResultType = await doQuery(
      queryType,
      getTsa`"taco".length`,
      `"taco".length`,
      client
    );

    expect(result.txn_time).not.toBeUndefined();
    expect(result).toEqual({
      data: { data: { ...result.data.data, length: 4 } },
      txn_time: result.txn_time,
    });
  });

  it("Can query with arguments", async () => {
    let result: ResultType;
    fetch.mockResponseOnce(
      JSON.stringify({ data: { length: 4, txn_time: Date.now() } })
    );
    if (queryType === "QueryRequest") {
      result = await client.query({
        query: "myArg.length",
        arguments: { myArg: "taco" },
      });
    } else {
      const str = "taco";
      result = await client.query(fql`${str}.length`);
    }
    expect(result.txn_time).not.toBeUndefined();
    expect(result).toEqual({
      data: { data: { ...result.data.data, length: 4 } },
      txn_time: result.txn_time,
    });
  });

  type HeaderTestInput = {
    fieldName:
      | "linearized"
      | "timeout_ms"
      | "max_contention_retries"
      | "tags"
      | "traceparent";
    fieldValue: any;
    expectedHeader: string;
  };

  it.each`
    fieldName                   | fieldValue                                                   | expectedHeader
    ${"linearized"}             | ${false}                                                     | ${"x-linearized: false"}
    ${"timeout_ms"}             | ${500}                                                       | ${"x-timeout-ms: 500"}
    ${"max_contention_retries"} | ${3}                                                         | ${"x-max-contention-retries: 3"}
    ${"tags"}                   | ${{ t1: "v1", t2: "v2" }}                                    | ${"x-fauna-tags: t1=v1,t2=v2"}
    ${"traceparent"}            | ${"00-750efa5fb6a131eb2cf4db39f28366cb-5669e71839eca76b-00"} | ${"traceparent: 00-750efa5fb6a131eb2cf4db39f28366cb-5669e71839eca76b-00"}
  `(
    "respects QueryRequest field $fieldName over ClientConfiguration $fieldName",
    async ({ fieldName, fieldValue, expectedHeader }: HeaderTestInput) => {
      const clientConfiguration: ClientConfiguration = {
        endpoint: env["endpoint"] ? new URL(env["endpoint"]) : endpoints.local,
        max_conns: 5,
        secret: env["secret"] || "secret",
        timeout_ms: 60,
        linearized: true,
        max_contention_retries: 7,
        tags: { alpha: "beta", gamma: "delta" },
        traceparent: "00-750efa5fb6a131eb2cf4db39f28366cb-000000000000000b-00",
      };
      const myClient = new Client(clientConfiguration);
      const expectedHeaders: { [key: string]: string } = {
        linearized: "x-linearized: true",
        max_contention_retries: "x-max-contention-retries: 7",
        tags: "x-fauna-tags: alpha=beta,gamma=delta",
        traceparent:
          "traceparent: 00-750efa5fb6a131eb2cf4db39f28366cb-000000000000000b-00",
        timeout_ms: "x-timeout-ms: 60",
      };
      expectedHeaders[fieldName] = expectedHeader;

      const headers = { [fieldName]: fieldValue };
      if (queryType === "QueryRequest") {
        const queryRequest: QueryRequest = {
          query: '"taco".length',
        };
        fetch.mockResponse(JSON.stringify({ data: { txn_time: Date.now() } }));

        await myClient.query<number>({ ...queryRequest, ...headers });
        // headers object wins if present
        await myClient.query<number>(
          { ...queryRequest, [fieldName]: "crap" },
          headers
        );
        await myClient.query<number>(queryRequest, headers);
      } else {
        await myClient.query<number>(fql`"taco".length`, headers);
      }
    }
  );

  it("throws a QueryCheckError if the query is invalid", async () => {
    expect.assertions(4);
    try {
      fetch.mockRejectOnce({
        // @ts-expect-error
        response: {
          data: {
            error: {
              message: "The query failed 1 validation check",
              code: "invalid_query",
              summary: "invalid_syntax: Expected",
            },
          },
          status: 400,
        },
      });

      await doQuery<number>(
        queryType,
        getTsa`"taco".length;`,
        '"taco".length;',
        client
      );
    } catch (e) {
      if (e instanceof QueryCheckError) {
        expect(e.message).toEqual("The query failed 1 validation check");
        expect(e.code).toEqual("invalid_query");
        expect(e.httpStatus).toEqual(400);
        // TODO once parser errors are stablized do a hard test for equality
        // rather than a string match.
        expect(e.summary).toEqual(
          expect.stringContaining("invalid_syntax: Expected")
        );
      }
    }
  });

  it("throws a QueryRuntimeError if the query hits a runtime error", async () => {
    expect.assertions(3);
    try {
      fetch.mockRejectOnce({
        // @ts-expect-error
        response: {
          data: {
            error: {
              message: "",
              code: "invalid_argument",
              summary:
                "invalid_argument: expected value for `other` of type number, received string\n" +
                "0: *query*:1\n" +
                "    |\n" +
                '  1 | "taco".length + "taco"\n' +
                "    | ^^^^^^^^^^^^^^^^^^^^^^\n" +
                "    |",
            },
          },
          status: 400,
        },
      });

      await doQuery<number>(
        queryType,
        getTsa`"taco".length + "taco"`,
        '"taco".length + "taco"',
        client
      );
    } catch (e) {
      if (e instanceof QueryRuntimeError) {
        expect(e.httpStatus).toEqual(400);
        expect(e.code).toEqual("invalid_argument");
        expect(e.summary).toEqual(
          "invalid_argument: expected value for `other` of type number, received string\n" +
            "0: *query*:1\n" +
            "    |\n" +
            '  1 | "taco".length + "taco"\n' +
            "    | ^^^^^^^^^^^^^^^^^^^^^^\n" +
            "    |"
        );
      }
    }
  });

  it("throws a QueryTimeoutError if the query times out", async () => {
    expect.assertions(4);
    const badClient = new Client({
      endpoint: env["endpoint"] ? new URL(env["endpoint"]) : endpoints.local,
      max_conns: 5,
      secret: env["secret"] || "secret",
      timeout_ms: 1,
    });
    try {
      fetch.mockRejectOnce({
        // @ts-expect-error
        response: {
          data: {
            error: {
              message: "aggressive deadline",
              code: "time_out",
            },
          },
          status: 440,
        },
      });

      await doQuery<number>(
        queryType,
        getTsa`Collection.create({ name: 'Wah' })`,
        "Collection.create({ name: 'Wah' })",
        badClient
      );
    } catch (e) {
      if (e instanceof QueryTimeoutError) {
        expect(e.message).toEqual(
          expect.stringContaining("aggressive deadline")
        );
        expect(e.httpStatus).toEqual(440);
        expect(e.code).toEqual("time_out");
      }
    }

    fetch.mockResponseOnce(JSON.stringify({ data: { txn_time: Date.now() } }));

    const actual = await client.query({
      query: "Collection.byName('Wah')",
      timeout_ms: 60_000,
    });
    expect(actual.txn_time).not.toBeNull();
  });

  it("throws a AuthenticationError creds are invalid", async () => {
    expect.assertions(4);
    const badClient = new Client({
      endpoint: env["endpoint"] ? new URL(env["endpoint"]) : endpoints.local,
      max_conns: 5,
      secret: "nah",
      timeout_ms: 60,
    });
    try {
      fetch.mockRejectOnce({
        // @ts-expect-error
        response: {
          data: {
            error: {
              message: "Unauthorized: Access token required",
              code: "unauthorized",
              summary: undefined,
            },
          },
          status: 401,
        },
      });

      await doQuery<number>(
        queryType,
        getTsa`Collection.create({ name: 'Wah' })`,
        "Collection.create({ name: 'Wah' })",
        badClient
      );
    } catch (e) {
      if (e instanceof AuthenticationError) {
        expect(e.message).toEqual("Unauthorized: Access token required");
        expect(e.code).toEqual("unauthorized");
        expect(e.httpStatus).toEqual(401);
        expect(e.summary).toBeUndefined();
      }
    }
  });

  it("throws a AuthorizationError if creds are not permissioned.", async () => {
    // TODO - AuthZ checks are not yet implemented.
  });

  it("throws a NetworkError if the connection fails.", async () => {
    expect.assertions(1);
    const myBadClient = new Client({
      endpoint: new URL("http://localhost:1"),
      max_conns: 1,
      secret: "secret",
      timeout_ms: 60,
    });
    try {
      fetch.mockRejectOnce({
        // @ts-expect-error
        request: {
          data: {
            error: {
              message: "The network connection encountered a problem.",
              code: "",
            },
          },
          status: 0,
        },
      });

      await doQuery<number>(
        queryType,
        getTsa`"taco".length;`,
        '"taco".length;',
        myBadClient
      );
    } catch (e) {
      if (e instanceof NetworkError) {
        expect(e.message).toEqual(
          "The network connection encountered a problem."
        );
      }
    }
  });

  it("throws a ClientError if the client fails unexpectedly", async () => {
    expect.assertions(1);
    const myBadClient = new Client({
      endpoint: env["endpoint"] ? new URL(env["endpoint"]) : endpoints.local,
      max_conns: 5,
      secret: env["secret"] || "secret",
      timeout_ms: 60,
    });

    try {
      fetch.mockRejectOnce({
        // @ts-expect-error
        e: {
          data: {
            error: {
              message: "The network connection encountered a problem.",
            },
          },
          status: 0,
        },
      });

      await doQuery<number>(queryType, getTsa`foo`, "foo", myBadClient);
    } catch (e) {
      if (e instanceof ClientError) {
        expect(e.message).toEqual(
          "A client level error occurred. Fauna was not called."
        );
      }
    }
  });

  it("throws a ProtocolError if the http fails outside Fauna", async () => {
    expect.assertions(2);
    const badClient = new Client({
      endpoint: new URL("https://frontdoor.fauna.com/"),
      max_conns: 5,
      secret: "nah",
      timeout_ms: 60,
    });
    try {
      fetch.mockRejectOnce({
        // @ts-ignore
        response: {
          status: 400,
        },
        message: "Protocol error",
      });

      await doQuery<number>(queryType, getTsa`foo`, "foo", badClient);
    } catch (e) {
      if (e instanceof ProtocolError) {
        expect(e.httpStatus).toBeGreaterThanOrEqual(400);
        expect(e.message).not.toBeUndefined();
      }
    }
  });
});
