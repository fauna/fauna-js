import { getDefaultHTTPClient, NodeHTTP2Client } from "../../src";

const client = getDefaultHTTPClient();

describe("node http2 client", () => {
  it("default client for Node.js is the NodeHTTP2Client", async () => {
    expect(client).toBeInstanceOf(NodeHTTP2Client);
  });
});
