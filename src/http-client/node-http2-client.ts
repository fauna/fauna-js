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
 * Wrapper to provide reference counting for sessions.
 *
 * @internal
 */
type SessionRC = {
  /** A session to be shared among http clients */
  session: ClientHttp2Session | null;
  /**
   * A Setof client references. We will only close the session when there are no
   * references left. This cannot be a WeakSet, because WeakSets are not
   * enumerable (can't check if they are empty).
   */
  refs: Set<NodeHTTP2Client>;
};

/**
 * A class to manage connecting and closing sessions
 *
 * @internal
 */
class SessionManager {
  #map: Map<string, SessionRC> = new Map();

  connect(client: NodeHTTP2Client) {
    let session_rc = this.#map.get(client.sessionKey);

    // initialize the Map if necessary
    if (!session_rc) {
      session_rc = {
        session: null,
        refs: new Set(),
      };

      this.#map.set(client.sessionKey, session_rc);
    }

    // create a new session if necessary
    if (session_rc.session === null || session_rc.session.closed) {
      const http2_session_idle_ms = client.http2_session_idle_ms;
      const url = client.url;

      const new_session: ClientHttp2Session = http2
        .connect(url)
        .once("error", () => this.close(client))
        .once("goaway", () => this.close(client));

      new_session.setTimeout(http2_session_idle_ms, () => {
        this.closeForAll(client);
      });

      session_rc.session = new_session;
    }

    session_rc.refs.add(client);

    return session_rc.session;
  }

  close(client: NodeHTTP2Client) {
    const session_rc = this.#map.get(client.sessionKey);
    if (!session_rc) return;

    session_rc.refs.delete(client);

    // if there are no clients referencing the session, then we can close it
    if (session_rc.refs.size === 0) {
      const session = session_rc.session;
      if (session && !session.closed) session.close();

      session_rc.session = null;
    }
  }

  closeForAll(client: NodeHTTP2Client) {
    const session_rc = this.#map.get(client.sessionKey);
    if (!session_rc) return;

    session_rc.refs.clear();
    const session = session_rc.session;
    if (session && !session.closed) session.close();

    session_rc.session = null;
  }

  isClosed(client: NodeHTTP2Client): boolean {
    const session_rc = this.#map.get(client.sessionKey);
    return (session_rc?.refs.size ?? 0) === 0;
  }
}

/**
 * An implementation for {@link HTTPClient} that uses the node http package
 */
export class NodeHTTP2Client implements HTTPClient {
  static #sessionManager = new SessionManager();

  http2_session_idle_ms: number;
  url: string;

  constructor({ http2_session_idle_ms, url }: HTTPClientOptions) {
    this.http2_session_idle_ms = http2_session_idle_ms;
    this.url = url;
  }

  /** {@inheritDoc HTTPClient.request} */
  async request({
    client_timeout_ms,
    data: requestData,
    headers: requestHeaders,
    method,
  }: HTTPRequest): Promise<HTTPResponse> {
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

          const session = NodeHTTP2Client.#sessionManager.connect(this);
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
    NodeHTTP2Client.#sessionManager.close(this);
  }

  /**
   * @returns true if this client has been closed, false otherwise.
   */
  isClosed(): boolean {
    return NodeHTTP2Client.#sessionManager.isClosed(this);
  }

  /**
   * Creates a key common the client that should share the same session
   */
  get sessionKey() {
    return `${this.url}|${this.http2_session_idle_ms}`;
  }
}
