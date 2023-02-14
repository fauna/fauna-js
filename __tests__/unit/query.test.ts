import fetch from "jest-fetch-mock";
import { Client } from "../../src/client";
import {
  AuthorizationError,
  NetworkError,
  QueryTimeoutError,
  ServiceError,
  ServiceInternalError,
  ServiceTimeoutError,
  ThrottlingError,
} from "../../src/wire-protocol";

let client: Client = new Client({ secret: "secret" });

describe("query", () => {
  // do not treat these codes as canonical. Refer to documentation. These are simply for logical testing.
  it.each`
    httpStatus | expectedErrorType       | expectedErrorFields
    ${403}     | ${AuthorizationError}   | ${{ code: "no_permission", message: "nope" }}
    ${440}     | ${QueryTimeoutError}    | ${{ code: "query_timeout", message: "too slow - increase your timeout" }}
    ${999}     | ${ServiceError}         | ${{ code: "error_not_yet_subclassed_in_client", message: "who knows!!!" }}
    ${429}     | ${ThrottlingError}      | ${{ code: "throttle", message: "too much" }}
    ${500}     | ${ServiceInternalError} | ${{ code: "internal_error", message: "unexpected error" }}
    ${503}     | ${ServiceTimeoutError}  | ${{ code: "service_timeout", message: "too slow on our side" }}
  `(
    "throws an $expectedErrorType on a $httpStatus",
    async ({ httpStatus, expectedErrorType, expectedErrorFields }) => {
      expect.assertions(4);

      try {
        fetch.mockRejectOnce({
          // @ts-expect-error
          response: {
            data: {
              error: {
                message: expectedErrorFields.message,
                code: expectedErrorFields.code,
              },
            },
            status: httpStatus,
          },
        });

        await client.query({ query: "'foo'.length" });
      } catch (e) {
        if (e instanceof ServiceError) {
          expect(e).toBeInstanceOf(expectedErrorType);
          expect(e.message).toEqual(expectedErrorFields.message);
          expect(e.httpStatus).toEqual(httpStatus);
          expect(e.code).toEqual(expectedErrorFields.code);
        }
      }
    }
  );

  // do not treat these codes as canonical. Refer to documentation. These are simply for logical testing.
  it.each`
    httpStatus | expectedErrorType       | expectedErrorFields
    ${403}     | ${AuthorizationError}   | ${{ code: "no_permission", message: "nope", summary: "the summary" }}
    ${440}     | ${QueryTimeoutError}    | ${{ code: "query_timeout", message: "too slow - increase your timeout", summary: "the summary" }}
    ${999}     | ${ServiceError}         | ${{ code: "error_not_yet_subclassed_in_client", message: "who knows!!!", summary: "the summary" }}
    ${429}     | ${ThrottlingError}      | ${{ code: "throttle", message: "too much", summary: "the summary" }}
    ${500}     | ${ServiceInternalError} | ${{ code: "internal_error", message: "unexpected error", summary: "the summary" }}
    ${503}     | ${ServiceTimeoutError}  | ${{ code: "service_timeout", message: "too slow on our side", summary: "the summary" }}
  `(
    "Includes a summary when present in error field",
    async ({ httpStatus, expectedErrorType, expectedErrorFields }) => {
      expect.assertions(5);

      try {
        fetch.mockRejectOnce({
          // @ts-expect-error
          response: {
            data: {
              error: {
                message: expectedErrorFields.message,
                code: expectedErrorFields.code,
                summary: expectedErrorFields.summary,
              },
            },
            status: httpStatus,
          },
        });

        await client.query({ query: "'foo'.length" });
      } catch (e) {
        if (e instanceof ServiceError) {
          expect(e).toBeInstanceOf(expectedErrorType);
          expect(e.message).toEqual(expectedErrorFields.message);
          expect(e.httpStatus).toEqual(httpStatus);
          expect(e.code).toEqual(expectedErrorFields.code);
          expect(e.summary).toEqual(expectedErrorFields.summary);
        }
      }
    }
  );

  it.each`
    httpStatus | expectedErrorType       | expectedErrorFields
    ${403}     | ${AuthorizationError}   | ${{ code: "no_permission", message: "nope" }}
    ${440}     | ${QueryTimeoutError}    | ${{ code: "query_timeout", message: "too slow - increase your timeout" }}
    ${999}     | ${ServiceError}         | ${{ code: "error_not_yet_subclassed_in_client", message: "who knows!!!" }}
    ${429}     | ${ThrottlingError}      | ${{ code: "throttle", message: "too much" }}
    ${500}     | ${ServiceInternalError} | ${{ code: "internal_error", message: "unexpected error" }}
    ${503}     | ${ServiceTimeoutError}  | ${{ code: "service_timeout", message: "too slow on our side" }}
  `(
    "Includes a summary when not present in error field but present at top-level",
    async ({ httpStatus, expectedErrorType, expectedErrorFields }) => {
      expect.assertions(5);

      try {
        fetch.mockRejectOnce({
          // @ts-expect-error
          response: {
            data: {
              error: {
                message: expectedErrorFields.message,
                code: expectedErrorFields.code,
                summary: "the summary",
              },
            },
            status: httpStatus,
          },
        });

        await client.query({ query: "'foo'.length" });
      } catch (e) {
        if (e instanceof ServiceError) {
          expect(e).toBeInstanceOf(expectedErrorType);
          expect(e.message).toEqual(expectedErrorFields.message);
          expect(e.httpStatus).toEqual(httpStatus);
          expect(e.code).toEqual(expectedErrorFields.code);
          expect(e.summary).toEqual("the summary");
        }
      }
    }
  );

  it("Includes a summary in a QueryResult when present at top-level", async () => {
    fetch.mockResponseOnce(
      JSON.stringify({
        data: { length: 3, summary: "the summary", txn_time: Date.now() },
      })
    );

    const actual = await client.query({ query: "'foo'.length" });
    expect(actual.data.data.length).toEqual(3);
    expect(actual.data.data.summary).toEqual("the summary");
  });

  it("throws an NetworkError on a timeout", async () => {
    expect.assertions(1);

    try {
      fetch.mockRejectOnce({
        // @ts-expect-error
        request: {
          data: {
            error: {
              message: "The network connection encountered a problem.",
              code: 504,
            },
          },
          status: 0,
        },
      });

      await client.query({ query: "'foo'.length" });
    } catch (e) {
      if (e instanceof NetworkError) {
        expect(e.message).toEqual(
          "The network connection encountered a problem."
        );
      }
    }
  });

  it("throws an NetworkError on a network error", async () => {
    expect.assertions(1);

    try {
      fetch.mockRejectOnce({
        // @ts-expect-error
        request: {
          data: {
            error: {
              message: "The network connection encountered a problem.",
              code: 500,
            },
          },
          status: 0,
        },
      });

      await client.query({ query: "'foo'.length" });
    } catch (e) {
      if (e instanceof NetworkError) {
        expect(e.message).toEqual(
          "The network connection encountered a problem."
        );
      }
    }
  });

  it.each`
    errorCode
    ${"ECONNABORTED"}
    ${"ECONNREFUSED"}
    ${"ECONNRESET"}
    ${"ERR_NETWORK"}
    ${"ETIMEDOUT"}
    ${"ERR_HTTP_REQUEST_TIMEOUT"}
    ${"ERR_HTTP2_GOAWAY_SESSION"}
    ${"ERR_HTTP2_INVALID_SESSION"}
    ${"ERR_HTTP2_INVALID_STREAM"}
    ${"ERR_HTTP2_OUT_OF_STREAMS"}
    ${"ERR_HTTP2_SESSION_ERROR"}
    ${"ERR_HTTP2_STREAM_CANCEL"}
    ${"ERR_HTTP2_STREAM_ERROR"}
  `("throws an NetworkError on error code $errorCode", async ({ errorCode }) => {
    expect.assertions(1);

    try {
      fetch.mockRejectOnce({
        // @ts-expect-error
        request: {
          data: {
            error: {
              message: "The network connection encountered a problem.",
              code: errorCode,
            },
          },
          status: 0,
        },
      });

      await client.query({ query: "'foo'.length" });
    } catch (e) {
      if (e instanceof NetworkError) {
        expect(e.message).toEqual(
          "The network connection encountered a problem."
        );
      }
    }
  });

  it("throws an NetworkError if request never sent", async () => {
    expect.assertions(1);

    try {
      fetch.mockRejectOnce({
        // @ts-expect-error
        request: {
          data: {
            error: {
              message: "The network connection encountered a problem.",
              code: "",
            },
          },
          status: 0,
        },
      });

      await client.query({ query: "'foo'.length" });
    } catch (e) {
      if (e instanceof NetworkError) {
        expect(e.message).toEqual(
          "The network connection encountered a problem."
        );
      }
    }
  });
});
