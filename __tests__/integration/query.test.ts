import {
  AbortError,
  AuthenticationError,
  Client,
  ClientConfiguration,
  ClientError,
  fql,
  getDefaultHTTPClient,
  HTTPClient,
  HTTPRequest,
  HTTPResponse,
  InvalidRequestError,
  Module,
  NetworkError,
  NodeHTTP2Client,
  ProtocolError,
  QueryCheckError,
  QueryRequest,
  QueryRuntimeError,
  QueryTimeoutError,
  QueryValue,
  ServiceError,
} from "../../src";
import { getClient, getDefaultHTTPClientOptions } from "../client";

let client: Client;

const dummyResponse: HTTPResponse = {
  body: JSON.stringify({
    data: "",
    txn_ts: 0,
    stats: {
      compute_ops: 0,
      read_ops: 0,
      write_ops: 0,
      query_time_ms: 0,
      storage_bytes_read: 0,
      storage_bytes_write: 0,
      contention_retries: 0,
    },
  }),
  headers: {},
  status: 200,
};

beforeEach(() => {
  client = getClient({ query_timeout_ms: 60_000 });
});

afterEach(() => {
  client.close();
});

describe("query", () => {
  it("Can query an FQL v10 endpoint", async () => {
    const result = await client.query<number>(fql`"taco".length`);

    expect(result.data).toBe(4);
    expect(result.summary).toBeDefined();
    expect(result.txn_ts).toBeDefined();
    expect(result.stats).toBeDefined();
    expect(result.stats?.compute_ops).toBeDefined();
    expect(result.stats?.contention_retries).toBeDefined();
    expect(result.stats?.query_time_ms).toBeDefined();
    expect(result.stats?.read_ops).toBeDefined();
    expect(result.stats?.storage_bytes_read).toBeDefined();
    expect(result.stats?.storage_bytes_write).toBeDefined();
    expect(result.stats?.write_ops).toBeDefined();
  });

  it("Can query with arguments", async () => {
    const str = "taco";
    const result = await client.query(fql`${str}.length`);
    expect(result.data).toBe(4);
    expect(result.txn_ts).toBeDefined();
  });

  it("Can query with tags", async () => {
    let query_tags = {
      project: "teapot",
      hello: "world",
      testing: "foobar",
    };
    const result = await client.query<string>(fql`"foo"`, { query_tags });
    expect(result.query_tags).toStrictEqual(query_tags);
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
        query_timeout_ms: { key: "x-query-timeout-ms", value: "5000" },
        typecheck: { key: "x-typecheck", value: "true" },
      };
      expectedHeaders[fieldName] = expectedHeader;
      const httpClient: HTTPClient = {
        async request(req) {
          Object.entries(expectedHeaders).forEach(([_, expectedHeader]) => {
            expect(req.headers[expectedHeader.key]).toBe(expectedHeader.value);
          });
          expect(req.headers["x-driver-env"]).toEqual(
            expect.stringContaining("driver=")
          );
          expect(req.headers["x-driver-env"]).toEqual(
            expect.stringContaining("os=")
          );
          expect(req.headers["x-driver-env"]).toEqual(
            expect.stringContaining("runtime=")
          );
          return dummyResponse;
        },
        close() {},
      };
      const clientConfiguration: Partial<ClientConfiguration> = {
        linearized: true,
        max_contention_retries: 7,
        query_tags: { alpha: "beta", gamma: "delta" },
        traceparent: "00-750efa5fb6a131eb2cf4db39f28366cb-000000000000000b-00",
        typecheck: true,
      };
      const myClient = getClient(clientConfiguration, httpClient);
      const headers = { [fieldName]: fieldValue };
      await myClient.query<number>(fql`"taco".length`, headers);
      myClient.close();
    }
  );

  it("can send arguments directly", async () => {
    const foo = {
      double: 4.14,
      int: 32,
      string: "foo",
      null: null,
      object: { foo: "bar" },
      array: [1, 2, 3],
      "@tagged": "tagged",
    };

    const response = await client.query<typeof foo>(fql`foo`, {
      arguments: { foo },
    });
    const foo2 = response.data;

    expect(foo2.double).toBe(4.14);
    expect(foo2.int).toBe(32);
    expect(foo2.string).toBe("foo");
    expect(foo2.null).toBeNull();
    expect(foo2.object).toStrictEqual({ foo: "bar" });
    expect(foo2.array).toStrictEqual([1, 2, 3]);
    expect(foo2["@tagged"]).toBe("tagged");
  });

  it("throws a QueryCheckError if the query is invalid", async () => {
    expect.assertions(4);
    try {
      await client.query(fql`happy little fox`);
    } catch (e) {
      if (e instanceof QueryCheckError) {
        expect(e.httpStatus).toBe(400);
        expect(e.message).toBeDefined();
        expect(e.code).toBeDefined();
        expect(e.queryInfo?.summary).toBeDefined();
      }
    }
  });

  it("throws a QueryRuntimeError if the query hits a runtime error", async () => {
    expect.assertions(3);
    try {
      await client.query(fql`"taco".length + "taco"`);
    } catch (e) {
      if (e instanceof QueryRuntimeError) {
        expect(e.httpStatus).toBe(400);
        expect(e.code).toBe("invalid_argument");
        expect(e.queryInfo?.summary).toBeDefined();
      }
    }
  });

  it("Includes constraint failures when present", async () => {
    expect.assertions(6);
    try {
      await client.query(
        fql`Function.create({"name": "my_double", "body": "x => x * 2"})`
      );
      await client.query(
        fql`Function.create({"name": "my_double", "body": "x => x * 2"})`
      );
    } catch (e) {
      if (e instanceof ServiceError) {
        expect(e.httpStatus).toBe(400);
        expect(e.code).toBe("constraint_failure");
        expect(e.queryInfo?.summary).toBeDefined();
        if (e.constraint_failures !== undefined) {
          expect(e.constraint_failures.length).toBe(1);
          for (let constraintFailure of e.constraint_failures) {
            expect(constraintFailure.message).toBeDefined();
            expect(constraintFailure.paths).toBeDefined();
          }
        }
      }
    }
  });

  it("throws an InvalidRequestError when request is invalid", async () => {
    expect.assertions(2);
    let badClient: Client | undefined = undefined;
    try {
      const httpClient: HTTPClient = {
        async request(req) {
          const bad_req: HTTPRequest = {
            ...req,
            data: "{}" as unknown as QueryRequest,
          };
          return getDefaultHTTPClient(getDefaultHTTPClientOptions()).request(
            bad_req
          );
        },
        close() {},
      };
      badClient = getClient({}, httpClient);
      await badClient.query(fql`"dummy"`);
    } catch (e) {
      if (e instanceof InvalidRequestError) {
        expect(e.httpStatus).toBe(400);
        expect(e.code).toBe("invalid_request");
      }
    } finally {
      badClient?.close();
    }
  });

  it("throws a AbortError is the `abort` function is called", async () => {
    expect.assertions(4);
    try {
      await client.query(fql`abort("oops")`);
    } catch (e) {
      if (e instanceof AbortError) {
        expect(e.httpStatus).toBe(400);
        expect(e.code).toBe("abort");
        expect(e.queryInfo?.summary).toBeDefined();
        expect(e.abort).toBe("oops");
      }
    }
  });

  it("throws a QueryTimeoutError if the query times out", async () => {
    expect.assertions(4);
    const badClient = getClient({
      query_timeout_ms: 1,
    });
    try {
      await badClient.query(fql`Collection.create({ name: 'Wah' })`);
    } catch (e) {
      if (e instanceof QueryTimeoutError) {
        expect(e.message).toEqual(
          expect.stringContaining("aggressive deadline")
        );
        expect(e.httpStatus).toBe(440);
        expect(e.code).toBe("time_out");
      }
    } finally {
      badClient.close();
    }

    const actual = await client.query(fql`Collection.byName('Wah')`, {
      query_timeout_ms: 60_000,
    });
    expect(actual.data).toBeDefined();
  });

  it("throws a AuthenticationError creds are invalid", async () => {
    expect.assertions(4);
    const badClient = getClient({
      secret: "nah",
      query_timeout_ms: 60,
    });
    try {
      await badClient.query(fql`Collection.create({ name: 'Wah' })`);
    } catch (e) {
      if (e instanceof AuthenticationError) {
        expect(e.message).toBeDefined();
        expect(e.code).toBe("unauthorized");
        expect(e.httpStatus).toBe(401);
        expect(e.queryInfo?.summary).toBeUndefined();
      }
    } finally {
      badClient.close();
    }
  });

  it("throws a AuthorizationError if creds are not permissioned.", async () => {
    // TODO - AuthZ checks are not yet implemented.
  });

  it("throws a NetworkError if the connection fails.", async () => {
    expect.assertions(2);
    const badClient = getClient({
      endpoint: new URL("http://localhost:1"),
      secret: "secret",
      query_timeout_ms: 60,
    });
    try {
      await badClient.query(fql`"taco".length;`);
    } catch (e) {
      if (e instanceof NetworkError) {
        expect(e.message).toBe("The network connection encountered a problem.");
        expect(e.cause).toBeDefined();
      }
    } finally {
      badClient.close();
    }
  });

  it("throws a NetworkError on client timeout", async () => {
    expect.assertions(2);

    const httpClient = getDefaultHTTPClient(getDefaultHTTPClientOptions());
    const badHTTPClient = {
      async request(req: HTTPRequest) {
        const badRequest: HTTPRequest = {
          ...req,
          client_timeout_ms: 1,
        };
        return httpClient.request(badRequest);
      },
      close() {},
    };

    const badClient = getClient({}, badHTTPClient);
    try {
      await badClient.query(fql``);
    } catch (e: any) {
      if (e instanceof NetworkError) {
        expect(e.message).toBe("The network connection encountered a problem.");
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
      close() {},
    };
    const badClient = getClient(
      {
        query_timeout_ms: 60,
      },
      httpClient
    );
    try {
      await badClient.query(fql`foo`);
    } catch (e: any) {
      if (e instanceof ClientError) {
        expect(e.cause).toBeDefined();
        expect(e.message).toBe(
          "A client level error occurred. Fauna was not called."
        );
      }
    } finally {
      badClient.close();
    }
  });

  it("throws a ProtocolError if the http fails outside Fauna", async () => {
    expect.assertions(2);
    const badClient = getClient({
      endpoint: new URL("https://frontdoor.fauna.com/"),
      secret: "nah",
      query_timeout_ms: 60,
    });
    try {
      await badClient.query(fql`foo`);
    } catch (e) {
      if (e instanceof ProtocolError) {
        expect(e.httpStatus).toBeGreaterThanOrEqual(400);
        expect(e.message).toBeDefined();
      }
    } finally {
      badClient.close();
    }
  });

  it("session is closed regardless of number of clients", async () => {
    const httpClient1 = NodeHTTP2Client.getClient(
      getDefaultHTTPClientOptions()
    );
    const httpClient2 = NodeHTTP2Client.getClient(
      getDefaultHTTPClientOptions()
    );
    const httpClient3 = NodeHTTP2Client.getClient(
      getDefaultHTTPClientOptions()
    );
    const client1 = getClient({}, httpClient1);
    const client2 = getClient({}, httpClient2);
    const client3 = getClient({}, httpClient3);

    // establish session and reference counts
    await client1.query(fql`"hello"`);
    await client2.query(fql`"hello"`);
    await client3.query(fql`"hello"`);

    // let it trigger idle timeout
    await new Promise((resolve) => setTimeout(resolve, 600));

    // clients should be closed
    expect(httpClient1.isClosed()).toBe(true);
    expect(httpClient2.isClosed()).toBe(true);
    expect(httpClient3.isClosed()).toBe(true);
  });

  it("can be called after session idle timeout", async () => {
    const client = getClient({ http2_session_idle_ms: 50 });

    // establish a session
    await client.query(fql`"hello"`);

    // let it trigger idle timeout
    await new Promise((resolve) => setTimeout(resolve, 100));

    // okay to make a new query
    await client.query(fql`"hello"`);
    client.close();
  });
});

