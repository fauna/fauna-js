import { getClient } from "../client";
import { fql } from "../../src/query-builder";
import { Page } from "../../src/values";

const client = getClient({
  max_conns: 5,
  query_timeout_ms: 60_000,
});

let testDoc: Document;

describe("querying for set", () => {
  beforeAll(async () => {
    await client.query(fql`
      if (Collection.byName("DocTest") == null) {
        Collection.create({ name: "DocTest" })
      }
    `);

    const result = await client.query<Document>(fql`DocTest.create({})`);
    testDoc = result.data;
  });

  it("can round-trip Page", async () => {
    const set = new Page<number>({ data: [1, 2, 3], after: "1234" });

    const queryBuilder = fql`${set}`;
    // WIP: core does not accept `@set` tagged values
    // const result = await client.query<Page<number>>(queryBuilder);
    const result = await client.query<{ data: number[]; after: string }>(
      queryBuilder
    );

    // WIP: core does not accept `@set` tagged values
    // expect(result.data).toBeInstanceOf(Page);
    expect(result.data.data).toStrictEqual([1, 2, 3]);
    expect(result.data.after).toBe("1234");
  });
});