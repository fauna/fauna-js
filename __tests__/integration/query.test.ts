import { getClient } from "../client";
import { Client } from "../../src/client";
import { type ClientConfiguration } from "../../src/client-configuration";
import {
  AuthenticationError,
  ClientError,
  NetworkError,
  ProtocolError,
  QueryCheckError,
  QueryRuntimeError,
  QueryTimeoutError,
  ServiceError,
} from "../../src/errors";
import { HTTPClient, getDefaultHTTPClient } from "../../src/http-client";
import { fql } from "../../src/query-builder";
import { type QueryRequest, QuerySuccess } from "../../src/wire-protocol";

const client = getClient({
  max_conns: 5,
  query_timeout_ms: 60_000,
});

function getTsa(tsa: TemplateStringsArray, ..._: any[]) {
  return tsa;
}

async function doQuery<T>(
  queryType: string,
  queryTsa: TemplateStringsArray,
  queryString: string,
  client: Client
): Promise<QuerySuccess<T>> {
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
  it("Can query an FQL-x endpoint", async () => {
    const result = await doQuery<number>(
      queryType,
      getTsa`"taco".length`,
      `"taco".length`,
      client
    );

    expect(result.data).toEqual(4);
    expect(result.txn_ts).toBeDefined();
  });

  it("Can query with arguments", async () => {
    let result;
    if (queryType === "QueryRequest") {
      result = await client.query({
        query: "myArg.length",
        arguments: { myArg: "taco" },
      });
    } else {
      const str = "taco";
      result = await client.query(fql`${str}.length`);
    }
    expect(result.data).toEqual(4);
    expect(result.txn_ts).toBeDefined();
  });

  type HeaderTestInput = {
    fieldName:
      | "linearized"
      | "query_timeout_ms"
      | "max_contention_retries"
      | "query_tags"
      | "traceparent";
    fieldValue: any;
    expectedHeader: { key: string; value: string };
  };

  it.each`
    fieldName                   | fieldValue                                                   | expectedHeader
    ${"format"}                 | ${"simple"}                                                  | ${{ key: "x-format", value: "simple" }}
    ${"linearized"}             | ${false}                                                     | ${{ key: "x-linearized", value: "false" }}
    ${"query_timeout_ms"}       | ${500}                                                       | ${{ key: "x-query-timeout-ms", value: "500" }}
    ${"max_contention_retries"} | ${3}                                                         | ${{ key: "x-max-contention-retries", value: "3" }}
    ${"query_tags"}             | ${{ t1: "v1", t2: "v2" }}                                    | ${{ key: "x-query-tags", value: "t1=v1,t2=v2" }}
    ${"traceparent"}            | ${"00-750efa5fb6a131eb2cf4db39f28366cb-5669e71839eca76b-00"} | ${{ key: "traceparent", value: "00-750efa5fb6a131eb2cf4db39f28366cb-5669e71839eca76b-00" }}
    ${"typecheck"}              | ${false}                                                     | ${{ key: "x-typecheck", value: "false" }}
  `(
    "respects QueryRequest field $fieldName over ClientConfiguration $fieldName",
    async ({ fieldName, fieldValue, expectedHeader }: HeaderTestInput) => {
      const expectedHeaders: Record<string, { key: string; value: string }> = {
        format: { key: "x-format", value: "tagged" },
        linearized: { key: "x-linearized", value: "true" },
        max_contention_retries: { key: "x-max-contention-retries", value: "7" },
        query_tags: { key: "x-query-tags", value: "alpha=beta,gamma=delta" },
        traceparent: {
          key: "traceparent",
          value: "00-750efa5fb6a131eb2cf4db39f28366cb-000000000000000b-00",
        },
        query_timeout_ms: { key: "x-query-timeout-ms", value: "60" },
        typecheck: { key: "x-typecheck", value: "true" },
      };
      expectedHeaders[fieldName] = expectedHeader;
      const httpClient: HTTPClient = {
        async request(req) {
          Object.entries(expectedHeaders).forEach(([_, expectedHeader]) => {
            expect(req.headers[expectedHeader.key]).toEqual(
              expectedHeader.value
            );
          });

          return getDefaultHTTPClient().request(req);
        },
      };
      const clientConfiguration: Partial<ClientConfiguration> = {
        format: "tagged",
        max_conns: 5,
        query_timeout_ms: 60,
        linearized: true,
        max_contention_retries: 7,
        query_tags: { alpha: "beta", gamma: "delta" },
        traceparent: "00-750efa5fb6a131eb2cf4db39f28366cb-000000000000000b-00",
        typecheck: true,
      };
      const myClient = getClient(clientConfiguration, httpClient);
      const headers = { [fieldName]: fieldValue };
      if (queryType === "QueryRequest") {
        const queryRequest: QueryRequest = {
          query: '"taco".length',
        };
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
      await doQuery<number>(
        queryType,
        getTsa`happy little fox`,
        "happy little fox",
        client
      );
    } catch (e) {
      if (e instanceof QueryCheckError) {
        expect(e.httpStatus).toEqual(400);
        expect(e.message).toBeDefined();
        expect(e.code).toBeDefined();
        expect(e.summary).toBeDefined();
      }
    }
  });

  it("throws a QueryRuntimeError if the query hits a runtime error", async () => {
    expect.assertions(3);
    try {
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
        expect(e.summary).toBeDefined();
      }
    }
  });

  it("Includes constraint failures when present", async () => {
    expect.assertions(6);
    try {
      await doQuery<number>(
        queryType,
        getTsa`Function.create({"name": "double", "body": "x => x * 2"})`,
        'Function.create({"name": "double", "body": "x => x * 2"})',
        client
      );
    } catch (e) {
      if (e instanceof ServiceError) {
        expect(e.httpStatus).toEqual(400);
        expect(e.code).toEqual("constraint_failure");
        expect(e.summary).toBeDefined();
        if (e.constraint_failures !== undefined) {
          expect(e.constraint_failures.length).toEqual(1);
          for (let constraintFailure of e.constraint_failures) {
            expect(constraintFailure.message).toBeDefined();
            expect(constraintFailure.paths).toBeDefined();
          }
        }
      }
    }
  });

  it("throws a QueryTimeoutError if the query times out", async () => {
    expect.assertions(4);
    const badClient = getClient({
      max_conns: 5,
      query_timeout_ms: 1,
    });
    try {
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
    const actual = await client.query({
      query: "Collection.byName('Wah')",
      query_timeout_ms: 60_000,
    });
    expect(actual.data).toBeDefined();
  });

  it("throws a AuthenticationError creds are invalid", async () => {
    expect.assertions(4);
    const badClient = getClient({
      max_conns: 5,
      secret: "nah",
      query_timeout_ms: 60,
    });
    try {
      await doQuery<number>(
        queryType,
        getTsa`Collection.create({ name: 'Wah' })`,
        "Collection.create({ name: 'Wah' })",
        badClient
      );
    } catch (e) {
      if (e instanceof AuthenticationError) {
        expect(e.message).toBeDefined();
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
    expect.assertions(2);
    const myBadClient = getClient({
      endpoint: new URL("http://localhost:1"),
      max_conns: 1,
      secret: "secret",
      query_timeout_ms: 60,
    });
    try {
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
        expect(e.cause).toBeDefined();
      }
    }
  });

  it("throws a ClientError if the client fails unexpectedly", async () => {
    expect.assertions(2);
    const httpClient: HTTPClient = {
      async request(req) {
        throw new Error("boom!");
      },
    };
    const myBadClient = getClient(
      {
        max_conns: 5,
        query_timeout_ms: 60,
      },
      httpClient
    );
    try {
      await doQuery<number>(queryType, getTsa`foo`, "foo", myBadClient);
    } catch (e) {
      if (e instanceof ClientError) {
        expect(e.cause).toBeDefined();
        expect(e.message).toEqual(
          "A client level error occurred. Fauna was not called."
        );
      }
    }
  });

  it("throws a ProtocolError if the http fails outside Fauna", async () => {
    expect.assertions(2);
    const badClient = getClient({
      endpoint: new URL("https://frontdoor.fauna.com/"),
      max_conns: 5,
      secret: "nah",
      query_timeout_ms: 60,
    });
    try {
      await doQuery<number>(queryType, getTsa`foo`, "foo", badClient);
    } catch (e) {
      if (e instanceof ProtocolError) {
        expect(e.httpStatus).toBeGreaterThanOrEqual(400);
        expect(e.message).toBeDefined();
      }
    }
  });
});