describe("query can encode / decode QueryValue correctly", () => {
  it("treats undefined as unprovided when in object", async () => {
    const client = getClient();
    const collectionName = "UndefinedTest";
    await client.query(fql`
      if (Collection.byName(${collectionName}) == null) {
        Collection.create({ name: ${collectionName}})
      }`);
    // whack in undefined
    // @ts-expect-error Type 'undefined' is not assignable to type 'QueryValue'
    let toughInput: QueryValue = {
      foo: "bar",
      shouldnt_exist: undefined,
      nested_object: {
        i_exist: true,
        i_dont_exist: undefined,
      },
    };
    const docCreated = await client.query<any>(fql`
        ${new Module(collectionName)}.create(${toughInput})`);
    client.close();
    expect(docCreated.data.should_exist).toBeUndefined();
    expect(docCreated.data.nested_object.i_dont_exist).toBeUndefined();
    expect(docCreated.data.foo).toBe("bar");
    expect(docCreated.data.nested_object.i_exist).toBe(true);
  });

  it("treats undefined as unprovided passed directly as value", async () => {
    expect.assertions(2);
    const client = getClient();
    const collectionName = "UndefinedTest";
    await client.query(fql`
      if (Collection.byName(${collectionName}) == null) {
        Collection.create({ name: ${collectionName}})
      }`);
    // whack in undefined
    // @ts-expect-error Type 'undefined' is not assignable to type 'QueryValue'
    let undefinedValue: QueryValue = undefined;
    try {
      await client.query(fql`
        ${new Module(collectionName)}.create({
          foo: "bar",
          shouldnt_exist: ${undefinedValue},
          nested_object: {
            i_exist: true,
            i_dont_exist: ${undefinedValue}
          }
        })`);
    } catch (e) {
      if (e instanceof TypeError) {
        expect(e.name).toBe("TypeError");
        expect(e.message).toBe(
          "Passing undefined as a QueryValue is not supported"
        );
      }
    } finally {
      client.close();
    }
  });
});
