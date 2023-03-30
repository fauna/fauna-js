import { getClient } from "../client";
import { fql } from "../../src/query-builder";
import { HTTPClient, getDefaultHTTPClient } from "../../src/http-client";

describe("last_txn_ts tracking in client", () => {
  it("Tracks the last_txn_ts datetime and send in the headers", async () => {
    let expectedLastTxn: number | undefined;
    const httpClient: HTTPClient = {
      async request(req) {
        if (expectedLastTxn === undefined) {
          expect(req.headers["x-last-txn-ts"]).toBeUndefined();
        } else {
          expect(req.headers["x-last-txn-ts"]).toEqual(expectedLastTxn);
        }
        return getDefaultHTTPClient().request(req);
      },

      close() {},
    };

    const myClient = getClient(
      {
        max_conns: 5,
        query_timeout_ms: 60_000,
      },
      httpClient
    );

    const resultOne = await myClient.query(fql`
      if (Collection.byName('Customers') == null) {
        Collection.create({ name: 'Customers' })
      }
    `);
    expect(resultOne.txn_ts).not.toBeUndefined();
    expectedLastTxn = resultOne.txn_ts;
    const resultTwo = await myClient.query(
      fql`
        if (Collection.byName('Orders') == null) {
          Collection.create({ name: 'Orders' })
        }`
    );
    expect(resultTwo.txn_ts).not.toBeUndefined();
    expect(resultTwo.txn_ts).not.toEqual(resultOne.txn_ts);
    expectedLastTxn = resultTwo.txn_ts;
    const resultThree = await myClient.query(fql`
      if (Collection.byName('Products') == null) {
        Collection.create({ name: 'Products' })
      }
    `);
    expect(resultThree.txn_ts).not.toBeUndefined();
    expect(resultThree.txn_ts).not.toEqual(resultTwo.txn_ts);
  });

  it("Accepts an override of the last_txn_ts datetime and sends in the headers", async () => {
    let expectedLastTxn: number | undefined;
    const httpClient: HTTPClient = {
      async request(req) {
        if (expectedLastTxn === undefined) {
          expect(req.headers["x-last-txn-ts"]).toBeUndefined();
        } else {
          expect(req.headers["x-last-txn-ts"]).toEqual(expectedLastTxn);
        }
        return getDefaultHTTPClient().request(req);
      },

      close() {},
    };

    const myClient = getClient(
      {
        max_conns: 5,
        query_timeout_ms: 60_000,
      },
      httpClient
    );

    const resultOne = await myClient.query(fql`
      if (Collection.byName('Customers') == null) {\
        Collection.create({ name: 'Customers' })\
      }
    `);
    expect(resultOne.txn_ts).not.toBeUndefined();
    expectedLastTxn = resultOne.txn_ts;
    myClient.lastTxnTs = resultOne.txn_ts as number;
    const resultTwo = await myClient.query(
      fql`
      if (Collection.byName('Orders') == null) {\
        Collection.create({ name: 'Orders' })\
      }
    `
    );
    expect(resultTwo.txn_ts).not.toBeUndefined();
    expect(resultTwo.txn_ts).not.toEqual(resultOne.txn_ts);
    myClient.lastTxnTs = 0;
    expectedLastTxn = resultTwo.txn_ts;
    const resultThree = await myClient.query(fql`
      if (Collection.byName('Products') == null) {\
        Collection.create({ name: 'Products' })\
      }
    `);
    expect(resultThree.txn_ts).not.toBeUndefined();
    expect(resultThree.txn_ts).not.toEqual(resultTwo.txn_ts);
  });
});
