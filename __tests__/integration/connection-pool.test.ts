import { Client } from "../../src/client";
import {
  type ClientConfiguration,
  endpoints,
} from "../../src/client-configuration";
import { env } from "process";

describe("Connection pool", () => {
  it("Keeps alive connections and uses a pool.", async () => {
    const clientConfiguration: ClientConfiguration = {
      endpoint: env["endpoint"] ? new URL(env["endpoint"]) : endpoints.local,
      max_conns: 5,
      secret: env["secret"] || "secret",
      timeout_ms: 60_000,
    };
    const myClient = new Client(clientConfiguration);
    myClient.client.interceptors.response.use(function (response) {
      expect(response.request?._header).not.toBeUndefined();
      if (response.request?._header) {
        expect(response.request?._header).toEqual(
          expect.stringContaining("\nConnection: keep-alive")
        );
      }
      return response;
    });
    const queryRequest = {
      query: '"taco".length',
    };
    const host = myClient.clientConfiguration.endpoint.host;
    const agentToTest =
      myClient.clientConfiguration.endpoint.protocol === "http:"
        ? myClient.client.defaults.httpAgent
        : myClient.client.defaults.httpsAgent;
    let requestOne = myClient.query<number>(queryRequest);
    let requestTwo = myClient.query<number>(queryRequest);
    let requestThree = myClient.query<number>(queryRequest);
    expect(agentToTest.getCurrentStatus()).toMatchObject({
      createSocketCount: 3,
      freeSockets: {},
      sockets: { [`${host}:`]: 3 },
    });
    await Promise.all([requestOne, requestTwo, requestThree]);
    expect(agentToTest.getCurrentStatus()).toMatchObject({
      createSocketCount: 3,
      freeSockets: { [`${host}:`]: 3 },
      sockets: {},
    });
    requestOne = myClient.query<number>(queryRequest);
    requestTwo = myClient.query<number>(queryRequest);
    requestThree = myClient.query<number>(queryRequest);
    expect(agentToTest.getCurrentStatus()).toMatchObject({
      createSocketCount: 3,
      freeSockets: {},
      sockets: { [`${host}:`]: 3 },
    });
    await Promise.all([requestOne, requestTwo, requestThree]);
    expect(agentToTest.getCurrentStatus()).toMatchObject({
      createSocketCount: 3,
      freeSockets: { [`${host}:`]: 3 },
      sockets: {},
    });
    requestOne = myClient.query<number>(queryRequest);
    requestTwo = myClient.query<number>(queryRequest);
    requestThree = myClient.query<number>(queryRequest);
    let requestFour = myClient.query<number>(queryRequest);
    let requestFive = myClient.query<number>(queryRequest);
    let requestSix = myClient.query<number>(queryRequest);
    expect(agentToTest.getCurrentStatus()).toMatchObject({
      createSocketCount: 5,
      freeSockets: {},
      sockets: { [`${host}:`]: 5 },
      requests: { [`${host}:`]: 1 },
    });
    await Promise.all([
      requestOne,
      requestTwo,
      requestThree,
      requestFour,
      requestFive,
      requestSix,
    ]);
    expect(agentToTest.getCurrentStatus()).toMatchObject({
      createSocketCount: 5,
      freeSockets: { [`${host}:`]: 5 },
      sockets: {},
      requests: {},
    });
  });
});
