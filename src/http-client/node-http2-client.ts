import http2 from "http2";

import { HTTPClient, HTTPRequest, HTTPResponse } from "./index";
import { NetworkError, ProtocolError } from "../errors";
import { QueryRequest } from "../wire-protocol";

const { HTTP2_HEADER_PATH, HTTP2_HEADER_METHOD, HTTP2_HEADER_STATUS } =
  http2.constants;

/**
 * An implementation for {@link HTTPClient} that uses the node http package
 */
export class NodeHTTP2Client implements HTTPClient {
  static #client: NodeHTTP2Client | null = null;
  #sessionMap: Map<string, SessionWrapper> = new Map();

  /**
   * @remarks Private constructor means you must instantiate with
   * {@link NodeHTTP2Client.getClient}
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}

  static getClient() {
    if (this.#client) {
      return this.#client;
    }

    this.#client = new NodeHTTP2Client();
    return this.#client;
  }

  /** {@inheritDoc HTTPClient.request} */
  async request(httpRequest: HTTPRequest): Promise<HTTPResponse> {
    const session = this.#getSession(httpRequest.url);

    try {
      const result = await session.request(httpRequest);
      return result;
    } catch (error) {
      // We do this cleanup in v4 driver. Does it risk killing other open requests
      // that we want to let go, or if we are in this catch block are we actually
      // safe to do this?
      this.#cleanupSession(httpRequest.url);

      // TODO: be more discernable about error types
      throw new NetworkError("The network connection encountered a problem.", {
        cause: error,
      });
    }
  }

  #cleanupSession(url: string) {
    const sessionKey = url; // WIP: need to account for streaming

    const session = this.#sessionMap.get(sessionKey);
    if (session) {
      session.close();
      this.#sessionMap.delete(sessionKey);
    }
  }

  #getSession(url: string): SessionWrapper {
    const sessionKey = url; // WIP: need to account for streaming

    if (this.#sessionMap.has(sessionKey)) {
      // #sessionMap.has(sessionKey) will not return `undefined`
      const session = this.#sessionMap.get(sessionKey) as SessionWrapper;

      if (session.internal.closed) {
        // cannot reuse sessions once they are closed
        this.#sessionMap.delete(sessionKey);
      } else {
        return this.#sessionMap.get(sessionKey) as SessionWrapper;
      }
    }

    const session = new SessionWrapper(sessionKey);
    session.internal
      .once("error", () => this.#cleanupSession(url))
      .once("goaway", () => this.#cleanupSession(url));
    this.#sessionMap.set(sessionKey, session);

    return session;
  }
}

type SessionWrapperOptions = {
  idleTime: number;
  // WIP: a flag for streaming should go here
};

type SessionRequestOptions = {
  data: QueryRequest;
  headers: Record<string, string | undefined>;
  method: "POST" | "GET";
  // WIP: stream-consumer callbacks like onData should go here
};

const DEFAULT_SESSION_OPTIONS: SessionWrapperOptions = {
  idleTime: 500,
};

class SessionWrapper {
  readonly internal: http2.ClientHttp2Session;
  readonly #idleTime: number;
  // WIP: should be set to something different for streaming
  readonly #pathName: "/query/1";
  #ongoingRequests: number;
  #timerId: NodeJS.Timeout | null;

  constructor(url: string, options?: Partial<SessionWrapperOptions>) {
    const _options: SessionWrapperOptions = {
      ...DEFAULT_SESSION_OPTIONS,
      ...options,
    };
    this.#ongoingRequests = 0;
    this.#timerId = null;
    // TODO: put a cap on lax idle time
    this.#idleTime = _options.idleTime;
    // WIP: should be set to something different for streaming
    this.#pathName = "/query/1";

    try {
      this.internal = http2.connect(url);
    } catch (error) {
      throw new NetworkError(`Could not connect to ${url}`, { cause: error });
    }
  }

  close() {
    this.#clearInactivityTimeout();
    this.internal.close();
  }

  async request({
    data: requestData,
    headers: requestHeaders,
    method,
  }: SessionRequestOptions): Promise<HTTPResponse> {
    let req: http2.ClientHttp2Stream;

    return new Promise<HTTPResponse>((resolvePromise, rejectPromise) => {
      const onResponse = (
        http2ResponseHeaders: http2.IncomingHttpHeaders &
          http2.IncomingHttpStatusHeader
      ) => {
        const status = Number(http2ResponseHeaders[HTTP2_HEADER_STATUS]);
        let responseData = "";

        // append response data to the data string every time we receive new data
        // chunks in the response
        req.on("data", (chunk) => {
          responseData += chunk;
        });

        // Once the response is finished, resolve the promise
        req.on("end", () => {
          // #onRequestStart must be called to decrease the reference count
          this.#onRequestEnd();
          resolvePromise({
            status,
            body: responseData,
            headers: http2ResponseHeaders,
          });
        });
      };

      try {
        const httpRequestHeaders: http2.OutgoingHttpHeaders = {
          ...requestHeaders,
          [HTTP2_HEADER_PATH]: this.#pathName,
          [HTTP2_HEADER_METHOD]: method,
        };

        req = this.internal
          .request(httpRequestHeaders)
          .setEncoding("utf8")
          .on("error", (error) => rejectPromise(error))
          .on("response", onResponse);
        // #onRequestStart must be called to increase the reference count
        this.#onRequestStart();
        req.write(JSON.stringify(requestData), "utf8");
        req.end();
      } catch (error) {
        rejectPromise(error);
      }
    });
  }

  #clearInactivityTimeout() {
    if (this.#timerId) {
      clearTimeout(this.#timerId);
      this.#timerId = null;
    }
  }

  #onRequestEnd() {
    --this.#ongoingRequests;
    const noOngoingRequests = this.#ongoingRequests === 0;
    const isSessionClosed = this.internal.closed || this.internal.destroyed;
    if (noOngoingRequests && !isSessionClosed) {
      this.#setInactivityTimeout();
    }
  }

  #onRequestStart() {
    ++this.#ongoingRequests;
    this.#clearInactivityTimeout();
  }

  #setInactivityTimeout() {
    this.#clearInactivityTimeout();
    const onTimeout = () => {
      this.#timerId = null;
      if (this.#ongoingRequests === 0) {
        this.close();
      }
    };
    this.#timerId = setTimeout(onTimeout, this.#idleTime);
  }
}
