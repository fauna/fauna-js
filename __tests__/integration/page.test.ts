import { DocumentT, fql } from "../../src";
import { PaginationHelper } from "../../src/values";
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

describe("PaginationHelper", () => {
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

    const response = await client.query<PaginationHelper<MyDoc>>(
      fql`IterTestSmall.all()`
    );
    const paginationHelper = response.data;

    for await (const page of paginationHelper) {
      expect(page.data.length).toBe(10);
    }
  });

  it("can get multiple pages using for..of when the set is large", async () => {
    expect.assertions(2);

    const response = await client.query<PaginationHelper<MyDoc>>(
      fql`IterTestBig.all()`
    );
    const paginationHelper = response.data;

    for await (const page of paginationHelper) {
      expect(page.data.length).toBeGreaterThan(0);
    }
  });

  it("can get pages using next()", async () => {
    expect.assertions(3);

    const response = await client.query<PaginationHelper<MyDoc>>(
      fql`IterTestBig.all()`
    );
    const paginationHelper = response.data;

    const result1 = await paginationHelper.next();
    if (!result1.done) {
      expect(result1.value.data.length).toBe(16);
    }

    const result2 = await paginationHelper.next();
    if (!result2.done) {
      expect(result2.value.data.length).toBe(4);
    }

    const result3 = await paginationHelper.next();
    expect(result3.done).toBe(true);
  });

  it("can get pages using a loop with next()", async () => {
    expect.assertions(2);
    const response = await client.query<PaginationHelper<MyDoc>>(
      fql`IterTestBig.all()`
    );
    const paginationHelper = response.data;

    let done = false;
    while (!done) {
      const next = await paginationHelper.next();
      done = next.done ?? false;

      if (!next.done) {
        const page = next.value;
        expect(page.data.length).toBeGreaterThan(0);
      }
    }
  });

  it("can can stop the iterator with the return method", async () => {
    expect.assertions(1);

    const response = await client.query<PaginationHelper<MyDoc>>(
      fql`IterTestBig.all()`
    );
    const paginationHelper = response.data;

    for await (const page of paginationHelper) {
      expect(page.data.length).toBe(16);
      await paginationHelper.return();
    }
  });

  it("can can stop the iterator with the throw method", async () => {
    expect.assertions(2);

    const response = await client.query<PaginationHelper<MyDoc>>(
      fql`IterTestBig.all()`
    );
    const paginationHelper = response.data;

    try {
      for await (const page of paginationHelper) {
        expect(page.data.length).toBe(16);
        await paginationHelper.throw("oops");
      }
    } catch (e) {
      expect(e).toBe("oops");
    }
  });
});
