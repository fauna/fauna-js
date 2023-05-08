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

/**
 * An implementation for {@link HTTPClient} that uses the node http package
 */
export class NodeHTTP2Client extends HTTPClient {
  static #client: NodeHTTP2Client | null = null;

  #sessionMap: Map<string, SessionWrapper> = new Map();
  /** number of users using this NodeHTTP2Client */
  #numberOfUsers = 0;

  /**
   * @remarks Private constructor means you must instantiate with
   * {@link NodeHTTP2Client.getClient}
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor(options?: HTTPClientOptions) {
    super(options);
  }

  static getClient(options?: HTTPClientOptions) {
    if (http2 === undefined) {
      throw new Error("Your platform does not support Node's http2 library");
    }

    if (this.#client === null) {
      this.#client = new NodeHTTP2Client(options);
    }

    if (options?.http2_session_idle_ms) {
      this.#client.http2_session_idle_ms = options.http2_session_idle_ms;
    }

    this.#client.#numberOfUsers++;
    return this.#client;
  }

  /** {@inheritDoc HTTPClient.request} */
  async request(httpRequest: HTTPRequest): Promise<HTTPResponse> {
    const session = this.#getSession(httpRequest.url);

    try {
      const result = await session.request(httpRequest);
      return result;
    } catch (error) {
      // TODO: be more discernable about error types
      throw new NetworkError("The network connection encountered a problem.", {
        cause: error,
      });
    }
  }

  /** {@inheritDoc HTTPClient.close} */
  close() {
    // defend against redundant close calls
    if (this.isClosed()) {
      return;
    }
    this.#numberOfUsers--;
    if (this.#numberOfUsers === 0) {
      for (const sessionWrapper of this.#sessionMap.values()) {
        sessionWrapper.close();
      }
    }
  }

  /**
   * @returns true if this client has been closed, false otherwise.
   */
  isClosed() {
    return this.#numberOfUsers === 0;
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
      .once("error", () => session.close())
      .once("goaway", () => session.close());
    this.#sessionMap.set(sessionKey, session);

    return session;
  }
}

type SessionWrapperOptions = {
  http2_session_idle_ms: number;
  // WIP: a flag for streaming should go here
};

const DEFAULT_SESSION_OPTIONS: SessionWrapperOptions = {
  http2_session_idle_ms: 500,
};

class SessionWrapper {
  readonly internal: any;
  readonly #http2_session_idle_ms: number;
  // WIP: should be set to something different for streaming
  readonly #pathName: "/query/1";

  constructor(url: string, options?: Partial<SessionWrapperOptions>) {
    const _options: SessionWrapperOptions = {
      ...DEFAULT_SESSION_OPTIONS,
      ...options,
    };
    // TODO: put a cap on lax idle time
    this.#http2_session_idle_ms = _options.http2_session_idle_ms;
    // WIP: should be set to something different for streaming
    this.#pathName = "/query/1";

    try {
      this.internal = http2.connect(url);
      this.internal.setTimeout(this.#http2_session_idle_ms, () => {
        this.close();
      });
    } catch (error) {
      throw new NetworkError(`Could not connect to Fauna`, { cause: error });
    }
  }

  close() {
    this.internal.close();
  }

  async request({
    data: requestData,
    headers: requestHeaders,
    method,
    client_timeout_ms,
  }: HTTPRequest): Promise<HTTPResponse> {
    let req: any;

    return new Promise<HTTPResponse>((resolvePromise, rejectPromise) => {
      const onResponse = (http2ResponseHeaders: any) => {
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
        const httpRequestHeaders: any = {
          ...requestHeaders,
          [http2.constants.HTTP2_HEADER_PATH]: this.#pathName,
          [http2.constants.HTTP2_HEADER_METHOD]: method,
        };

        req = this.internal
          .request(httpRequestHeaders)
          .setEncoding("utf8")
          .on("error", (error: any) => rejectPromise(error))
          .on("response", onResponse);
        req.write(JSON.stringify(requestData), "utf8");

        // req.setTimeout must be called before req.end()
        if (client_timeout_ms !== undefined) {
          req.setTimeout(client_timeout_ms, () => {
            req.destroy(new Error(`Client timeout`));
          });
        }

        req.end();
      } catch (error) {
        rejectPromise(error);
      }
    });
  }
}
