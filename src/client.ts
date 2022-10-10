import axios, { type Axios } from "axios";
import Agent, { HttpsAgent } from "agentkeepalive";
import type { ClientConfiguration } from "./client-configuration";
import {
  QueryError,
  type QueryRequest,
  type QueryResponse,
} from "./wire-protocol";

/**
 * Client for calling Fauna.
 */
export class Client {
  /** The {@link ClientConfiguration} */
  readonly clientConfiguration: ClientConfiguration;
  /** The underlying {@link Axios} client. */
  readonly client: Axios;

  /**
   * Constructs a new {@link Client}.
   * @param clientConfiguration - the {@link ClientConfiguration} to apply.
   * @example
   * ```typescript
   *  const myClient = new Client(
   *   {
   *     endpoint: endpoints.classic,
   *     secret: "foo",
   *     queryTimeoutMs: 60_000,
   *   }
   * );
   * ```
   */
  constructor(clientConfiguration: ClientConfiguration) {
    this.clientConfiguration = clientConfiguration;
    const agentSettings = {
      maxSockets: this.clientConfiguration.maxConns,
      maxFreeSockets: this.clientConfiguration.maxConns,
      // ensure the network timeout > ClientConfiguration.queryTimeoutMillis so we don't
      // terminate connections on active queries.
      timeout: this.clientConfiguration.queryTimeoutMillis + 10_000,
      // release socket for usage after 4s of inactivity. Must be less than Fauna's server
      // side idle timeout of 5 seconds.
      freeSocketTimeout: 4000,
    };
    let httpAgents;
    if (this.clientConfiguration.endpoint.protocol === "http") {
      httpAgents = { httpAgent: new Agent(agentSettings) };
    } else {
      httpAgents = { httpsAgent: new HttpsAgent(agentSettings) };
    }
    this.client = axios.create({
      baseURL: this.clientConfiguration.endpoint.toString(),
      // ensure the network timeout > ClientConfiguration.queryTimeoutMillis so we don't
      // terminate connections on active queries.
      timeout: this.clientConfiguration.queryTimeoutMillis + 10_000,
      ...httpAgents,
    });
    this.client.defaults.headers.common[
      "Authorization"
    ] = `Bearer ${this.clientConfiguration.secret}`;
  }

  /**
   * Queries Fauna.
   * @param queryRequest - the {@link QueryRequest}
   * @returns A {@link QueryResponse}.
   * @throws A {@link QueryError} if the request cannnot be completed.
   */
  async query<T = any>(queryRequest: QueryRequest): Promise<QueryResponse<T>> {
    try {
      const result = await this.client.post<QueryResponse<T>>(
        "/query/1",
        queryRequest
      );
      return result.data;
    } catch (e) {
      throw new QueryError("Query failed.");
    }
  }
}
