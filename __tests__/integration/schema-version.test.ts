import { fql } from "../../src";
import { getClient } from "../client";

describe("schema version is returned by the client", () => {
  const client = getClient();
  it("returns the schema version", async () => {
    const resTs = await client.query(fql`
      if (Collection.byName("TestColl") == null) {
        Collection.create({ name: "TestColl" })
      } else {
        TestColl.definition.update({})
      }
    `);

    const expectedSchemaVersion = resTs.txn_ts;

    const res = await client.query(fql`
      TestColl.all()
    `);

    expect(res.schema_version).toEqual(expectedSchemaVersion);
  });
});
