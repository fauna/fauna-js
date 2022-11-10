import { Client } from "../../src/client";
import { endpoints } from "../../src/client-configuration";

beforeEach(() => {
  delete process.env["FAUNA_SECRET"];
});

describe("ClientConfiguration", () => {
  it("Client exposes a default client configuration", () => {
    process.env["FAUNA_SECRET"] = "foo";
    const client = new Client();
    expect(client.clientConfiguration).toEqual({
      secret: "foo",
      timeout_ms: 60_000,
      max_conns: 10,
      endpoint: endpoints.cloud,
    });
  });

  it("Client respectes passed in client configuration over defaults", () => {
    process.env["FAUNA_SECRET"] = "foo";
    const client = new Client({ secret: "bar", timeout_ms: 10 });
    expect(client.clientConfiguration).toEqual({
      secret: "bar",
      timeout_ms: 10,
      max_conns: 10,
      endpoint: endpoints.cloud,
    });
  });

  it("A ClientConfiguration setting with no secret throws an error on driver construction", () => {
    expect.assertions(1);
    try {
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
    const client = new Client({
      endpoint: endpoints["my-alternative-port"],
      max_conns: 5,
      secret: "secret",
      timeout_ms: 60_000,
    });
    expect(client.client.defaults.baseURL).toEqual("http://localhost:7443/");
    const result = await client.query<number>({ query: '"taco".length' });
    expect(result.txn_time).not.toBeUndefined();
    expect(result).toEqual({ data: 4, txn_time: result.txn_time });
  });

  type HeaderTestInput = {
    fieldName: "linearized" | "max_contention_retries" | "tags" | "traceparent";
    fieldValue: any;
    expectedHeader: string;
  };

  it.each`
    fieldName                   | fieldValue                                                   | expectedHeader
    ${"linearized"}             | ${true}                                                      | ${"x-linearized: true"}
    ${"max_contention_retries"} | ${3}                                                         | ${"x-max-contention-retries: 3"}
    ${"tags"}                   | ${{ t1: "v1", t2: "v2" }}                                    | ${"x-fauna-tags: t1=v1,t2=v2"}
    ${"traceparent"}            | ${"00-750efa5fb6a131eb2cf4db39f28366cb-5669e71839eca76b-00"} | ${"traceparent: 00-750efa5fb6a131eb2cf4db39f28366cb-5669e71839eca76b-00"}
  `(
    "Setting clientConfiguration $fieldName leads to it being sent in headers",
    async ({ fieldName, fieldValue, expectedHeader }: HeaderTestInput) => {
      const client = new Client({
        endpoint: endpoints.local,
        max_conns: 5,
        secret: "secret",
        timeout_ms: 5000,
        [fieldName]: fieldValue,
      });
      client.client.interceptors.response.use(function (response) {
        expect(response.request?._header).not.toBeUndefined();
        if (response.request?._header) {
          expect(response.request._header).toEqual(
            expect.stringContaining("x-timeout-ms: 5000")
          );
          expect(response.request._header).toEqual(
            expect.stringContaining(`\n${expectedHeader}`)
          );
        }
        return response;
      });
      await client.query<number>({ query: '"taco".length' });
    }
  );
});
