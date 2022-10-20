import { Client } from "../../src/client";
import { endpoints } from "../../src/client-configuration";

describe("endpoints", () => {
  it("is extensible", async () => {
    endpoints["my-alternative-port"] = new URL("http://localhost:7443");
    expect(endpoints).toEqual({
      cloud: new URL("https://db.fauna.com"),
      local: new URL("http://localhost:8443"),
      "my-alternative-port": new URL("http://localhost:7443"),
    });
    const client = new Client({
      endpoint: endpoints["my-alternative-port"],
      max_conns: 5,
      secret: "secret",
      timeout_ms: 60,
    });
    expect(client.client.defaults.baseURL).toEqual("http://localhost:7443/");
    const result = await client.query<number>({ query: '"taco".length' });
    expect(result.txn_time).not.toBeUndefined();
    expect(result).toEqual({ data: 4, txn_time: result.txn_time });
  });

  it.each`
    configFieldName             | configFieldValue                                             | expectedHeader
    ${"linearized"}             | ${true}                                                      | ${"x-linearized: true"}
    ${"max_contention_retries"} | ${3}                                                         | ${"x-max-contention-retries: 3"}
    ${"tags"}                   | ${{ t1: "v1", t2: "v2" }}                                    | ${"x-fauna-tags: t1=v1,t2=v2"}
    ${"traceparent"}            | ${"00-750efa5fb6a131eb2cf4db39f28366cb-5669e71839eca76b-00"} | ${"traceparent: 00-750efa5fb6a131eb2cf4db39f28366cb-5669e71839eca76b-00"}
  `(
    "Setting clientConfiguration $configFieldName leads to it being sent in headers",
    async ({ configFieldName, configFieldValue, expectedHeader }) => {
      // @ts-ignore
      const client = new Client({
        endpoint: endpoints.local,
        max_conns: 5,
        secret: "secret",
        timeout_ms: 5000,
        [configFieldName]: configFieldValue,
      });
      client.client.interceptors.response.use(function (response) {
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
