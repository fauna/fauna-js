import {
  StreamToken,
  getDefaultHTTPClient,
  ChangeFeedClientConfiguration,
  ChangeFeedClient,
} from "../../src";
import { getDefaultHTTPClientOptions } from "../client";

const defaultHttpClient = getDefaultHTTPClient(getDefaultHTTPClientOptions());
const defaultConfig: ChangeFeedClientConfiguration = {
  secret: "secret",
  long_type: "number",
  max_attempts: 3,
  max_backoff: 20,
  query_timeout_ms: 5000,
  client_timeout_buffer_ms: 5000,
  httpClient: defaultHttpClient,
};
const dummyStreamToken = new StreamToken("dummy");

describe("ChangeFeedClientConfiguration", () => {
  it("can be instantiated directly with a token", () => {
    new ChangeFeedClient(dummyStreamToken, defaultConfig);
  });

  it("can be instantiated directly with a lambda", async () => {
    new ChangeFeedClient(
      () => Promise.resolve(dummyStreamToken),
      defaultConfig,
    );
  });

  it("throws a RangeError if 'max_backoff' is less than or equal to zero", async () => {
    expect.assertions(1);

    const config = { ...defaultConfig, max_backoff: 0 };
    try {
      new ChangeFeedClient(dummyStreamToken, config);
    } catch (e: any) {
      expect(e).toBeInstanceOf(RangeError);
    }
  });

  it.each`
    fieldName
    ${"long_type"}
    ${"httpClient"}
    ${"max_backoff"}
    ${"max_attempts"}
    ${"client_timeout_buffer_ms"}
    ${"query_timeout_ms"}
    ${"secret"}
  `(
    "throws a TypeError if $fieldName provided is undefined",
    async ({
      fieldName,
    }: {
      fieldName: keyof ChangeFeedClientConfiguration;
    }) => {
      expect.assertions(1);

      const config = { ...defaultConfig };
      delete config[fieldName];
      try {
        new ChangeFeedClient(dummyStreamToken, config);
      } catch (e: any) {
        expect(e).toBeInstanceOf(TypeError);
      }
    },
  );

  it("throws a RangeError if 'max_attempts' is less than or equal to zero", async () => {
    expect.assertions(1);

    const config = { ...defaultConfig, max_attempts: 0 };
    try {
      new ChangeFeedClient(dummyStreamToken, config);
    } catch (e: any) {
      expect(e).toBeInstanceOf(RangeError);
    }
  });

  it("throws a TypeError is start_ts and cursor are both provided", async () => {
    const config = { ...defaultConfig, start_ts: 1, cursor: "cursor" };
    expect(() => {
      new ChangeFeedClient(dummyStreamToken, config);
    }).toThrow(TypeError);
  });

  it("throws a RangeError if 'query_timeout_ms' is less than or equal to zero", async () => {
    const config = { ...defaultConfig, query_timeout_ms: 0 };
    try {
      new ChangeFeedClient(dummyStreamToken, config);
    } catch (e: any) {
      expect(e).toBeInstanceOf(RangeError);
    }
  });

  it("throws a RangeError if 'client_timeout_buffer_ms' is less than or equal to zero", async () => {
    const config = { ...defaultConfig, client_timeout_buffer_ms: 0 };
    try {
      new ChangeFeedClient(dummyStreamToken, config);
    } catch (e: any) {
      expect(e).toBeInstanceOf(RangeError);
    }
  });
});
