import { Client, fql } from "../../src";
import { newDB } from "../client";

describe("schema version is returned by the client", () => {
  let client: Client;

  // make a fresh db each run
  beforeAll(async () => {
    client = await newDB("SchemaTest");
  });

  it("returns the schema version", async () => {
    const resTs = await client.query(fql`
      Collection.create({ name: "TestColl" })
    `);

    const expectedSchemaVersion = resTs.txn_ts;

    const res = await client.query(fql`
      TestColl.all()
    `);

    expect(res.schema_version).toEqual(expectedSchemaVersion);
  });
});
