import fetchMock, { enableFetchMocks } from "jest-fetch-mock";
enableFetchMocks();

import {
  FetchClient,
  HTTPRequest,
  HTTPResponse,
  isHTTPResponse,
  NetworkError,
  QueryFailure,
  QuerySuccess,
} from "../../src";
import { getDefaultHTTPClientOptions } from "../client";

let fetchClient: FetchClient;

const dummyRequest: HTTPRequest = {
  client_timeout_ms: 10000,
  data: { query: "" },
  headers: {},
  method: "POST",
};

const dummyStats = {
  compute_ops: 0,
  read_ops: 0,
  write_ops: 0,
  query_time_ms: 0,
  storage_bytes_read: 0,
  storage_bytes_write: 0,
  contention_retries: 0,
};

describe("fetch client", () => {
  beforeAll(() => {
    fetchClient = new FetchClient(getDefaultHTTPClientOptions());
  });

  afterAll(() => {
    fetchClient.close();
  });

  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it("returns a valid query response on success", async () => {
    expect.assertions(7);
    const expected: QuerySuccess<{ foo: string }> = {
      data: { foo: "bar" },
      summary: "summary",
      txn_ts: 1676661552887330,
      query_tags: { "my-tag": "value" },
      stats: dummyStats,
    };
    const expectedHeaders = {
      "content-type": "	application/json;charset=utf-8",
      "x-faunadb-build": "230217.014809-a23359a",
      "x-some-response-header": "Some header value",
    };
    fetchMock.mockResponseOnce(JSON.stringify(expected), {
      headers: expectedHeaders,
    });
    const response: HTTPResponse = await fetchClient.request(dummyRequest);
    if (isHTTPResponse(response)) {
      expect(response.status).toEqual(200);
      expect(response.headers).toEqual(expectedHeaders);
      const body = JSON.parse(response.body);
      expect(body.data).toEqual(expected.data);
      expect(body.summary).toEqual(expected.summary);
      expect(body.txn_ts).toEqual(expected.txn_ts);
      expect(body.query_tags).toEqual(expected.query_tags);
      expect(body.stats).toEqual(expected.stats);
    }
  });

  it("returns a valid query response on failure", async () => {
    expect.assertions(7);
    const expected: QueryFailure = {
      error: {
        code: "invalid_query",
        message: "The query failed 1 validation check",
      },
      summary: "summary",
      txn_ts: 1676661552887330,
      query_tags: {},
      stats: dummyStats,
    };
    const expectedHeaders = {
      "content-type": "	application/json;charset=utf-8",
      "x-faunadb-build": "230217.014809-a23359a",
      "x-some-response-header": "Some header value",
    };
    fetchMock.mockResponseOnce(JSON.stringify(expected), {
      status: 400,
      headers: expectedHeaders,
    });
    const response: HTTPResponse = await fetchClient.request(dummyRequest);
    if (isHTTPResponse(response)) {
      expect(response.status).toEqual(400);
      expect(response.headers).toEqual(expectedHeaders);
      const body = JSON.parse(response.body);
      expect(body.error).toEqual(expected.error);
      expect(body.summary).toEqual(expected.summary);
      expect(body.txn_ts).toEqual(expected.txn_ts);
      expect(body.query_tags).toEqual(expected.query_tags);
      expect(body.stats).toEqual(expected.stats);
    }
  });

  it("returns a NetworkError if fetch rejects", async () => {
    expect.assertions(2);
    fetchMock.mockRejectOnce(new Error("oops"));
    try {
      await fetchClient.request(dummyRequest);
    } catch (e) {
      if (e instanceof NetworkError) {
        expect(e.message).toEqual(
          "The network connection encountered a problem."
        );
        expect(e.cause).toBeDefined();
      }
    }
  });

  it("returns a NetworkError if client timeout causes an abort", async () => {
    expect.assertions(2);
    fetchMock.mockResponseOnce(
      () =>
        new Promise((resolve) => setTimeout(() => resolve({ body: "" }), 100))
    );
    try {
      const badClient = new FetchClient(getDefaultHTTPClientOptions());

      await badClient.request({ ...dummyRequest, client_timeout_ms: 1 });
    } catch (e) {
      if (e instanceof NetworkError) {
        expect(e.message).toEqual(
          "The network connection encountered a problem."
        );
        expect(e.cause).toBeDefined();
      }
    }
  });
});
