/** following reference needed to include types for experimental fetch API in Node */
/// <reference lib="dom" />

import { getServiceError, NetworkError } from "../errors";
import { QueryFailure, QueryRequest } from "../wire-protocol";
import { FaunaAPIPaths } from "./paths";
import {
  HTTPClient,
  HTTPClientOptions,
  HTTPRequest,
  HTTPResponse,
  HTTPStreamRequest,
  HTTPStreamClient,
  StreamAdapter,
} from "./http-client";

/**
 * An implementation for {@link HTTPClient} that uses the native fetch API
 */
export class FetchClient implements HTTPClient, HTTPStreamClient {
  #baseUrl: string;
  #defaultRequestPath = FaunaAPIPaths.QUERY;
  #defaultStreamPath = FaunaAPIPaths.STREAM;
  #keepalive: boolean;

  constructor({ url, fetch_keepalive }: HTTPClientOptions) {
    this.#baseUrl = url;
    this.#keepalive = fetch_keepalive;
  }

  #resolveURL(path: string): string {
    return new URL(path, this.#baseUrl).toString();
  }

  /** {@inheritDoc HTTPClient.request} */
  async request<T = QueryRequest>({
    data,
    headers: requestHeaders,
    method,
    client_timeout_ms,
    path = this.#defaultRequestPath,
  }: HTTPRequest<T>): Promise<HTTPResponse> {
    const signal =
      AbortSignal.timeout === undefined
        ? (() => {
            const controller = new AbortController();
            const signal = controller.signal;
            setTimeout(() => controller.abort(), client_timeout_ms);
            return signal;
          })()
        : AbortSignal.timeout(client_timeout_ms);

    const response = await fetch(this.#resolveURL(path), {
      method,
      headers: { ...requestHeaders, "Content-Type": "application/json" },
      body: JSON.stringify(data),
      signal,
      keepalive: this.#keepalive,
    }).catch((error) => {
      throw new NetworkError("The network connection encountered a problem.", {
        cause: error,
      });
    });

    const status = response.status;

    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => (responseHeaders[key] = value));

    const body = await response.text();

    return {
      status,
      body,
      headers: responseHeaders,
    };
  }

  /** {@inheritDoc HTTPStreamClient.stream} */
  stream({
    data,
    headers: requestHeaders,
    method,
    path = this.#defaultStreamPath,
  }: HTTPStreamRequest): StreamAdapter {
    const request = new Request(this.#resolveURL(path), {
      method,
      headers: { ...requestHeaders, "Content-Type": "application/json" },
      body: JSON.stringify(data),
      keepalive: this.#keepalive,
    });

    const abortController = new AbortController();

    const options = {
      signal: abortController.signal,
    };

    async function* reader() {
      const response = await fetch(request, options).catch((error) => {
        throw new NetworkError(
          "The network connection encountered a problem.",
          {
            cause: error,
          },
        );
      });
      const status = response.status;
      if (!(status >= 200 && status < 400)) {
        const failure: QueryFailure = await response.json();
        throw getServiceError(failure, status);
      }

      const body = response.body;
      if (!body) {
        throw new Error("Response body is undefined.");
      }
      const reader = body.getReader();

      try {
        for await (const line of readLines(reader)) {
          yield line;
        }
      } catch (error) {
        throw new NetworkError(
          "The network connection encountered a problem while streaming events.",
          { cause: error },
        );
      }
    }

    return {
      read: reader(),
      close: () => {
        abortController.abort("Stream closed by the client.");
      },
    };
  }

  /** {@inheritDoc HTTPClient.close} */
  close() {
    // no actions at this time
  }
}

/**
 * Get individual lines from the stream
 *
 * The stream may be broken into arbitrary chunks, but the events are delimited by a newline character.
 *
 * @param reader - The stream reader
 */
async function* readLines(reader: ReadableStreamDefaultReader<Uint8Array>) {
  const textDecoder = new TextDecoder();
  let partOfLine = "";
  for await (const chunk of readChunks(reader)) {
    const chunkText = textDecoder.decode(chunk);
    const chunkLines = (partOfLine + chunkText).split("\n");

    // Yield all complete lines
    for (let i = 0; i < chunkLines.length - 1; i++) {
      yield chunkLines[i].trim();
    }

    // Store the partial line
    partOfLine = chunkLines[chunkLines.length - 1];
  }

  // Yield the remaining partial line if any
  if (partOfLine.trim() !== "") {
    yield partOfLine;
  }
}

async function* readChunks(reader: ReadableStreamDefaultReader<Uint8Array>) {
  let done = false;
  do {
    const readResult = await reader.read();
    if (readResult.value !== undefined) {
      yield readResult.value;
    }
    done = readResult.done;
  } while (!done);
}
