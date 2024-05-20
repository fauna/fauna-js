import fetchMock, { enableFetchMocks } from "jest-fetch-mock";
enableFetchMocks();

import {
  AuthorizationError,
  FetchClient,
  fql,
  QueryTimeoutError,
  ServiceError,
  ServiceInternalError,
  ThrottlingError,
} from "../../src";
import { getClient, getDefaultHTTPClientOptions } from "../client";

afterAll(() => {
  client.close();
});

const client = getClient(
  {
    query_timeout_ms: 60,
  },
  // use the FetchClient implementation, so we can mock requests
  new FetchClient(getDefaultHTTPClientOptions()),
);

describe("query", () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  // Error handling uses the code field to determine the error type. These codes must match the actual code expected from the API.
  it.each`
    httpStatus | expectedErrorType       | expectedErrorFields
    ${403}     | ${AuthorizationError}   | ${{ code: "forbidden", message: "nope" }}
    ${440}     | ${QueryTimeoutError}    | ${{ code: "time_out", message: "too slow - increase your timeout" }}
    ${999}     | ${ServiceError}         | ${{ code: "error_not_yet_subclassed_in_client", message: "who knows!!!" }}
    ${429}     | ${ThrottlingError}      | ${{ code: "limit_exceeded", message: "too much" }}
    ${500}     | ${ServiceInternalError} | ${{ code: "internal_error", message: "unexpected error" }}
    ${503}     | ${QueryTimeoutError}    | ${{ code: "time_out", message: "too slow on our side" }}
  `(
    "throws an $expectedErrorType on a $httpStatus",
    async ({ httpStatus, expectedErrorType, expectedErrorFields }) => {
      expect.assertions(4);
      fetchMock.mockResponse(JSON.stringify({ error: expectedErrorFields }), {
        status: httpStatus,
      });
      try {
        await client.query(fql`'foo'.length`);
      } catch (e) {
        if (e instanceof ServiceError) {
          expect(e).toBeInstanceOf(expectedErrorType);
          expect(e.message).toEqual(expectedErrorFields.message);
          expect(e.httpStatus).toEqual(httpStatus);
          expect(e.code).toEqual(expectedErrorFields.code);
        }
      }
    },
  );

  // Error handling uses the code field to determine the error type. These codes must match the actual code expected from the API.
  it.each`
    httpStatus | expectedErrorType       | expectedErrorFields
    ${403}     | ${AuthorizationError}   | ${{ code: "forbidden", message: "nope" }}
    ${440}     | ${QueryTimeoutError}    | ${{ code: "time_out", message: "too slow - increase your timeout" }}
    ${999}     | ${ServiceError}         | ${{ code: "error_not_yet_subclassed_in_client", message: "who knows!!!" }}
    ${429}     | ${ThrottlingError}      | ${{ code: "limit_exceeded", message: "too much" }}
    ${500}     | ${ServiceInternalError} | ${{ code: "internal_error", message: "unexpected error" }}
    ${503}     | ${QueryTimeoutError}    | ${{ code: "time_out", message: "too slow on our side" }}
  `(
    "Includes a summary when not present in error field but present at top-level",
    async ({ httpStatus, expectedErrorType, expectedErrorFields }) => {
      expect.assertions(5);
      fetchMock.mockResponse(
        JSON.stringify({
          error: expectedErrorFields,
          summary: "the summary",
        }),
        {
          status: httpStatus,
        },
      );

      try {
        await client.query(fql`'foo'.length`);
      } catch (e) {
        if (e instanceof ServiceError) {
          expect(e).toBeInstanceOf(expectedErrorType);
          expect(e.message).toEqual(expectedErrorFields.message);
          expect(e.httpStatus).toEqual(httpStatus);
          expect(e.code).toEqual(expectedErrorFields.code);
          expect(e.queryInfo?.summary).toEqual("the summary");
        }
      }
    },
  );

  it("retries throttling errors and then succeeds", async () => {
    const throttlingResponse = JSON.stringify({
      error: { code: "limit_exceeded", message: "too much" },
      summary: "the summary",
    });

    fetchMock.mockResponses(
      [throttlingResponse, { status: 429 }],
      [throttlingResponse, { status: 429 }],
      [
        JSON.stringify({ data: 3, summary: "the summary", stats: {} }),
        { status: 200 },
      ],
    );
    const actual = await client.query(fql`'foo'.length`);
    expect(actual.data).toEqual(3);
    expect(actual.stats?.attempts).toEqual(3);
  });

  it("Includes a summary in a QueryResult when present at top-level", async () => {
    // axios mock adapater currently has a bug that cannot match
    // routes on clients using a baseURL. As such we use onAny() in these tests.
    fetchMock.mockResponse(JSON.stringify({ data: 3, summary: "the summary" }));
    const actual = await client.query(fql`'foo'.length`);
    expect(actual.data).toEqual(3);
    expect(actual.summary).toEqual("the summary");
  });

  // it("throws an NetworkError on a timeout", async () => {
  //   expect.assertions(2);
  //   // axios mock adapater currently has a bug that cannot match
  //   // routes on clients using a baseURL. As such we use onAny() in these tests.
  //   mockAxios.onAny().timeout();

  //   try {
  //     await client.query(fql`'foo'.length`);
  //   } catch (e) {
  //     if (e instanceof NetworkError) {
  //       expect(e.message).toEqual(
  //         "The network connection encountered a problem."
  //       );
  //       // @ts-ignore
  //       expect(e.cause).toBeDefined();
  //     }
  //   }
  // });

  // it("throws an NetworkError on an axios network error", async () => {
  //   expect.assertions(2);
  //   // axios mock adapater currently has a bug that cannot match
  //   // routes on clients using a baseURL. As such we use onAny() in these tests.
  //   mockAxios.onAny().networkError();
  //   try {
  //     await client.query(fql`'foo'.length`);
  //   } catch (e) {
  //     if (e instanceof NetworkError) {
  //       expect(e.message).toEqual(
  //         "The network connection encountered a problem."
  //       );
  //       // @ts-ignore
  //       expect(e.cause).toBeDefined();
  //     }
  //   }
  // });

  // it.each`
  //   errorCode
  //   ${"ECONNABORTED"}
  //   ${"ECONNREFUSED"}
  //   ${"ECONNRESET"}
  //   ${"ERR_NETWORK"}
  //   ${"ETIMEDOUT"}
  //   ${"ERR_HTTP_REQUEST_TIMEOUT"}
  //   ${"ERR_HTTP2_GOAWAY_SESSION"}
  //   ${"ERR_HTTP2_INVALID_SESSION"}
  //   ${"ERR_HTTP2_INVALID_STREAM"}
  //   ${"ERR_HTTP2_OUT_OF_STREAMS"}
  //   ${"ERR_HTTP2_SESSION_ERROR"}
  //   ${"ERR_HTTP2_STREAM_CANCEL"}
  //   ${"ERR_HTTP2_STREAM_ERROR"}
  // `(
  //   "throws an NetworkError on error code $errorCode",
  //   async ({ errorCode }) => {
  //     expect.assertions(2);
  //     client.client.post = jest.fn((_) => {
  //       throw { code: errorCode };
  //     });
  //     try {
  //       await client.query(fql`'foo'.length`);
  //     } catch (e) {
  //       if (e instanceof NetworkError) {
  //         expect(e.message).toEqual(
  //           "The network connection encountered a problem."
  //         );
  //         // @ts-ignore
  //         expect(e.cause).toBeDefined();
  //       }
  //     }
  //   }
  // );

  // it("throws an NetworkError if request never sent", async () => {
  //   expect.assertions(2);
  //   // @ts-ignore
  //   client.client.post = jest.fn((_) => {
  //     throw { request: { status: 0 } };
  //   });
  //   try {
  //     await client.query(fql`'foo'.length`);
  //   } catch (e) {
  //     if (e instanceof NetworkError) {
  //       expect(e.message).toEqual(
  //         "The network connection encountered a problem."
  //       );
  //       // @ts-ignore
  //       expect(e.cause).toBeDefined();
  //     }
  //   }
  // });
});
