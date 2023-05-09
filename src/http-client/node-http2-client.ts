let http2: any;
try {
  http2 = require("node:http2");
} catch (_) {
  http2 = undefined;
}
// import http2 from "node:http2";
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

// import http2 from "node:http2";
// type ClientHttp2Session = http2.ClientHttp2Session
// type ClientHttp2Stream = http2.ClientHttp2Stream
// type IncomingHttpHeaders = http2.IncomingHttpHeaders
// type IncomingHttpStatusHeader = http2.IncomingHttpStatusHeader
// type OutgoingHttpHeaders = http2.OutgoingHttpHeaders

/**
 * An implementation for {@link HTTPClient} that uses the node http package
 */
export class NodeHTTP2Client implements HTTPClient {
  static #sessionMap: Map<string, SessionWrapper> = new Map();

  #http2_session_idle_ms: number;
  #url: string;
  /** number of users using this NodeHTTP2Client */

  constructor({ http2_session_idle_ms, url }: HTTPClientOptions) {
    this.#http2_session_idle_ms = http2_session_idle_ms;
    this.#url = url;
  }

  /** {@inheritDoc HTTPClient.request} */
  async request({
    client_timeout_ms,
    data: requestData,
    headers: requestHeaders,
    method,
  }: HTTPRequest): Promise<HTTPResponse> {
    const session = this.#getOpenSession();

    let req: ClientHttp2Stream;

    const requestPromise = new Promise<HTTPResponse>(
      (resolvePromise, rejectPromise) => {
        const onResponse = (
          http2ResponseHeaders: IncomingHttpHeaders & IncomingHttpStatusHeader
        ) => {
          const status = Number(
            http2ResponseHeaders[http2.constants.HTTP2_HEADER_STATUS]
          );
          let responseData = "";

          // append response data to the data string every time we receive new data
          // chunks in the response
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
      }
    );

    try {
      return await requestPromise;
    } catch (error) {
      // TODO: be more discernable about error types
      throw new NetworkError("The network connection encountered a problem.", {
        cause: error,
      });
    }
  }

  /** {@inheritDoc HTTPClient.close} */
  close() {
    const session = this.#getSessionWrapper()?.session;
    if (session && !session.closed) {
      session.close();
    }
  }

  /**
   * @returns true if this client has been closed, false otherwise.
   */
  isClosed(): boolean {
    return this.#getSessionWrapper()?.session.closed ?? false;
  }

  #getOpenSession(): ClientHttp2Session {
    const connectNewSession = (): ClientHttp2Session => {
      try {
        const session: ClientHttp2Session = http2
          .connect(this.#url)
          .once("error", () => session.close())
          .once("goaway", () => session.close());

        session.setTimeout(this.#http2_session_idle_ms, () => {
          this.close();
        });

        return session;
      } catch (error) {
        throw new NetworkError(`Could not connect to Fauna`, { cause: error });
      }
    };

    // First time we create a client, establish a new session and cache it in
    // the shared session map
    if (!NodeHTTP2Client.#sessionMap.has(this.#sessionKey)) {
      const session = connectNewSession();
      const sessionWrapper: SessionWrapper = { session };
      NodeHTTP2Client.#sessionMap.set(this.#sessionKey, sessionWrapper);

      return session;
    }

    // typecast safety: we just checked if the entry existed
    const sessionWrapper = this.#getSessionWrapper() as SessionWrapper;

    // if the existing session is closed then a create a new one an update the
    // shared session map
    if (sessionWrapper.session.closed) {
      // cannot reuse sessions once they are closed
      const new_session = connectNewSession();
      sessionWrapper.session = new_session;
    }

    return sessionWrapper.session;
  }

  #getSessionWrapper(): SessionWrapper | undefined {
    return NodeHTTP2Client.#sessionMap.get(this.#sessionKey);
  }

  get #sessionKey(): string {
    // WIP: need to account for streaming
    return `${this.#url}|${this.#http2_session_idle_ms}`;
  }
}

/**
 * Put the session in an object, so we can update the session without deleting
 * and resetting what is in the Map
 */
type SessionWrapper = {
  session: ClientHttp2Session;
};
