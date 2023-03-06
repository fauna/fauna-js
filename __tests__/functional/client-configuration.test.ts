import { getClient } from "../client";
import { Client } from "../../src/client";
import { endpoints } from "../../src/client-configuration";
import { HTTPClient, getDefaultHTTPClient } from "../../src/http-client";

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
    process.env["FAUNA_SECRET"] = "foo";
    const client = new Client({ secret: "bar", query_timeout_ms: 10 });
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
      cloud: new URL("https://db.fauna.com"),
      preview: new URL("https://db.fauna-preview.com"),
      local: new URL("http://localhost:8443"),
      localhost: new URL("http://localhost:8443"),
      "my-alternative-port": new URL("http://localhost:7443"),
    });
    const client = getClient({
      endpoint: endpoints["my-alternative-port"],
      max_conns: 5,
      secret: "secret",
      query_timeout_ms: 60_000,
    });
    const result = await client.query<number>({ query: '"taco".length' });
    expect(result.data).toEqual(4);
    expect(result.txn_ts).toBeDefined();
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
          return getDefaultHTTPClient().request(req);
        },
      };

      const client = getClient(
        {
          max_conns: 5,
          query_timeout_ms: 5000,
          [fieldName]: fieldValue,
        },
        httpClient
      );
      await client.query<number>({ query: '"taco".length' });
    }
  );
});
