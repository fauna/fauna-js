import {
  DocumentT,
  fql,
  getDefaultHTTPClient,
  HTTPClient,
  Page,
} from "../../src";
import { getClient, getDefaultHTTPClientOptions } from "../client";

const client = getClient({
  query_timeout_ms: 60_000,
});

const smallItems = new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
const bigItems = new Set([
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
]);

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

describe("SetIterator", () => {
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
      ${[...smallItems]}.map(i => IterTestSmall.create({ value: i }))
      ${[...bigItems]}.map(i => IterTestBig.create({ value: i }))
    `);
  });

  type MyDoc = DocumentT<{
    value: number;
  }>;

  it("can get single page using for..of when the set is small", async () => {
    expect.assertions(2);

    const response = await client.query<Page<MyDoc>>(fql`IterTestSmall.all()`);
    const page = response.data;
    const setIterator = client.paginate(page);

    const foundItems = new Set<number>();
    for await (const page of setIterator) {
      expect(page.length).toBe(10);
      for (const item of page) {
        foundItems.add(item.value);
      }
    }
    expect(foundItems).toEqual(smallItems);
  });

  it("can get multiple pages using for..of when the set is large", async () => {
    expect.assertions(3);

    const response = await client.query<Page<MyDoc>>(fql`IterTestBig.all()`);
    const page = response.data;
    const setIterator = client.paginate(page);

    const foundItems = new Set<number>();
    for await (const page of setIterator) {
      expect(page.length).toBeGreaterThan(0);
      for (let item of page) {
        foundItems.add(item.value);
      }
    }
    expect(foundItems).toEqual(bigItems);
  });

  it("can get pages using next()", async () => {
    expect.assertions(4);

    const response = await client.query<Page<MyDoc>>(fql`IterTestBig.all()`);
    const page = response.data;
    const setIterator = client.paginate(page);

    const foundItems = new Set<number>();

    const result1 = await setIterator.next();
    if (!result1.done) {
      expect(result1.value.length).toBe(16);
      for (const i of result1.value) {
        foundItems.add(i.value);
      }
    }

    const result2 = await setIterator.next();
    if (!result2.done) {
      expect(result2.value.length).toBe(4);
      for (const i of result2.value) {
        foundItems.add(i.value);
      }
    }

    const result3 = await setIterator.next();
    expect(result3.done).toBe(true);
    expect(foundItems).toEqual(bigItems);
  });

  it("can get pages using a loop with next()", async () => {
    expect.assertions(2);
    const response = await client.query<Page<MyDoc>>(fql`IterTestBig.all()`);
    const page = response.data;
    const setIterator = client.paginate(page);

    let done = false;
    while (!done) {
      const next = await setIterator.next();
      done = next.done ?? false;

      if (!next.done) {
        const page = next.value;
        expect(page.length).toBeGreaterThan(0);
      }
    }
  });

  it("can can stop the iterator with the return method", async () => {
    expect.assertions(1);

    const response = await client.query<Page<MyDoc>>(fql`IterTestBig.all()`);
    const page = response.data;
    const setIterator = client.paginate(page);

    for await (const page of setIterator) {
      expect(page.length).toBe(16);
      await setIterator.return();
    }
  });

  it("can can stop the iterator with the throw method", async () => {
    expect.assertions(2);

    const response = await client.query<Page<MyDoc>>(fql`IterTestBig.all()`);
    const page = response.data;
    const setIterator = client.paginate(page);

    try {
      for await (const page of setIterator) {
        expect(page.length).toBe(16);
        await setIterator.throw("oops");
      }
    } catch (e) {
      expect(e).toBe("oops");
    }
  });

  it("can paginate a query that returns a set", async () => {
    expect.assertions(2);

    const setIterator = client.paginate<MyDoc>(fql`IterTestBig.all()`);

    for await (const page of setIterator) {
      expect(page.length).toBeGreaterThan(0);
    }
  });

  it("can paginate a query that does NOT return a set", async () => {
    expect.assertions(1);

    const setIterator = client.paginate<number>(fql`42`);

    for await (const page of setIterator) {
      expect(page).toStrictEqual([42]);
    }
  });

  it("can be flattened", async () => {
    expect.assertions(21);

    const setIterator = client.paginate<MyDoc>(fql`IterTestBig.all()`);

    const foundItems = new Set<number>();
    for await (const item of setIterator.flatten()) {
      expect(item.id).toBeDefined();
      foundItems.add(item.value);
    }
    expect(foundItems).toEqual(bigItems);
  });

  it("each page respects QueryOptions using an existing Page", async () => {
    expect.assertions(3);

    const httpClient: HTTPClient = {
      async request(req) {
        expect(req.headers["x-query-timeout-ms"]).toBe("12345");

        return getDefaultHTTPClient(getDefaultHTTPClientOptions()).request(req);
      },
      close() {
        return;
      },
    };
    const testClient = getClient({}, httpClient);

    const response = await testClient.query<Page<MyDoc>>(
      fql`IterTestBig.all()`,
      {
        query_timeout_ms: 12345,
      }
    );
    const page = response.data;
    const setIterator = testClient.paginate(page, {
      query_timeout_ms: 12345,
    });

    const foundItems = new Set<number>();
    for await (const item of setIterator.flatten()) {
      foundItems.add(item.value);
    }
    expect(foundItems).toEqual(bigItems);

    testClient.close();
  });

  it("each page respects QueryOptions using an a query", async () => {
    expect.assertions(3);

    const httpClient: HTTPClient = {
      async request(req) {
        expect(req.headers["x-query-timeout-ms"]).toBe("12345");

        return getDefaultHTTPClient(getDefaultHTTPClientOptions()).request(req);
      },
      close() {
        return;
      },
    };
    const testClient = getClient({}, httpClient);

    const setIterator = testClient.paginate<MyDoc>(fql`IterTestBig.all()`, {
      query_timeout_ms: 12345,
    });

    const foundItems = new Set<number>();
    for await (const item of setIterator.flatten()) {
      foundItems.add(item.value);
    }
    expect(foundItems).toEqual(bigItems);

    testClient.close();
  });
});
