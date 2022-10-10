import { Client } from "../../src/client";
import { endpoints } from "../../src/client-configuration";

describe("endpoints", () => {
  it("is extensible", async () => {
    (endpoints["my-alternative-port"] = new URL("http://localhost:7443")),
      expect(endpoints).toEqual({
        classic: new URL("https://db.fauna.com"),
        "eu-std": new URL("https://db.eu.fauna.com"),
        "us-std": new URL("https://db.us.fauna.com"),
        local: new URL("http://localhost:8443"),
        "my-alternative-port": new URL("http://localhost:7443"),
      });
    const client = new Client({
      endpoint: endpoints["my-alternative-port"],
      secret: "secret",
      queryTimeoutMillis: 60,
    });
    const result = await client.query<number>({ query: '"taco".length' });
    expect(result.txn_time).not.toBeUndefined();
    expect(result).toEqual({ data: 4, txn_time: result.txn_time });
  });
});
