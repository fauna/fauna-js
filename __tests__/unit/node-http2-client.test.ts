import http2 from "node:http2";
import { getDefaultHTTPClient, NodeHTTP2Client } from "../../src";
import { HTTPRequest } from "../../src";
import { getDefaultHTTPClientOptions } from "../client";
import { SupportedFaunaAPIPaths } from "../../src/http-client";

const mockRequest = jest.fn();
const mockClient = {
  request: mockRequest,
  once: () => mockClient,
  setTimeout: jest.fn(),
};
jest.spyOn(http2, "connect").mockReturnValue(mockClient as any);

const client = getDefaultHTTPClient(getDefaultHTTPClientOptions());

describe("node http2 client", () => {
  it("default client for Node.js is the NodeHTTP2Client", async () => {
    expect(client).toBeInstanceOf(NodeHTTP2Client);
  });

  it("uses the default request path if none is provided", async () => {
    const request: HTTPRequest = {
      client_timeout_ms: 0,
      data: { query: "some-query" },
      headers: {},
      method: "POST",
    };

    // We don't actually care about the status of this request for this specific test.
    // We're just testing the path is being set correctly.
    try {
      await client.request(request);
    } catch (_) {}

    expect(mockRequest).toHaveBeenCalledWith({
      ":method": "POST",
      ":path": "/query/1",
    });
  });

  it("uses the path provided in HttpRequest if provided", async () => {
    const request: HTTPRequest = {
      client_timeout_ms: 0,
      data: { query: "some-query" },
      headers: {},
      method: "POST",
      path: "/some-path" as SupportedFaunaAPIPaths,
    };

    // We don't actually care about the status of this request for this specific test.
    // We're just testing the path is being set correctly.
    try {
      await client.request(request);
    } catch (_) {}

    expect(mockRequest).toHaveBeenCalledWith({
      ":method": "POST",
      ":path": "/some-path",
    });
  });
});
