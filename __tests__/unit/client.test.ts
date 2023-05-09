import { Client, ClientClosedError, fql, NodeHTTP2Client } from "../../src";
import {
  getClient,
  getDefaultHTTPClientOptions,
  getDefaultSecretAndEndpoint,
} from "../client";

describe("Client", () => {
  it("Refuses further requests after close", async () => {
    expect.assertions(1);
    const client = getClient();
    client.close();
    try {
      await client.query(fql`'nah'`);
    } catch (e) {
      if (e instanceof ClientClosedError) {
        expect(e.message).toEqual(
          "Your client is closed. No further requests can be issued."
        );
      }
    }
  });

  it("Refuses calls to close after client is closed.", async () => {
    expect.assertions(1);
    const client = getClient();
    client.close();
    try {
      client.close();
    } catch (e) {
      if (e instanceof ClientClosedError) {
        expect(e.message).toEqual(
          "Your client is closed. You cannot close it again."
        );
      }
    }
  });

  it("Allows for creation and usage of a new client after first client closed.", async () => {
    const nodeClient = new NodeHTTP2Client(getDefaultHTTPClientOptions());
    const clientOne = new Client(getDefaultSecretAndEndpoint(), nodeClient);
    await clientOne.query(fql`"Hello World"`);
    expect(nodeClient.isClosed()).toBe(false);
    clientOne.close();
    expect(nodeClient.isClosed()).toBe(true);
    const clientTwo = new Client(
      getDefaultSecretAndEndpoint(),
      new NodeHTTP2Client(getDefaultHTTPClientOptions())
    );
    expect((await clientTwo.query(fql`"Hello World"`)).data).toEqual(
      "Hello World"
    );
    expect(nodeClient.isClosed()).toBe(false);
    const clientThree = new Client(
      getDefaultSecretAndEndpoint(),
      new NodeHTTP2Client(getDefaultHTTPClientOptions())
    );
    clientTwo.close();
    expect(nodeClient.isClosed()).toBe(true);
    clientThree.close();
    expect(nodeClient.isClosed()).toBe(true);
  });
});
