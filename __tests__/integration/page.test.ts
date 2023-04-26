import { DocumentT, fql, Page } from "../../src";
import { getClient } from "../client";

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

describe("pagination iterator", () => {
  beforeAll(async () => {
    await client.query(fql`
      if (Collection.byName("IterTestSmall") != null) {
        IterTestSmall.definition.delete()
      }
      if (Collection.byName("IterTestBig") != null) {
        IterTestBig.definition.delete()
      }
    `);
    await client.query(fql`
      Collection.create({ name: "IterTestSmall" })
      Collection.create({ name: "IterTestBig" })
    `);
    await client.query(fql`
      [
        0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
      ].map(i => IterTestSmall.create({ value: i }))

      [
        0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
        10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
      ].map(i => IterTestBig.create({ value: i }))
    `);
  });

  type MyDoc = DocumentT<{
    value: number;
  }>;

  it("can get single page using for..of when the set is small", async () => {
    expect.assertions(1);

    const response = await client.query<Page<MyDoc>>(fql`IterTestSmall.all()`);
    const page = response.data;

    const iterator = client.paginate(page);

    for await (const newPage of iterator) {
      expect(newPage.length).toBe(10);
    }
  });

  it("can get multiple pages using for..of when the set is large", async () => {
    expect.assertions(2);

    const response = await client.query<Page<MyDoc>>(fql`IterTestBig.all()`);
    const page = response.data;

    const iterator = client.paginate(page);

    for await (const data of iterator) {
      expect(data.length).toBeGreaterThan(0);
    }
  });

  it("can get pages using next()", async () => {
    const response = await client.query<Page<MyDoc>>(fql`IterTestBig.all()`);
    const page = response.data;

    const iterator = client.paginate(page);

    const result1 = await iterator.next();
    expect(result1.done).toBe(false);
    expect(result1.value?.length).toBe(16);

    const result2 = await iterator.next();
    expect(result2.done).toBe(false);
    expect(result2.value?.length).toBe(4);

    const result3 = await iterator.next();
    expect(result3.done).toBe(true);
  });

  it("can get pages using a loop with hasNext()", async () => {
    expect.assertions(4);

    const response = await client.query<Page<MyDoc>>(fql`IterTestBig.all()`);
    const page = response.data;

    const iterator = client.paginate(page);

    while (iterator.hasNext()) {
      const { value, done } = await iterator.next();
      expect(value?.length).toBeGreaterThan(0);
      expect(done).toBe(false);
    }
  });

  it("can get previous pages using previous()", async () => {
    const response = await client.query<Page<MyDoc>>(fql`IterTestBig.all()`);
    const page = response.data;

    const iterator = client.paginate(page);

    while (iterator.hasNext()) {
      await iterator.next();
    }

    const result2 = await iterator.previous();
    expect(result2.done).toBe(false);
    expect(result2.value?.length).toBe(16);

    const result3 = await iterator.previous();
    expect(result3.done).toBe(true);
  });
});
