import { Client, ClientClosedError, fql, NodeHTTP2Client } from "../../src";
import { getClient, getDefaultSecretAndEndpoint } from "../client";

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
    const nodeClient = NodeHTTP2Client.getClient();
    const clientOne = new Client(getDefaultSecretAndEndpoint(), nodeClient);
    expect(nodeClient.isClosed()).toBe(false);
    await clientOne.query(fql`"Hello World"`);
    clientOne.close();
    expect(nodeClient.isClosed()).toBe(true);
    const clientTwo = new Client(
      getDefaultSecretAndEndpoint(),
      NodeHTTP2Client.getClient()
    );
    expect(nodeClient.isClosed()).toBe(false);
    expect((await clientTwo.query(fql`"Hello World"`)).data).toEqual(
      "Hello World"
    );
    const clientThree = new Client(
      getDefaultSecretAndEndpoint(),
      NodeHTTP2Client.getClient()
    );
    clientTwo.close();
    expect(nodeClient.isClosed()).toBe(false);
    clientThree.close();
    expect(nodeClient.isClosed()).toBe(true);
  });
});
