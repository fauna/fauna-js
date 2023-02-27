import { getClient } from "../client";
import { fql } from "../../src/query-builder";
import { HTTPClient, getDefaultHTTPClient } from "../../src/http-client";

describe("last_txn tracking in client", () => {
  it("Tracks the last_txn datetime and send in the headers", async () => {
    let expectedLastTxn: string | undefined = undefined;
    const httpClient: HTTPClient = {
      async request(req) {
        if (expectedLastTxn === undefined) {
          expect(req.headers["x-last-txn"]).toBeUndefined();
        } else {
          expect(req.headers["x-last-txn"]).toEqual(expectedLastTxn);
        }
        return getDefaultHTTPClient().request(req);
      },
    };

    const myClient = getClient(
      {
        max_conns: 5,
        timeout_ms: 60_000,
      },
      httpClient
    );

    const resultOne = await myClient.query({
      query:
        "\
if (Collection.byName('Customers') == null) {\
  Collection.create({ name: 'Customers' })\
}",
    });
    expect(resultOne.txn_time).not.toBeUndefined();
    expectedLastTxn = resultOne.txn_time;
    const resultTwo = await myClient.query(
      fql`
        if (Collection.byName('Orders') == null) {
          Collection.create({ name: 'Orders' })
        }`
    );
    expect(resultTwo.txn_time).not.toBeUndefined();
    expect(resultTwo.txn_time).not.toEqual(resultOne.txn_time);
    expectedLastTxn = resultTwo.txn_time;
    const resultThree = await myClient.query({
      query:
        "\
if (Collection.byName('Products') == null) {\
  Collection.create({ name: 'Products' })\
}",
    });
    expect(resultThree.txn_time).not.toBeUndefined();
    expect(resultThree.txn_time).not.toEqual(resultTwo.txn_time);
  });

  it("Accepts an override of the last_txn datetime and sends in the headers", async () => {
    let expectedLastTxn: string | undefined = undefined;
    const httpClient: HTTPClient = {
      async request(req) {
        if (expectedLastTxn === undefined) {
          expect(req.headers["x-last-txn"]).toBeUndefined();
        } else {
          expect(req.headers["x-last-txn"]).toEqual(expectedLastTxn);
        }
        return getDefaultHTTPClient().request(req);
      },
    };

    const myClient = getClient(
      {
        max_conns: 5,
        timeout_ms: 60_000,
      },
      httpClient
    );

    const resultOne = await myClient.query({
      query:
        "\
if (Collection.byName('Customers') == null) {\
  Collection.create({ name: 'Customers' })\
}",
    });
    expect(resultOne.txn_time).not.toBeUndefined();
    expectedLastTxn = resultOne.txn_time;
    const resultTwo = await myClient.query(
      fql`
        if (Collection.byName('Orders') == null) {\
          Collection.create({ name: 'Orders' })\
        }
      `,
      {
        last_txn: resultOne.txn_time,
      }
    );
    expect(resultTwo.txn_time).not.toBeUndefined();
    expect(resultTwo.txn_time).not.toEqual(resultOne.txn_time);
    const resultThree = await myClient.query({
      last_txn: resultOne.txn_time,
      query:
        "\
if (Collection.byName('Products') == null) {\
  Collection.create({ name: 'Products' })\
}",
    });
    expect(resultThree.txn_time).not.toBeUndefined();
    expect(resultThree.txn_time).not.toEqual(resultTwo.txn_time);
  });
});
