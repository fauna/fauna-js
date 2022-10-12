import axios, { Axios, AxiosResponse } from "axios";

export interface ClientConfiguration {
  endpoint: URL;
  secret: string;
  queryTimeoutMillis: number;
}

export interface Endpoints {
  cloud: URL;
  local: URL;
}

export const endpoints: Endpoints = {
  cloud: new URL("https://db.fauna.com"),
  local: new URL("http://localhost:8443"),
};

export class QueryError extends Error {}

export class Client {
  readonly clientConfiguration: ClientConfiguration;
  readonly client: Axios;

  constructor(clientConfiguration: ClientConfiguration) {
    this.clientConfiguration = clientConfiguration;
    this.client = axios.create({
      baseURL: this.clientConfiguration.endpoint.toString(),
      timeout: this.clientConfiguration.queryTimeoutMillis + 1000,
    });
    this.client.defaults.headers.common[
      "Authorization"
    ] = `Bearer ${this.clientConfiguration.secret}`;
  }

  async query<T = any>(query: string): Promise<T> {
    try {
      const result: AxiosResponse<{ data: T }> = await this.client.post<{
        data: T;
      }>("/query/1", { query });
      return result.data.data;
    } catch (e) {
      throw new QueryError("Query failed.");
    }
  }
}
