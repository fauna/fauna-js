import {
  fql,
  getDefaultHTTPClient,
  StreamClient,
  StreamClientConfiguration,
  StreamToken,
  Client,
  DocumentT,
  ServiceError,
  TimeStub,
  DateStub,
  Document,
} from "../../src";
import {
  getClient,
  getDefaultHTTPClientOptions,
  getDefaultSecretAndEndpoint,
} from "../client";

const defaultHttpClient = getDefaultHTTPClient(getDefaultHTTPClientOptions());
const { secret } = getDefaultSecretAndEndpoint();
const dummyStreamToken = new StreamToken("dummy");

let client: Client;
const STREAM_DB_NAME = "StreamTestDB";
const STREAM_SECRET = `${secret}:${STREAM_DB_NAME}:admin`;
const defaultStreamConfig: StreamClientConfiguration = {
  secret: STREAM_SECRET,
  long_type: "number",
  max_attempts: 3,
  max_backoff: 20,
  httpStreamClient: defaultHttpClient,
};

type StreamTest = { value: number };

beforeAll(async () => {
  const rootClient = getClient();

  // create a child database to use for Streams, since streaming FF will not
  // work on the root database
  await rootClient.query(fql`
    if (Database.byName(${STREAM_DB_NAME}) == null) {
      Database.create({ name: ${STREAM_DB_NAME} })
    }
  `);

  // scope the client to the child db
  client = getClient({ secret: STREAM_SECRET });

  await client.query(fql`
    if (Collection.byName("StreamTest") != null) {
      Collection.byName("StreamTest")!.delete()
    }
    `);
  await client.query(fql`
    Collection.create({ name: "StreamTest" })
    `);
});

afterAll(() => {
  if (client) {
    client.close();
  }
});

describe("Client", () => {
  it("can initiate a stream from a Client", async () => {
    expect.assertions(1);

    let stream: StreamClient | null = null;
    try {
      const response = await client.query<StreamToken>(
        fql`StreamTest.all().toStream()`
      );
      const token = response.data;

      stream = client.stream(token, { status_events: true });

      for await (const event of stream) {
        expect(event.type).toEqual("status");
        break;
      }
    } finally {
      stream?.close();
    }
  });

  it("can initiate a stream from a Client, providing a query", async () => {
    expect.assertions(1);

    let stream: StreamClient | null = null;
    try {
      stream = client.stream(fql`StreamTest.all().toStream()`, {
        status_events: true,
      });

      for await (const event of stream) {
        expect(event.type).toEqual("status");
        break;
      }
    } finally {
      stream?.close();
    }
  });
});

