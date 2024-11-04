import {
  Client,
  FeedClient,
  FeedClientConfiguration,
  EventSource,
  fql,
  getDefaultHTTPClient,
  ClientError,
  AbortError,
  FeedPage,
  QueryTimeoutError,
  NetworkError,
} from "../../src";
import {
  getClient,
  getDefaultHTTPClientOptions,
  getDefaultSecretAndEndpoint,
} from "../client";

const defaultHttpClient = getDefaultHTTPClient(getDefaultHTTPClientOptions());
const { secret } = getDefaultSecretAndEndpoint();

let client: Client;
const TEST_DB_NAME = "FeedTestDB";
const TEST_SECRET = `${secret}:${TEST_DB_NAME}:admin`;
const defaultFeedConfig: FeedClientConfiguration = {
  secret: TEST_SECRET,
  long_type: "number",
  max_attempts: 3,
  max_backoff: 20,
  httpClient: defaultHttpClient,
  client_timeout_buffer_ms: 5000,
  query_timeout_ms: 5000,
};

type FeedTest = { value: number };

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
    if (Collection.byName("FeedTest") != null) {
      Collection.byName("FeedTest")!.delete()
    }
  `);

  await client.query(fql`
    Collection.create({ name: "FeedTest" });
  `);
});

afterAll(() => {
  if (client) {
    client.close();
  }
});

afterEach(async () => {
  await client.query(fql`
    FeedTest.all().forEach(d => d.delete());
  `);
});

describe("Client", () => {
  it("should throw a ClientError if not using a stream token", async () => {
    await expect(async () => {
      const res: FeedPage<FeedTest>[] = [];
      for await (const page of client.feed<FeedTest>(fql`1+1`)) {
        res.push(page);
      }
    }).rejects.toThrow(ClientError);
  });

  it("should return a iterable feed from a stream token", async () => {
    const token = await client.query(fql`FeedTest.all().eventSource()`);
    const Feed = client.feed<FeedTest>(token.data);

    await client.query(
      fql`Set.sequence(0, 3).forEach(v => FeedTest.create({ value: v + 1}));`,
    );
    const pages = await fromAsync(Feed);

    expect(pages).toHaveLength(1);

    const events = Array.from(pages[0].events);
    expect(events).toHaveLength(3);
    expect(events[0].type).toEqual("add");
    expect(events[0].data.value).toEqual(1);
  });

  it("should return an iterable feed with a lambda", async () => {
    const Feed = client.feed<FeedTest>(fql`FeedTest.all().eventSource()`);

    await client.query(fql`FeedTest.create({ value: 1})`);

    const pages = await fromAsync(Feed);

    // Lambdas are evaluated lazily, so we should get an one page of empty events unless using start_ts
    expect(pages).toHaveLength(1);
    expect(Array.from(pages[0].events)).toHaveLength(0);
  });

  it("should pass configuration to the feed client", async () => {
    // First document, which we don't want to include in the feed
    const startAt = (await client.query(fql`FeedTest.create({ value: 1})`))
      .txn_ts;
    // Second batch of documents we do want to include in the feed
    await client.query(
      fql`Set.sequence(0, 3).forEach(v => FeedTest.create({ value: v + 1}));`,
    );

    const pages = await fromAsync(
      client.feed<FeedTest>(fql`FeedTest.all().eventSource()`, {
        page_size: 1,
        start_ts: startAt,
      }),
    );

    // Page size of 1 means we should get 3 pages of 1 event.
    expect(pages).toHaveLength(3);
    expect(Array.from(pages[0].events)).toHaveLength(1);
  });

  it("can resume from a cursor using a query", async () => {
    // Query fragment to reuse in the feed
    const query = fql<EventSource>`FeedTest.all().eventSource()`;

    // First document, which we don't want to include in the feed, but we'll
    // use its transaction timestamp to resume from after we create our test
    // documents.
    const startAt = (await client.query(fql`FeedTest.create({ value: 1})`))
      .txn_ts;

    // Create a second batch of documents to include in the feed
    await client.query(
      fql`Set.sequence(0, 3).forEach(v => FeedTest.create({ value: v + 1}));`,
    );

    // Create a feed that will resume from the transaction timestamp of the
    // first document we created above.
    const feed = client.feed(query, {
      ...defaultFeedConfig,
      page_size: 1,
      start_ts: startAt,
    });

    // Get the first page of events from the feed
    const firstPage = await feed[Symbol.asyncIterator]().next();

    // Create a second feed that will resume from the cursor of the first page
    const feedWithCursor = client.feed(query, {
      ...defaultFeedConfig,
      cursor: firstPage.value.cursor,
    });

    // Get the second page of events from the feed
    const pages = await fromAsync(feedWithCursor);

    // We should get a single page with 2 events in it
    expect(pages).toHaveLength(1);
    expect(Array.from(pages[0].events)).toHaveLength(2);
  });
});

describe("FeedClient", () => {
  it("can be instantiated directly with a token and client configuration", async () => {
    const startAt = (await client.query(fql`FeedTest.create({ value: 1})`))
      .txn_ts;
    await client.query(
      fql`Set.sequence(0, 3).forEach(v => FeedTest.create({ value: v + 1}));`,
    );

    const token = await client.query<EventSource>(
      fql`FeedTest.all().eventSource()`,
    );
    const Feed = new FeedClient(token.data, {
      ...defaultFeedConfig,
      start_ts: startAt,
      page_size: 1,
    });
    const pages = await fromAsync(Feed);

    expect(pages).toHaveLength(3);

    const events = Array.from(pages[0].events);
    expect(events).toHaveLength(1);
    expect(events[0].data.value).toEqual(1);
  });

  it("can pass an existing cursor", async () => {
    const token = await client.query<EventSource>(
      fql`FeedTest.all().eventSource()`,
    );
    const Feed = new FeedClient<FeedTest>(token.data, {
      ...defaultFeedConfig,
      page_size: 1,
    });

    await client.query(
      fql`Set.sequence(0, 3).forEach(v => FeedTest.create({ value: v + 1}));`,
    );

    const firstPage = await Feed[Symbol.asyncIterator]().next();

    const FeedWithCursor = new FeedClient<FeedTest>(token.data, {
      ...defaultFeedConfig,
      cursor: firstPage.value.cursor,
    });
    const pages = await fromAsync(FeedWithCursor);

    expect(pages).toHaveLength(1);

    const events = Array.from(pages[0].events);
    expect(events).toHaveLength(2);
  });

  it("throws an error on an error event within a page of events", async () => {
    const token = await client.query(
      fql`FeedTest.all().map(_ => abort('oops')).eventSource()`,
    );
    const Feed = new FeedClient(token.data, defaultFeedConfig);

    await client.query(fql`FeedTest.create({ value: 1})`);

    expect(fromAsync(Feed.flatten())).rejects.toThrow(AbortError);
  });

  it("can return a flattened array of events", async () => {
    const token = await client.query(fql`FeedTest.all().eventSource()`);
    const Feed = new FeedClient(token.data, defaultFeedConfig);

    await client.query(
      fql`Set.sequence(0, 3).forEach(v => FeedTest.create({ value: v + 1}));`,
    );

    const events = await fromAsync(Feed.flatten());

    expect(events).toHaveLength(3);
  });

  it("throws a QueryTimeoutError if the query times out", async () => {
    const token = await client.query(fql`FeedTest.all().eventSource()`);
    const feed = new FeedClient(token.data, {
      ...defaultFeedConfig,
      query_timeout_ms: 1,
    });

    await expect(fromAsync(feed.flatten())).rejects.toThrow(QueryTimeoutError);
  });

  it("throws a NetworkError if the client times out", async () => {
    const token = await client.query(fql`FeedTest.all().eventSource()`);
    const feed = new FeedClient(token.data, {
      ...defaultFeedConfig,
      query_timeout_ms: 1,
      client_timeout_buffer_ms: 0,
    });

    await expect(fromAsync(feed.flatten())).rejects.toThrow(NetworkError);
  });
});
