import {
  StreamClient,
  StreamToken,
  getDefaultHTTPClient,
  StreamClientConfiguration,
  ConsoleLogHandler,
} from "../../src";
import { getDefaultHTTPClientOptions } from "../client";
import { defaultLogHandler } from "../../src/util/logging";

const defaultHttpClient = getDefaultHTTPClient(getDefaultHTTPClientOptions());
const defaultConfig: StreamClientConfiguration = {
  secret: "secret",
  long_type: "number",
  max_attempts: 3,
  max_backoff: 20,
  logger: defaultLogHandler(),
  httpStreamClient: defaultHttpClient,
};
const dummyStreamToken = new StreamToken("dummy");

describe("StreamClientConfiguration", () => {
  it("can be instantiated directly with a token", () => {
    new StreamClient(dummyStreamToken, defaultConfig);
  });

  it("can be instantiated directly with a lambda", async () => {
    new StreamClient(() => Promise.resolve(dummyStreamToken), defaultConfig);
  });

  it.each`
    fieldName
    ${"long_type"}
    ${"httpStreamClient"}
    ${"max_backoff"}
    ${"max_attempts"}
    ${"secret"}
  `(
    "throws a TypeError if $fieldName provided is undefined",
    async ({ fieldName }: { fieldName: keyof StreamClientConfiguration }) => {
      expect.assertions(1);

      const config = { ...defaultConfig };
      delete config[fieldName];
      try {
        new StreamClient(dummyStreamToken, config);
      } catch (e: any) {
        expect(e).toBeInstanceOf(TypeError);
      }
    },
  );

  it("throws a RangeError if 'max_backoff' is less than or equal to zero", async () => {
    expect.assertions(1);

    const config = { ...defaultConfig, max_backoff: 0 };
    try {
      new StreamClient(dummyStreamToken, config);
    } catch (e: any) {
      expect(e).toBeInstanceOf(RangeError);
    }
  });

  it("throws a RangeError if 'max_attempts' is less than or equal to zero", async () => {
    expect.assertions(1);

    const config = { ...defaultConfig, max_attempts: 0 };
    try {
      new StreamClient(dummyStreamToken, config);
    } catch (e: any) {
      expect(e).toBeInstanceOf(RangeError);
    }
  });
});
