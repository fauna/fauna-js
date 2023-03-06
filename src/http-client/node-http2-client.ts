import http2 from "http2";

import { HTTPClient, HTTPRequest, HTTPResponse } from "./index";

const { HTTP2_HEADER_PATH, HTTP2_HEADER_METHOD, HTTP2_HEADER_STATUS } =
  http2.constants;

/**
 * An implementation for {@link HTTPClient} that uses the node http package
 */
export class NodeHTTP2Client implements HTTPClient {
  static #client: NodeHTTP2Client | null = null;
  #sessionMap: Map<string, http2.ClientHttp2Session> = new Map();

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
  async request({
    data: requestData,
    headers: requestHeaders,
    method,
    url,
  }: HTTPRequest): Promise<HTTPResponse> {
    let req: http2.ClientHttp2Stream;

    return new Promise<HTTPResponse>((resolvePromise, rejectPromise) => {
      // This callback is fired once we receive a response from the server
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
          if (!status) {
            rejectPromise(
              new Error("Missing status code from response headers")
            );
          }

          resolvePromise({
            status,
            body: responseData,
            headers: http2ResponseHeaders,
          });
        });
      };

      try {
        const pathName = "/query/1"; // WIP: depends on streaming or not
        const httpRequestHeaders: http2.OutgoingHttpHeaders = {
          ...requestHeaders,
          [HTTP2_HEADER_PATH]: pathName,
          [HTTP2_HEADER_METHOD]: method,
        };

        req = this.getSession(url)
          .request(httpRequestHeaders)
          .setEncoding("utf8")
          .on("error", (error) => rejectPromise(error))
          .on("response", onResponse);

        req.write(JSON.stringify(requestData), "utf8");
        req.end();
      } catch (error) {
        rejectPromise(error);
      }
    });
  }

  getSession(url: string): http2.ClientHttp2Session {
    const sessionKey = url; // WIP: need to account for streaming

    if (this.#sessionMap.has(sessionKey)) {
      // #sessionMap.has(sessionKey) will not return `undefined`
      return this.#sessionMap.get(sessionKey) as http2.ClientHttp2Session;
    } else {
      const session = http2.connect(sessionKey);
      // TODO: actual error handling
      session.on("error", (err) => console.error(err));
      this.#sessionMap.set(sessionKey, session);
      return session;
    }
  }
}
