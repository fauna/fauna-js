import fetch from "jest-fetch-mock";
import { Client } from "../../src/client";
import { endpoints } from "../../src/client-configuration";

jest.mock("../../src/wire-protocol");

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

    expect(client.clientConfiguration.endpoint.href).toEqual(
      "http://localhost:7443/"
    );

    fetch.mockResponseOnce(
      JSON.stringify({ data: { length: 4, txn_time: Date.now() } })
    );

    const result = await client.query({ query: '"taco".length' });
    expect(result.txn_time).not.toBeUndefined();
    expect(result).toEqual({
      data: {
        data: {
          ...result.data.data,
          length: 4,
        },
      },
      txn_time: result.txn_time,
    });
  });
});
