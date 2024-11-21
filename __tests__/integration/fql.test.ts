/**
 * Tests here are to test the driver itself, per se, but to provide test
 * coverage for the FQL query language.
 */

import { Client, fql, Document, DocumentT } from "../../src";
import { getClient } from "../client";

let client: Client;

beforeEach(() => {
  client = getClient({ query_timeout_ms: 60_000 });
});

afterEach(() => {
  client.close();
});

describe("FQL behavior", () => {
  it("'.data' materializes embedded references ", async () => {
    // Create a collection for test data
    const collectionName = "DataBehavior" + Date.now();
    await client.query(fql`
      Collection.create({ 
        name: ${collectionName},
        indexes: {
          by_parent: {
            terms: [
              {
                field: ".parent",
              }
            ],
          },
        },
      })
    `);

    type Child = { value: number };
    type Parent = {
      parent: true;
      embedded: DocumentT<Child>;
      embeddedList: DocumentT<Child>[];
    };

    // Create test data
    const doc1 = (
      await client.query(
        fql`Collection(${collectionName}).create({ value: 1 })`,
      )
    ).data;
    const doc2 = (
      await client.query(
        fql`Collection(${collectionName}).create({ value: 2 })`,
      )
    ).data;
    const parentDoc = (
      await client.query<DocumentT<Parent>>(
        fql`Collection(${collectionName}).create({
        parent: true,
        embedded: ${doc1},
        embeddedList: [${doc1}, ${doc2}]
      })`,
      )
    ).data;

    // getting by ID and using '.data' should materialize embedded references
    const byId = (
      await client.query<Parent>(
        fql`Collection(${collectionName}).byId(${parentDoc.id})!.data`,
      )
    ).data;
    expect(byId.embedded).toBeInstanceOf(Document);
    expect(byId.embeddedList[0]).toBeInstanceOf(Document);
    expect(byId.embeddedList[1]).toBeInstanceOf(Document);

    // getting by index search and using '.data' should materialize embedded references
    const byIndex = (
      await client.query<Parent>(
        fql`Collection(${collectionName}).by_parent(true).first()!.data`,
      )
    ).data;
    expect(byIndex.embedded).toBeInstanceOf(Document);
    expect(byIndex.embeddedList[0]).toBeInstanceOf(Document);
    expect(byIndex.embeddedList[1]).toBeInstanceOf(Document);
  });
});
