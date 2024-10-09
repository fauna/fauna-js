import {
  Client,
  ChangeFeedClient,
  ChangeFeedClientConfiguration,
  StreamToken,
  fql,
  getDefaultHTTPClient,
  ChangeFeedSuccess,
  ClientError,
  AbortError,
  ChangeFeedPage,
} from "../../src";
import {
  getClient,
  getDefaultHTTPClientOptions,
  getDefaultSecretAndEndpoint,
} from "../client";

const defaultHttpClient = getDefaultHTTPClient(getDefaultHTTPClientOptions());
const { secret } = getDefaultSecretAndEndpoint();

let client: Client;
const TEST_DB_NAME = "ChangeFeedTestDB";
const TEST_SECRET = `${secret}:${TEST_DB_NAME}:admin`;
const defaultChangeFeedConfig: ChangeFeedClientConfiguration = {
  secret: TEST_SECRET,
  long_type: "number",
  max_attempts: 3,
  max_backoff: 20,
  httpClient: defaultHttpClient,
  query_timeout_ms: 5000,
};

type ChangeFeedTest = { value: number };

const fromAsync = async <T>(iterator: AsyncIterable<T>): Promise<T[]> => {
  const res: T[] = [];
  for await (const item of iterator) {
    res.push(item);
  }
  return res;
};

beforeAll(async () => {
  const rootClient = getClient();

  await rootClient.query(fql`
    if (Database.byName(${TEST_DB_NAME}) == null) {
      Database.create({ name: ${TEST_DB_NAME} })
    }
  `);

  client = getClient({ secret: TEST_SECRET });

  await client.query(fql`
    if (Collection.byName("ChangeFeedTest") != null) {
      Collection.byName("ChangeFeedTest")!.delete()
    }
  `);

  await client.query(fql`
    Collection.create({ name: "ChangeFeedTest" });
  `);
});

afterAll(() => {
  if (client) {
    client.close();
  }
});

afterEach(async () => {
  await client.query(fql`
    ChangeFeedTest.all().forEach(d => d.delete());
  `);
});

describe("Client", () => {
  it("should throw a ClientError if not using a stream token", async () => {
    await expect(async () => {
      const res: ChangeFeedPage<ChangeFeedTest>[] = [];
      for await (const page of client.changeFeed<ChangeFeedTest>(fql`1+1`)) {
        res.push(page);
      }
    }).rejects.toThrow(ClientError);
  });

  it("should return a iterable change feed from a stream token", async () => {
    const token = await client.query(fql`ChangeFeedTest.all().toStream()`);
    const changeFeed = client.changeFeed<ChangeFeedTest>(token.data);

    await client.query(
      fql`Set.sequence(0, 3).forEach(v => ChangeFeedTest.create({ value: v + 1}));`,
    );
    const pages = await fromAsync(changeFeed);

    expect(pages).toHaveLength(1);

    const events = Array.from(pages[0].events);
    expect(events).toHaveLength(3);
    expect(events[0].type).toEqual("add");
    expect(events[0].data.value).toEqual(1);
  });

  it("should return an iterable change feed with a lambda", async () => {
    const changeFeed = client.changeFeed<ChangeFeedTest>(
      fql`ChangeFeedTest.all().toStream()`,
    );

    await client.query(fql`ChangeFeedTest.create({ value: 1})`);

    const pages = await fromAsync(changeFeed);

    // Lambdas are evaluated lazily, so we should get an one page of empty events unless using start_ts
    expect(pages).toHaveLength(1);
    expect(Array.from(pages[0].events)).toHaveLength(0);
  });

  it("should pass configuration to the change feed client", async () => {
    // First document, which we don't want to include in the change feed
    const startAt = (
      await client.query(fql`ChangeFeedTest.create({ value: 1})`)
    ).txn_ts;
    // Second batch of documents we do want to include in the change feed
    await client.query(
      fql`Set.sequence(0, 3).forEach(v => ChangeFeedTest.create({ value: v + 1}));`,
    );

    const pages = await fromAsync(
      client.changeFeed<ChangeFeedTest>(fql`ChangeFeedTest.all().toStream()`, {
        page_size: 1,
        start_ts: startAt,
      }),
    );

    // Page size of 1 means we should get 3 pages of 1 event.
    expect(pages).toHaveLength(3);
    expect(Array.from(pages[0].events)).toHaveLength(1);
  });
});

describe("ChangeFeedClient", () => {
  it("can be instantiated directly with a token and client configuration", async () => {
    const startAt = (
      await client.query(fql`ChangeFeedTest.create({ value: 1})`)
    ).txn_ts;
    await client.query(
      fql`Set.sequence(0, 3).forEach(v => ChangeFeedTest.create({ value: v + 1}));`,
    );

    const token = await client.query<StreamToken>(
      fql`ChangeFeedTest.all().toStream()`,
    );
    const changeFeed = new ChangeFeedClient(token.data, {
      ...defaultChangeFeedConfig,
      start_ts: startAt,
      page_size: 1,
    });
    const pages = await fromAsync(changeFeed);

    expect(pages).toHaveLength(3);

    const events = Array.from(pages[0].events);
    expect(events).toHaveLength(1);
    expect(events[0].data.value).toEqual(1);
  });

  it("can pass an existing cursor", async () => {
    const token = await client.query<StreamToken>(
      fql`ChangeFeedTest.all().toStream()`,
    );
    const changeFeed = new ChangeFeedClient<ChangeFeedTest>(token.data, {
      ...defaultChangeFeedConfig,
      page_size: 1,
    });

    await client.query(
      fql`Set.sequence(0, 3).forEach(v => ChangeFeedTest.create({ value: v + 1}));`,
    );

    const firstPage = await changeFeed[Symbol.asyncIterator]().next();

    const changeFeedWithCursor = new ChangeFeedClient<ChangeFeedTest>(
      token.data,
      { ...defaultChangeFeedConfig, cursor: firstPage.value.cursor },
    );
    const pages = await fromAsync(changeFeedWithCursor);

    expect(pages).toHaveLength(1);

    const events = Array.from(pages[0].events);
    expect(events).toHaveLength(2);
  });

  it("throws an error on an error event within a page of events", async () => {
    const token = await client.query(
      fql`ChangeFeedTest.all().map(_ => abort('oops')).toStream()`,
    );
    const changeFeed = new ChangeFeedClient(
      token.data,
      defaultChangeFeedConfig,
    );

    await client.query(fql`ChangeFeedTest.create({ value: 1})`);

    expect(fromAsync(changeFeed.flatten())).rejects.toThrow(AbortError);
  });

  it("can return a flattened array of events", async () => {
    const token = await client.query(fql`ChangeFeedTest.all().toStream()`);
    const changeFeed = new ChangeFeedClient(
      token.data,
      defaultChangeFeedConfig,
    );

    await client.query(
      fql`Set.sequence(0, 3).forEach(v => ChangeFeedTest.create({ value: v + 1}));`,
    );

    const events = await fromAsync(changeFeed.flatten());

    expect(events).toHaveLength(3);
  });
});
