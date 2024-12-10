import {
  FeedClient,
  FeedClientConfiguration,
  QueryRuntimeError,
  EventSource,
  StreamToken,
  ThrottlingError,
  HTTPClient,
  HTTPRequest,
  HTTPResponse,
} from "../../src";
import { defaultLogHandler } from "../../src/util/logging";

const mockHttpResponse = {
  status: 200,
  body: JSON.stringify({
    events: [],
    cursor: "cursor=",
    has_next: false,
    stats: {
      test: "test",
    },
  }),
  headers: {
    ":status": 200,
    "content-type": "application/json;charset=utf-8",
  },
};
const mockHttpClient = {
  request: jest
    .fn()
    .mockImplementation(() => Promise.resolve({ ...mockHttpResponse })),
  close: jest.fn(),
  getURL: jest.fn(() => "bar"),
};

const defaultConfig: FeedClientConfiguration = {
  secret: "secret",
  long_type: "number",
  max_attempts: 3,
  max_backoff: 20,
  query_timeout_ms: 5000,
  client_timeout_buffer_ms: 5000,
  logger: defaultLogHandler(),
  httpClient: mockHttpClient,
};
const testEventSource: EventSource = new StreamToken("dummy");

const fromAsync = async <T>(iterator: AsyncIterable<T>): Promise<T[]> => {
  const res: T[] = [];
  for await (const item of iterator) {
    res.push(item);
  }
  return res;
};

describe("FeedClient", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns a valid page of events", async () => {
    mockHttpClient.request.mockImplementationOnce(() =>
      Promise.resolve({
        ...mockHttpResponse,
        body: JSON.stringify({
          cursor: "gsGCGmcGl+0aJPRzAAA=",
          has_next: true,
          events: [
            {
              type: "add",
              data: {
                "@doc": {
                  id: "411279302456246784",
                  coll: { "@mod": "FeedTest" },
                  ts: { "@time": "2024-10-09T14:49:17.620Z" },
                  value: { "@int": "1" },
                },
              },
              txn_ts: 1728485357620000,
              cursor: "gsGCGmcGl+0aJPRzAAA=",
              stats: {
                read_ops: 1,
                storage_bytes_read: 66,
                compute_ops: 1,
                processing_time_ms: 0,
                rate_limits_hit: [],
              },
            },
          ],
        }),
      }),
    );

    const feed = new FeedClient(testEventSource, defaultConfig);
    const firstPage = await feed.nextPage();

    expect(firstPage.cursor).toBe("gsGCGmcGl+0aJPRzAAA=");
    expect(firstPage.hasNext).toBe(true);

    const events = Array.from(firstPage.events);
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("add");
    expect(events[0].data).toEqual(expect.any(Object));

    const secondPage = await feed.nextPage();

    expect(secondPage.cursor).toBe("cursor=");
    expect(secondPage.hasNext).toBe(false);
    expect(Array.from(secondPage.events)).toHaveLength(0);
  });

  it("uses a valid HTTPRequest", async () => {
    const feed = new FeedClient(testEventSource, defaultConfig);
    await fromAsync(feed);

    expect(mockHttpClient.request).toHaveBeenCalledWith(
      expect.objectContaining({
        client_timeout_ms: 10000,
        headers: expect.objectContaining({
          Authorization: "Bearer secret",
          "x-format": "tagged",
          "x-driver-env": expect.any(String),
          "x-query-timeout-ms": "5000",
        }),
        data: {
          token: "dummy",
        },
      }),
    );
  });

  it("uses page_size when set", async () => {
    const feed = new FeedClient(testEventSource, {
      ...defaultConfig,
      page_size: 10,
    });
    await fromAsync(feed.flatten());

    expect(mockHttpClient.request).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          token: "dummy",
          page_size: 10,
        },
      }),
    );
  });

  it("uses cursor when set", async () => {
    const feed = new FeedClient(testEventSource, {
      ...defaultConfig,
      cursor: "some-cursor=",
    });
    await fromAsync(feed.flatten());

    expect(mockHttpClient.request).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          token: "dummy",
          cursor: "some-cursor=",
        },
      }),
    );
  });

  it("uses start_ts when set", async () => {
    const startTs = Date.now();
    const feed = new FeedClient(testEventSource, {
      ...defaultConfig,
      start_ts: startTs,
    });

    await fromAsync(feed.flatten());

    expect(mockHttpClient.request).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          token: "dummy",
          start_ts: startTs,
        },
      }),
    );
  });

  it("retries throttling errors", async () => {
    mockHttpClient.request.mockImplementationOnce(() =>
      Promise.reject(
        new ThrottlingError({
          error: {
            code: "throttled",
            message: "test",
          },
        }),
      ),
    );

    const feed = new FeedClient(testEventSource, defaultConfig);
    await fromAsync(feed.flatten());

    expect(mockHttpClient.request).toHaveBeenCalledTimes(2);
  });

  it("throws an error for an error response", () => {
    mockHttpClient.request.mockImplementationOnce(() =>
      Promise.resolve({
        ...mockHttpResponse,
        status: 400,
        body: JSON.stringify({
          error: { code: "test", message: "test" },
        }),
      }),
    );

    const feed = new FeedClient(testEventSource, defaultConfig);
    expect(fromAsync(feed.flatten())).rejects.toThrow(QueryRuntimeError);
  });
});
