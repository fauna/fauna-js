import { Client } from "../../src/client";
import { endpoints } from "../../src/client-configuration";
import { InternalClientError, QueryError } from "../../src/wire-protocol";
import { env } from "process";

const client = new Client({
  endpoint: env["endpoint"] ? new URL(env["endpoint"]) : endpoints.local,
  maxConns: 5,
  secret: env["secret"] || "secret",
  queryTimeoutMillis: 60,
});

describe("query", () => {
  it("Can query an FQL-x endpoint", async () => {
    const result = await client.query<number>({ query: '"taco".length' });
    expect(result.txn_time).not.toBeUndefined();
    expect(result).toEqual({ data: 4, txn_time: result.txn_time });
  });

  it("throws a QueryError if the query is invalid", async () => {
    expect.assertions(8);
    try {
      await client.query<number>({ query: '"taco".length;' });
    } catch (e) {
      expect(e instanceof QueryError).toBe(true);
      if (e instanceof QueryError) {
        expect(e.message).toEqual("The query failed 1 validation check");
        expect(e.code).toEqual("invalid_query");
        expect(e.statusCode).toEqual(400);
        expect(e.failures).toEqual([
          {
            code: "invalid_syntax",
            message:
              'Expected ([ \\t\\n\\r] | lineComment | blockComment | end-of-input):1:14, found ";"',
          },
        ]);
        expect(e.txn_time).toBeUndefined();
        expect(e.stats).toBeUndefined();
        expect(e.trace).toBeUndefined();
      }
    }
  });

  it("throws a InternalClientError if the client fails.", async () => {
    expect.assertions(3);
    const myBadClient = new Client({
      endpoint: new URL("http://localhost:1"),
      maxConns: 1,
      secret: "secret",
      queryTimeoutMillis: 60,
    });
    try {
      await myBadClient.query<number>({ query: '"taco".length;' });
    } catch (e) {
      expect(e instanceof InternalClientError).toBe(true);
      if (e instanceof InternalClientError) {
        expect(e.message).toEqual("Unknown InternalClientError");
        // @ts-ignore
        expect(e.cause).not.toBeUndefined();
      }
    }
  });
});
