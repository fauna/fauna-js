import {
  ChangeFeedClient,
  ChangeFeedClientConfiguration,
  QueryRuntimeError,
  StreamToken,
  ThrottlingError,
} from "../../src";

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
};
const defaultConfig: ChangeFeedClientConfiguration = {
  secret: "secret",
  long_type: "number",
  max_attempts: 3,
  max_backoff: 20,
  query_timeout_ms: 5000,
  httpClient: mockHttpClient,
};
const dummyStreamToken = new StreamToken("dummy");

const fromAsync = async <T>(iterator: AsyncIterable<T>): Promise<T[]> => {
  const res: T[] = [];
  for await (const item of iterator) {
    res.push(item);
  }
  return res;
};

describe("ChangeFeedClient", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("can be instantiated directly with a token", () => {
    new ChangeFeedClient(dummyStreamToken, defaultConfig);
  });

  it("can be instantiated directly with a lambda", async () => {
    new ChangeFeedClient(
      () => Promise.resolve(dummyStreamToken),
      defaultConfig,
    );
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
                  coll: { "@mod": "ChangeFeedTest" },
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

    const changeFeed = new ChangeFeedClient(dummyStreamToken, defaultConfig);
    const firstPage = await changeFeed.nextPage();

    expect(firstPage.cursor).toBe("gsGCGmcGl+0aJPRzAAA=");
    expect(firstPage.hasNext).toBe(true);

    const events = Array.from(firstPage.events);
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("add");
    expect(events[0].data).toEqual(expect.any(Object));

    const secondPage = await changeFeed.nextPage();

    expect(secondPage.cursor).toBe("cursor=");
    expect(secondPage.hasNext).toBe(false);
    expect(Array.from(secondPage.events)).toHaveLength(0);
  });

  it("uses a valid HTTPRequest", async () => {
    const changeFeed = new ChangeFeedClient(dummyStreamToken, defaultConfig);
    await fromAsync(changeFeed);

    expect(mockHttpClient.request).toHaveBeenCalledWith(
      expect.objectContaining({
        client_timeout_ms: defaultConfig.query_timeout_ms,
        headers: expect.objectContaining({
          Authorization: "Bearer secret",
          "x-format": "tagged",
          "x-driver-env": expect.any(String),
        }),
        data: {
          token: "dummy",
        },
      }),
    );
  });

  it("uses page_size when set", async () => {
    const changeFeed = new ChangeFeedClient(dummyStreamToken, {
      ...defaultConfig,
      page_size: 10,
    });
    await fromAsync(changeFeed.flatten());

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
    const changeFeed = new ChangeFeedClient(dummyStreamToken, {
      ...defaultConfig,
      cursor: "some-cursor=",
    });
    await fromAsync(changeFeed.flatten());

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
    const changeFeed = new ChangeFeedClient(dummyStreamToken, {
      ...defaultConfig,
      start_ts: startTs,
    });

    await fromAsync(changeFeed.flatten());

    expect(mockHttpClient.request).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          token: "dummy",
          start_ts: startTs,
        },
      }),
    );
  });

  it("does not use start_ts if cursor is set", async () => {
    const startTs = Date.now();
    const changeFeed = new ChangeFeedClient(dummyStreamToken, {
      ...defaultConfig,
      cursor: "cursor=",
      start_ts: startTs,
    });
    await fromAsync(changeFeed.flatten());

    expect(mockHttpClient.request).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          token: "dummy",
          cursor: "cursor=",
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

    const changeFeed = new ChangeFeedClient(dummyStreamToken, defaultConfig);
    await fromAsync(changeFeed.flatten());

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

    const changeFeed = new ChangeFeedClient(dummyStreamToken, defaultConfig);
    expect(fromAsync(changeFeed.flatten())).rejects.toThrow(QueryRuntimeError);
  });
});
