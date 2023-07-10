import { fql } from "../../src";
import { getClient } from "../client";

describe("schema version is returned by the client", () => {
  const client = getClient();
  it("returns the schema version", async () => {
    const resTs = await client.query(fql`
    Collection.create({ name: "TestColl" })
    `);

    const expectedSchemaVersion = resTs.txn_ts;

    const res = await client.query(fql`
    Customers.all()
    `);

    expect(res.schema_version).toEqual(expectedSchemaVersion);
  });
});
