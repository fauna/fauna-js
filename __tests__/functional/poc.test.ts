import { Client, endpoints, QueryError } from "../../src";

describe("query", () => {
  const client = new Client({
    endpoint: endpoints.local,
    secret: "secret",
    queryTimeoutMillis: 60,
  });

  it("Can query an FQL-x endpoint", async () => {
    const result = await client.query<number>('"taco".length');
    expect(result).toEqual(4);
  });

  it("Throws an error if the query is invalid", async () => {
    expect.assertions(1);
    try {
      await client.query<number>('"taco".length;');
    } catch (e) {
      expect(e).toEqual(new QueryError("Query failed."));
    }
  });
});