describe("StreamClient", () => {
  it("can initiate a stream", async () => {
    expect.assertions(1);

    let stream: StreamClient | null = null;
    try {
      const response = await client.query<StreamToken>(
        fql`StreamTest.all().toStream()`
      );
      const token = response.data;

      stream = new StreamClient(token, {
        ...defaultStreamConfig,
        status_events: true,
      });

      for await (const event of stream) {
        expect(event.type).toEqual("status");
        break;
      }
    } finally {
      stream?.close();
    }
  });

  it("can initiate a stream with a lambda", async () => {
    expect.assertions(1);

    let stream: StreamClient | null = null;
    try {
      const getToken = async () => {
        const response = await client.query<StreamToken>(
          fql`StreamTest.all().toStream()`
        );
        return response.data;
      };

      stream = new StreamClient(getToken, {
        ...defaultStreamConfig,
        status_events: true,
      });

      for await (const event of stream) {
        expect(event.type).toEqual("status");
        break;
      }
    } finally {
      stream?.close();
    }
  });

  it("can get events with async iterator", async () => {
    expect.assertions(2);

    let stream: StreamClient<DocumentT<StreamTest>> | null = null;
    try {
      const response = await client.query<StreamToken>(
        fql`StreamTest.all().toStream()`
      );
      const token = response.data;

      stream = new StreamClient(token, defaultStreamConfig);

      // create some events that will be played back
      await client.query(fql`StreamTest.create({ value: 0 })`);
      await client.query(fql`StreamTest.create({ value: 1 })`);

      let count = 0;
      for await (const event of stream) {
        if (event.type == "add") {
          if (count === 0) {
            expect(event.data.value).toEqual(0);
          } else {
            expect(event.data.value).toEqual(1);
            break;
          }
        }
        count++;
      }
    } finally {
      stream?.close();
    }
  });

  it("can get events with callbacks", async () => {
    expect.assertions(2);

    const response = await client.query<StreamToken>(
      fql`StreamTest.all().toStream()`
    );
    const token = response.data;

    const stream = new StreamClient<DocumentT<StreamTest>>(
      token,
      defaultStreamConfig
    );

    // create some events that will be played back
    await client.query(fql`StreamTest.create({ value: 0 })`);
    await client.query(fql`StreamTest.create({ value: 1 })`);

    let resolve: () => void;
    const promise = new Promise((res) => {
      resolve = () => res(null);
    });

    let count = 0;
    stream.start(function onEvent(event) {
      if (event.type == "add") {
        if (count === 0) {
          expect(event.data.value).toEqual(0);
        } else {
          expect(event.data.value).toEqual(1);
          stream.close();
          resolve();
        }
      }
      count++;
    });

    await promise;
  });

  it("catches non 200 responses when establishing a stream", async () => {
    expect.assertions(1);

    try {
      // create a stream with a bad token
      const stream = new StreamClient(
        new StreamToken("2"),
        defaultStreamConfig
      );

      for await (const _ of stream) {
        /* do nothing */
      }
    } catch (e) {
      // TODO: be more specific about the error and split into multiple tests
      expect(e).toBeInstanceOf(ServiceError);
    }
  });

  it("handles non 200 responses via callback when establishing a stream", async () => {
    expect.assertions(1);

    // create a stream with a bad token
    const stream = new StreamClient(new StreamToken("2"), defaultStreamConfig);

    let resolve: () => void;
    const promise = new Promise((res) => {
      resolve = () => res(null);
    });

    stream.start(
      function onEvent(_) {},
      function onError(e) {
        // TODO: be more specific about the error and split into multiple tests
        expect(e).toBeInstanceOf(ServiceError);
        resolve();
      }
    );

    await promise;
  });

  it("catches a ServiceError if an error event is received", async () => {
    expect.assertions(1);

    let stream: StreamClient<DocumentT<StreamTest>> | null = null;
    try {
      const response = await client.query<StreamToken>(
        fql`StreamTest.all().map((doc) => abort("oops")).toStream()`
      );
      const token = response.data;

      stream = new StreamClient(token, defaultStreamConfig);

      // create some events that will be played back
      await client.query(fql`StreamTest.create({ value: 0 })`);

      for await (const _ of stream) {
        /* do nothing */
      }
    } catch (e) {
      // TODO: be more specific about the error and split into multiple tests
      expect(e).toBeInstanceOf(ServiceError);
    } finally {
      stream?.close();
    }
  });

  it("handles a ServiceError via callback if an error event is received", async () => {
    expect.assertions(1);

    const response = await client.query<StreamToken>(
      fql`StreamTest.all().map((doc) => abort("oops")).toStream()`
    );
    const token = response.data;

    const stream = new StreamClient<DocumentT<StreamTest>>(
      token,
      defaultStreamConfig
    );

    // create some events that will be played back
    await client.query(fql`StreamTest.create({ value: 0 })`);

    let resolve: () => void;
    const promise = new Promise((res) => {
      resolve = () => res(null);
    });

    stream.start(
      function onEvent(_) {},
      function onError(e) {
        // TODO: be more specific about the error and split into multiple tests
        expect(e).toBeInstanceOf(ServiceError);
        resolve();
      }
    );

    await promise;
  });

  it("decodes values from streams correctly", async () => {
    expect.assertions(5);

    let stream: StreamClient | null = null;
    let stream2: StreamClient | null = null;
    try {
      const response = await client.query<StreamToken>(
        fql`StreamTest.all().map((doc) => {
          time: Time.now(),
          date: Date.today(),
          doc: doc,
          bigInt: 922337036854775808,
        }).toStream()`
      );
      const token = response.data;

      stream = new StreamClient(token, defaultStreamConfig);

      // create some events that will be played back
      await client.query(fql`StreamTest.create({ value: 0 })`);

      for await (const event of stream) {
        if (event.type == "add") {
          const data = event.data;
          expect(data.time).toBeInstanceOf(TimeStub);
          expect(data.date).toBeInstanceOf(DateStub);
          expect(data.doc).toBeInstanceOf(Document);
          expect(typeof data.bigInt).toBe("number");
        }
        break;
      }

      stream2 = new StreamClient(token, {
        ...defaultStreamConfig,
        long_type: "bigint",
      });

      for await (const event of stream2) {
        if (event.type == "add") {
          const data = event.data;
          expect(typeof data.bigInt).toBe("bigint");
        }
        break;
      }
    } finally {
      stream?.close();
      stream2?.close();
    }
  });
});
