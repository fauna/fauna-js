import { Client } from "../../src/client";
import type { QuerySuccess } from "../../src/wire-protocol";
import {
  type ClientConfiguration,
  endpoints,
} from "../../src/client-configuration";
import { env } from "process";

describe("Connection pool", () => {
  it("Keeps alive connections", async () => {
    expect.assertions(2);
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
    await myClient.query({ query: '"taco".length' });
  });

  it("Pools connections", async () => {
    const config: ClientConfiguration = {
      endpoint: env["endpoint"] ? new URL(env["endpoint"]) : endpoints.local,
      max_conns: 5, // pool size 5
      secret: env["secret"] || "secret",
      timeout_ms: 60_000,
    };
    const client = new Client(config);
    const host = config.endpoint.host;
    const agentToTest =
      config.endpoint.protocol === "http:"
        ? client.client.defaults.httpAgent
        : client.client.defaults.httpsAgent;

    let requests = fireRequests(3, client);
    // initially 3 sockets should be busy; no pending requests
    // in the pool queue
    expect(agentToTest.getCurrentStatus()).toMatchObject({
      createSocketCount: 3,
      freeSockets: {},
      sockets: { [`${host}:`]: 3 },
      requests: {},
    });
    await Promise.all(requests);
    // once we're all done we only should have ever made
    // 3 sockets and they should all be free
    expect(agentToTest.getCurrentStatus()).toMatchObject({
      createSocketCount: 3,
      freeSockets: { [`${host}:`]: 3 },
      sockets: {},
      requests: {},
    });
    requests = fireRequests(3, client);
    // firing 3 more requsts, we've still only made 4 total
    // and all 3 are currently serving requests.
    // there's no requests waiting in the request queue.
    expect(agentToTest.getCurrentStatus()).toMatchObject({
      createSocketCount: 3,
      freeSockets: {},
      sockets: { [`${host}:`]: 3 },
      requests: {},
    });
    await Promise.all(requests);
    // after those are done - we've still only made 3 sockets
    // ever and they are all currently free.
    expect(agentToTest.getCurrentStatus()).toMatchObject({
      createSocketCount: 3,
      freeSockets: { [`${host}:`]: 3 },
      sockets: {},
      requests: {},
    });
    requests = fireRequests(6, client);
    // if we then fire 6 requests at once - we have 5 total sockets
    // ever created. All 5 are currently busy. And 1 requests is
    // waiting in the request queue.
    expect(agentToTest.getCurrentStatus()).toMatchObject({
      createSocketCount: 5,
      freeSockets: {},
      sockets: { [`${host}:`]: 5 },
      requests: { [`${host}:`]: 1 },
    });
    await Promise.all(requests);
    // once all 6 are done, we've only ever made 5 sockets (as that's
    // our max_conns); and all 5 free to serve more requests. There's no requests
    // pending in the queue.
    expect(agentToTest.getCurrentStatus()).toMatchObject({
      createSocketCount: 5,
      freeSockets: { [`${host}:`]: 5 },
      sockets: {},
      requests: {},
    });
  });

  it("Closes unused connections", async () => {
    const config: ClientConfiguration = {
      endpoint: env["endpoint"] ? new URL(env["endpoint"]) : endpoints.local,
      max_conns: 5, // pool size 5
      secret: env["secret"] || "secret",
      timeout_ms: 60_000,
    };
    const client = new Client(config);
    const host = config.endpoint.host;
    const agentToTest =
      config.endpoint.protocol === "http:"
        ? client.client.defaults.httpAgent
        : client.client.defaults.httpsAgent;

    let requests = fireRequests(3, client);
    // initially 3 sockets should be busy; no pending requests
    // in the pool queue
    expect(agentToTest.getCurrentStatus()).toMatchObject({
      createSocketCount: 3,
      closeSocketCount: 0,
      timeoutSocketCount: 0,
      requestCount: 0,
      freeSockets: {},
      sockets: { [`${host}:`]: 3 },
      requests: {},
    });
    await Promise.all(requests);
    // our socket timeout is 4 seconds So after 4.5 seconds
    // we should have no more sockets open
    await new Promise((resolve) => setTimeout(resolve, 4500));
    expect(agentToTest.getCurrentStatus()).toMatchObject({
      createSocketCount: 3,
      closeSocketCount: 3,
      timeoutSocketCount: 3,
      requestCount: 3, // so far we've completed 3 requests
      freeSockets: {},
      sockets: {},
      requests: {},
    });
    requests = fireRequests(3, client);
    // firing 3 more requests will lead to 3 new sockets
    // being opened.
    expect(agentToTest.getCurrentStatus()).toMatchObject({
      createSocketCount: 6,
      closeSocketCount: 3,
      timeoutSocketCount: 3,
      requestCount: 3, // so far we've completed 3 requests
      freeSockets: {},
      sockets: { [`${host}:`]: 3 },
      requests: {},
    });
    await Promise.all(requests);
    // we're all done, but the sockets haven't timed out yet
    // so 3 should still be open.
    expect(agentToTest.getCurrentStatus()).toMatchObject({
      createSocketCount: 6,
      closeSocketCount: 3,
      timeoutSocketCount: 3,
      requestCount: 6, // now we've completed 3 requests
      freeSockets: { [`${host}:`]: 3 },
      sockets: {},
      requests: {},
    });
  });

  function fireRequests(count: number, client: Client) {
    const requests: Array<Promise<QuerySuccess<number>>> = [];
    for (let i = 0; i < count; i++) {
      requests.push(
        client.query<number>({
          query: '"taco".length',
        })
      );
    }
    return requests;
  }
});
