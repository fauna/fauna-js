let http2: any;
try {
  http2 = require("node:http2");
} catch (_) {
  http2 = undefined;
}
import {
  HTTPClient,
  HTTPClientOptions,
  HTTPRequest,
  HTTPResponse,
} from "./http-client";
import { NetworkError } from "../errors";

// alias http2 types
type ClientHttp2Session = any;
type ClientHttp2Stream = any;
type IncomingHttpHeaders = any;
type IncomingHttpStatusHeader = any;
type OutgoingHttpHeaders = any;

/**
 * An implementation for {@link HTTPClient} that uses the node http package
 */
export class NodeHTTP2Client implements HTTPClient {
  static #clients: Map<string, NodeHTTP2Client> = new Map();

  #http2_session_idle_ms: number;
  #http2_max_streams: number;
  #url: string;
  #numberOfUsers = 0;
  #session: ClientHttp2Session | null;

  private constructor({
    http2_session_idle_ms,
    url,
    http2_max_streams,
  }: HTTPClientOptions) {
    if (http2 === undefined) {
      throw new Error("Your platform does not support Node's http2 library");
    }

    this.#http2_session_idle_ms = http2_session_idle_ms;
    this.#http2_max_streams = http2_max_streams;
    this.#url = url;
    this.#session = null;
  }

  /**
   * Gets a {@link NodeHTTP2Client} matching the {@link HTTTPClientOptions}
   * @param httpClientOptions - the {@link HTTTPClientOptions}
   * @returns a {@link NodeHTTP2Client} matching the {@link HTTTPClientOptions}
   */
  static getClient(httpClientOptions: HTTPClientOptions): NodeHTTP2Client {
    const clientKey = NodeHTTP2Client.#getClientKey(httpClientOptions);
    if (!NodeHTTP2Client.#clients.has(clientKey)) {
      NodeHTTP2Client.#clients.set(
        clientKey,
        new NodeHTTP2Client(httpClientOptions)
      );
    }
    // we know that we have a client here
    const client = NodeHTTP2Client.#clients.get(clientKey) as NodeHTTP2Client;
    client.#numberOfUsers++;
    return client;
  }

  static #getClientKey({ http2_session_idle_ms, url }: HTTPClientOptions) {
    return `${url}|${http2_session_idle_ms}`;
  }

  /** {@inheritDoc HTTPClient.request} */
  async request(req: HTTPRequest): Promise<HTTPResponse> {
    let retryCount = 0;
    let memoizedError: any;
    do {
      try {
        return await this.#doRequest(req);
      } catch (error: any) {
        // see https://github.com/nodejs/node/pull/42190/files
        // and https://github.com/nodejs/help/issues/2105
        //
        // TLDR; In Node, there is a race condition between handling
        // GOAWAY and submitting requests - that can cause
        // clients that safely handle go away to submit
        // requests after a GOAWAY was received anyway.
        //
        // technical explanation: node HTTP2 request gets put
        // on event queue before it is actually executed. In the iterim,
        // a GOAWAY can come and cause the request to fail
        // with a GOAWAY.
        if (error?.code !== "ERR_HTTP2_GOAWAY_SESSION") {
          // TODO: be more discernable about error types
          throw new NetworkError(
            "The network connection encountered a problem.",
            {
              cause: error,
            }
          );
        }
        memoizedError = error;
        retryCount++;
      }
    } while (retryCount < 3);
    throw new NetworkError("The network connection encountered a problem.", {
      cause: memoizedError,
    });
  }

  /** {@inheritDoc HTTPClient.close} */
  close() {
    // defend against redundant close calls
    if (this.isClosed()) {
      return;
    }
    this.#numberOfUsers--;
    if (this.#numberOfUsers === 0 && this.#session && !this.#session.closed) {
      this.#session.close();
    }
  }

  /**
   * @returns true if this client has been closed, false otherwise.
   */
  isClosed(): boolean {
    return this.#numberOfUsers === 0;
  }

  #closeForAll() {
    this.#numberOfUsers = 0;
    if (this.#session && !this.#session.closed) {
      this.#session.close();
    }
  }

  #connect() {
    // create the session if it does not exist or is closed
    if (!this.#session || this.#session.closed || this.#session.destroyed) {
      const new_session: ClientHttp2Session = http2
        .connect(this.#url, {
          peerMaxConcurrentStreams: this.#http2_max_streams,
        })
        .once("error", () => this.#closeForAll())
        .once("goaway", () => this.#closeForAll());

      new_session.setTimeout(this.#http2_session_idle_ms, () => {
        this.#closeForAll();
      });

      this.#session = new_session;
    }
    return this.#session;
  }

  #doRequest({
    client_timeout_ms,
    data: requestData,
    headers: requestHeaders,
    method,
  }: HTTPRequest): Promise<HTTPResponse> {
    return new Promise<HTTPResponse>((resolvePromise, rejectPromise) => {
      let req: ClientHttp2Stream;
      const onResponse = (
        http2ResponseHeaders: IncomingHttpHeaders & IncomingHttpStatusHeader
      ) => {
        const status = Number(
          http2ResponseHeaders[http2.constants.HTTP2_HEADER_STATUS]
        );
        let responseData = "";

        // append response data to the data string every time we receive new
        // data chunks in the response
        req.on("data", (chunk: any) => {
          responseData += chunk;
        });

        // Once the response is finished, resolve the promise
        req.on("end", () => {
          resolvePromise({
            status,
            body: responseData,
            headers: http2ResponseHeaders,
          });
        });
      };

      try {
        const httpRequestHeaders: OutgoingHttpHeaders = {
          ...requestHeaders,
          [http2.constants.HTTP2_HEADER_PATH]: "/query/1",
          [http2.constants.HTTP2_HEADER_METHOD]: method,
        };

        const session = this.#connect();
        req = session
          .request(httpRequestHeaders)
          .setEncoding("utf8")
          .on("error", (error: any) => {
            rejectPromise(error);
          })
          .on("response", onResponse);

        req.write(JSON.stringify(requestData), "utf8");

        // req.setTimeout must be called before req.end()
        req.setTimeout(client_timeout_ms, () => {
          req.destroy(new Error(`Client timeout`));
        });

        req.end();
      } catch (error) {
        rejectPromise(error);
      }
    });
  }
}
