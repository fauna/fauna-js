import fetch from "jest-fetch-mock";
import { Client } from "../../src/client";
import { endpoints } from "../../src/client-configuration";
import { env } from "process";
import { fql } from "../../src/query-builder";

describe("last_txn tracking in client", () => {
  it("Tracks the last_txn datetime and send in the headers", async () => {
    const myClient = new Client({
      endpoint: env["endpoint"] ? new URL(env["endpoint"]) : endpoints.local,
      max_conns: 5,
      secret: env["secret"] || "secret",
      timeout_ms: 60_000,
    });

    fetch.mockResponseOnce(JSON.stringify({ data: { txn_time: Date.now() } }));

    const resultOne = await myClient.query({
      query:
        "\
if (Collection.byName('Customers') == null) {\
  Collection.create({ name: 'Customers' })\
}",
    });

    expect(resultOne.txn_time).not.toBeUndefined();

    fetch.mockResponseOnce(JSON.stringify({ data: { txn_time: Date.now() } }));

    const resultTwo = await myClient.query(
      fql`
        if (Collection.byName('Orders') == null) {
          Collection.create({ name: 'Orders' })
        }`
    );

    expect(resultTwo.txn_time).not.toBeUndefined();
    expect(resultTwo.txn_time).not.toEqual(resultOne.txn_time);

    fetch.mockResponseOnce(JSON.stringify({ data: { txn_time: Date.now() } }));

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
    const myClient = new Client({
      endpoint: env["endpoint"] ? new URL(env["endpoint"]) : endpoints.local,
      max_conns: 5,
      secret: env["secret"] || "secret",
      timeout_ms: 60_000,
    });

    fetch.mockResponseOnce(JSON.stringify({ data: { txn_time: Date.now() } }));

    const resultOne = await myClient.query({
      query:
        "\
  if (Collection.byName('Customers') == null) {\
    Collection.create({ name: 'Customers' })\
  }",
    });

    expect(resultOne.txn_time).not.toBeUndefined();

    fetch.mockResponseOnce(JSON.stringify({ data: { txn_time: Date.now() } }));

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

    fetch.mockResponseOnce(JSON.stringify({ data: { txn_time: Date.now() } }));

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
