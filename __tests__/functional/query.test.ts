import { Client } from "../../src/client";
import { endpoints } from "../../src/client-configuration";
import { QueryError } from "../../src/wire-protocol";

describe("query", () => {
  const client = new Client({
    endpoint: endpoints.local,
    secret: "secret",
    queryTimeoutMillis: 60,
  });

  it("Can query an FQL-x endpoint", async () => {
    const result = await client.query<number>({ query: '"taco".length' });
    expect(result.txn_time).not.toBeUndefined();
    expect(result).toEqual({ data: 4, txn_time: result.txn_time });
  });

  it("Throws an error if the query is invalid", async () => {
    expect.assertions(1);
    try {
      await client.query<number>({ query: '"taco".length;' });
    } catch (e) {
      expect(e).toEqual(new QueryError("Query failed."));
    }
  });
});
