export { FetchClient } from "./fetch-client";

export type HTTPRequest = {
  data: Record<string, any>;
  headers: Record<string, string>;
  method: string;
  url: string;
  keepalive?: boolean;
};

export type HTTPResponse = {
  headers: Record<string, string>;
  status: number;
  body: string;
};

export interface HTTPClient {
  request(req: HTTPRequest): Promise<HTTPResponse>;
}
