import { Client } from "../../src/client";
import { endpoints } from "../../src/client-configuration";
import {
  AuthenticationError,
  ClientError,
  NetworkError,
  ProtocolError,
  QueryCheckError,
  QueryRuntimeError,
} from "../../src/wire-protocol";
import { env } from "process";

const client = new Client({
  endpoint: env["endpoint"] ? new URL(env["endpoint"]) : endpoints.local,
  max_conns: 5,
  secret: env["secret"] || "secret",
  timeout_ms: 60,
});

describe("query", () => {
  it("Can query an FQL-x endpoint", async () => {
    const result = await client.query<number>({ query: '"taco".length' });
    expect(result.txn_time).not.toBeUndefined();
    expect(result).toEqual({ data: 4, txn_time: result.txn_time });
  });

  it("throws a QueryCheckError if the query is invalid", async () => {
    expect.assertions(5);
    try {
      await client.query<number>({ query: '"taco".length;' });
    } catch (e) {
      if (e instanceof QueryCheckError) {
        expect(e.message).toEqual("The query failed 1 validation check");
        expect(e.code).toEqual("invalid_query");
        expect(e.httpStatus).toEqual(400);
        expect(e.summary).toEqual(
          'invalid_syntax: Expected ([ \\t\\n\\r] | lineComment\
 | blockComment | end-of-input):1:14, found ";"\n\
  |\n\
1 | "taco".length;\n\
  |              ^ Expected ([ \\t\\n\\r] | lineComment | blockComment | end-of-input):1:14, found ";"\n\
  |'
        );
        expect(e.failures).toEqual([
          {
            code: "invalid_syntax",
            message:
              'Expected ([ \\t\\n\\r] | lineComment | blockComment | end-of-input):1:14, found ";"',
          },
        ]);
      }
    }
  });

  it("throws a QueryRuntimeError if the query hits a runtime error", async () => {
    expect.assertions(3);
    try {
      await client.query({ query: '"taco".length + "taco"' });
    } catch (e) {
      if (e instanceof QueryRuntimeError) {
        expect(e.httpStatus).toEqual(400);
        expect(e.code).toEqual("invalid_argument");
        expect(e.summary).toEqual(
          "invalid_argument: expected value for `other` of type number, received string\n" +
            "0: *query*:1\n" +
            "    |\n" +
            '  1 | "taco".length + "taco"\n' +
            "    | ^^^^^^^^^^^^^^^^^^^^^^\n" +
            "    |"
        );
      }
    }
  });

  it("throws a AuthenticationError creds are invalid", async () => {
    expect.assertions(4);
    const badClient = new Client({
      endpoint: env["endpoint"] ? new URL(env["endpoint"]) : endpoints.local,
      max_conns: 5,
      secret: "nah",
      timeout_ms: 60,
    });
    try {
      await badClient.query<number>({ query: '"taco".length' });
    } catch (e) {
      if (e instanceof AuthenticationError) {
        expect(e.message).toEqual("Unauthorized: Access token required");
        expect(e.code).toEqual("unauthorized");
        expect(e.httpStatus).toEqual(401);
        expect(e.summary).toBeUndefined();
      }
    }
  });

  it("throws a AuthorizationError if creds are not permissioned.", async () => {
    // TODO - AuthZ checks are not yet implemented.
  });

  it("throws a NetworkError if the connection fails.", async () => {
    expect.assertions(2);
    const myBadClient = new Client({
      endpoint: new URL("http://localhost:1"),
      max_conns: 1,
      secret: "secret",
      timeout_ms: 60,
    });
    try {
      await myBadClient.query<number>({ query: '"taco".length;' });
    } catch (e) {
      if (e instanceof NetworkError) {
        expect(e.message).toEqual(
          "The network connection encountered a problem."
        );
        expect(e.cause).not.toBeUndefined();
      }
    }
  });

  it("throws a ClientError if the client fails unexpectedly", async () => {
    expect.assertions(2);
    const myBadClient = new Client({
      endpoint: env["endpoint"] ? new URL(env["endpoint"]) : endpoints.local,
      max_conns: 5,
      secret: env["secret"] || "secret",
      timeout_ms: 60,
    });
    myBadClient.client.post = () => {
      throw new Error("boom!");
    };
    try {
      await myBadClient.query({ query: "foo" });
    } catch (e) {
      if (e instanceof ClientError) {
        expect(e.cause).not.toBeUndefined();
        expect(e.message).toEqual(
          "A client level error occurred. Fauna was not called."
        );
      }
    }
  });

  it("throws a ProtocolError if the http fails outside Fauna", async () => {
    expect.assertions(2);
    const badClient = new Client({
      endpoint: new URL("https://frontdoor.fauna.com/"),
      max_conns: 5,
      secret: "nah",
      timeout_ms: 60,
    });
    try {
      await badClient.query({ query: "foo" });
    } catch (e) {
      if (e instanceof ProtocolError) {
        expect(e.httpStatus).toBeGreaterThanOrEqual(400);
        expect(e.message).not.toBeUndefined();
      }
    }
  });
});
