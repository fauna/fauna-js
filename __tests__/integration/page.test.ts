import { getClient } from "../client";
import { fql } from "../../src/query-builder";
import { Page } from "../../src/values";

const client = getClient({
  max_conns: 5,
  query_timeout_ms: 60_000,
});

afterAll(() => {
  client.close();
});

describe("querying for set", () => {
  it("can round-trip Page", async () => {
    //TODO: uncomment to add test once core accepts `@set` tagged values
    // const set = new Page<number>({ data: [1, 2, 3], after: "1234" });
    // const queryBuilder = fql`${set}`;
    // const result = await client.query<Page<number>>(queryBuilder);
    // expect(result.data).toBeInstanceOf(Page);
    // expect(result.data.data).toStrictEqual([1, 2, 3]);
    // expect(result.data.after).toBe("1234");
  });
});
