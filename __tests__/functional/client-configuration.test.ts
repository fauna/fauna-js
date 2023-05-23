import {
  Client,
  ClientConfiguration,
  endpoints,
  fql,
  getDefaultHTTPClient,
  HTTPClient,
} from "../../src";
import { getClient, getDefaultHTTPClientOptions } from "../client";

// save a copy
const PROCESS_ENV = { ...process.env };

beforeEach(() => {
  process.env = { ...PROCESS_ENV };
});

describe("ClientConfiguration", () => {
  it("Client exposes a default client configuration", () => {
    process.env["FAUNA_SECRET"] = "foo";
    const client = new Client();
    expect(Buffer.from(JSON.stringify(client)).toString()).not.toContain(
      "secret"
    );
  });

  it("Client respectes passed in client configuration over defaults", () => {
    // TODO: when the Client accepts an http client add a mock that validates
    //   the configuration changes were applied.
  });

  it("A ClientConfiguration setting with no secret throws an error on driver construction", () => {
    expect.assertions(1);
    try {
      delete process.env["FAUNA_SECRET"];
      new Client();
    } catch (e: any) {
      if ("message" in e) {
        expect(e.message).toEqual(
          "You must provide a secret to the driver. Set it in \
an environmental variable named FAUNA_SECRET or pass it to the Client constructor."
        );
      }
    }
  });

  it("endpoints is extensible", async () => {
    endpoints["my-alternative-port"] = new URL("http://localhost:7443");
    expect(endpoints).toEqual({
      default: new URL("https://db.fauna.com"),
      local: new URL("http://localhost:8443"),
      localhost: new URL("http://localhost:8443"),
      "my-alternative-port": new URL("http://localhost:7443"),
    });
    const client = getClient({
      endpoint: endpoints["my-alternative-port"],
      secret: "secret",
      query_timeout_ms: 60_000,
    });
    const result = await client.query<number>(fql`"taco".length`);
    expect(result.data).toEqual(4);
    expect(result.txn_ts).toBeDefined();
    client.close();
  });

  it("client allows txn time to be set", async () => {
    const client = getClient();
    expect(client.lastTxnTs).toBeUndefined();
    const expectedTxnTime = Date.now() * 1000;
    client.lastTxnTs = expectedTxnTime;
    expect(client.lastTxnTs).toBe(expectedTxnTime);
    const addFiveMinutes = expectedTxnTime + 5 * 60 * 1000 * 1000;
    client.lastTxnTs = addFiveMinutes;
    expect(client.lastTxnTs).toBe(addFiveMinutes);
    // setting to the past keeps the more recent ts.
    client.lastTxnTs = expectedTxnTime;
    expect(client.lastTxnTs).toBe(addFiveMinutes);
    client.close();
  });

  type HeaderTestInput = {
    fieldName:
      | "linearized"
      | "max_contention_retries"
      | "query_tags"
      | "traceparent";
    fieldValue: any;
    expectedHeader: { key: string; value: string };
  };

  it.each`
    fieldName                   | fieldValue                                                   | expectedHeader
    ${"linearized"}             | ${true}                                                      | ${{ key: "x-linearized", value: "true" }}
    ${"max_contention_retries"} | ${3}                                                         | ${{ key: "x-max-contention-retries", value: "3" }}
    ${"query_tags"}             | ${{ t1: "v1", t2: "v2" }}                                    | ${{ key: "x-query-tags", value: "t1=v1,t2=v2" }}
    ${"traceparent"}            | ${"00-750efa5fb6a131eb2cf4db39f28366cb-5669e71839eca76b-00"} | ${{ key: "traceparent", value: "00-750efa5fb6a131eb2cf4db39f28366cb-5669e71839eca76b-00" }}
    ${"typecheck"}              | ${false}                                                     | ${{ key: "x-typecheck", value: "false" }}
  `(
    "Setting clientConfiguration $fieldName leads to it being sent in headers",
    async ({ fieldName, fieldValue, expectedHeader }: HeaderTestInput) => {
      expect.assertions(2);
      const httpClient: HTTPClient = {
        async request(req) {
          expect(req.headers["x-query-timeout-ms"]).toEqual("5000");
          const _expectedHeader = expectedHeader;
          expect(req.headers[_expectedHeader.key]).toEqual(
            _expectedHeader.value
          );
          return getDefaultHTTPClient(getDefaultHTTPClientOptions()).request(
            req
          );
        },

        close() {},
      };

      const client = getClient(
        {
          query_timeout_ms: 5000,
          [fieldName]: fieldValue,
        },
        httpClient
      );
      await client.query<number>(fql`"taco".length`);
      client.close();
    }
  );

  it("can accept endpoints with or without a trailing slash.", async () => {
    const client1 = getClient({ endpoint: new URL("http://localhost:8443/") });
    await client1.query<number>(fql`"taco".length`);
    client1.close();

    const client2 = getClient({ endpoint: new URL("http://localhost:8443") });
    await client2.query<number>(fql`"taco".length`);
    client2.close();
  });

  it.each`
    option
    ${"client_timeout_buffer_ms"}
    ${"endpoint"}
    ${"format"}
    ${"http2_session_idle_ms"}
    ${"query_timeout_ms"}
    ${"http2_max_streams"}
    ${"fetch_keepalive"}
    ${"long_type"}
  `(
    "throws if $option provided is undefined",
    async ({ option }: { option: keyof ClientConfiguration }) => {
      expect.assertions(1);
      let client: Client | undefined = undefined;
      try {
        const config: ClientConfiguration = {};
        config[option] = undefined;
        client = getClient(config);
      } catch (e: any) {
        expect(e).toBeInstanceOf(TypeError);
      } finally {
        client?.close();
      }
    }
  );

  it("throws a RangeError if 'client_timeout_buffer_ms' is less than or equal to zero", async () => {
    expect.assertions(1);
    let client: Client | undefined = undefined;
    try {
      client = getClient({ client_timeout_buffer_ms: 0 });
    } catch (e: any) {
      expect(e).toBeInstanceOf(RangeError);
    } finally {
      client?.close();
    }
  });

  it("throws a RangeError if 'query_timeout_ms' is less than or equal to zero", async () => {
    expect.assertions(1);
    let client: Client | undefined = undefined;
    try {
      client = getClient({ query_timeout_ms: 0 });
    } catch (e: any) {
      expect(e).toBeInstanceOf(RangeError);
    } finally {
      client?.close();
    }
  });

  it("throws a RangeError if 'http2_max_streams' is less than or equal to zero", async () => {
    expect.assertions(1);
    try {
      getClient({ query_timeout_ms: 0 });
    } catch (e: any) {
      expect(e).toBeInstanceOf(RangeError);
    }
  });
});
