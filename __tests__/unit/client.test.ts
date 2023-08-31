import {
  Client,
  ClientClosedError,
  QueryRuntimeError,
  fql,
  NodeHTTP2Client,
} from "../../src";
import {
  getClient,
  getDefaultHTTPClientOptions,
  getDefaultSecretAndEndpoint,
} from "../client";

describe("Client", () => {
  it("Allows setting a secret in query", async () => {
    const client = getClient();
    try {
      await client.query(fql`Role.create({ name: "hi" })`, {
        secret: client.clientConfiguration.secret + ":server",
      });
      throw new Error("shouldn't work");
    } catch (e) {
      if (e instanceof QueryRuntimeError) {
        expect(e.message).toEqual(
          "Insufficient privileges to perform the action."
        );
      } else {
        throw new Error(`wrong error ${e}`);
      }
    }
  });

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
    // Sessions are only connected upon making requests. An HTTPClient that has
    // not yet made a request appears effectively as closed.

    const nodeClient = NodeHTTP2Client.getClient(getDefaultHTTPClientOptions());
    const clientOne = new Client(getDefaultSecretAndEndpoint(), nodeClient);
    await clientOne.query(fql`"Hello World"`); // nodeClient.request(): refs = [nodeClient]
    expect(nodeClient.isClosed()).toBe(false);

    clientOne.close(); // nodeClient.close(): refs = []
    expect(nodeClient.isClosed()).toBe(true);

    const clientTwo = new Client(
      getDefaultSecretAndEndpoint(),
      NodeHTTP2Client.getClient(getDefaultHTTPClientOptions())
    );
    expect((await clientTwo.query(fql`"Hello World"`)).data).toEqual(
      "Hello World"
    ); // clientTwo.#httpClient.request(): refs = [clientTwo.#httpClient]
    expect(nodeClient.isClosed()).toBe(false);

    const clientThree = new Client(
      getDefaultSecretAndEndpoint(),
      NodeHTTP2Client.getClient(getDefaultHTTPClientOptions())
    );
    expect((await clientThree.query(fql`"Hello World"`)).data).toEqual(
      "Hello World"
    ); // clientThree.#httpClient.request(): refs = [clientTwo.#httpClient, clientThree.#httpClient]
    clientTwo.close();
    // clientTwo.#httpClient.close(): refs = [clientThree.#httpClient]
    expect(nodeClient.isClosed()).toBe(false);

    clientThree.close();
    // clientThree.#httpClient.close(): refs = []
    expect(nodeClient.isClosed()).toBe(true);
  });
});
