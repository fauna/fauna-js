export { FetchClient } from "./fetch-client";
export declare type HTTPRequest = {
    data: Record<string, any>;
    headers: Record<string, string>;
    method: string;
    url: string;
    keepalive?: boolean;
};
export declare type HTTPResponse = {
    headers: Record<string, string>;
    status: number;
    body: unknown;
};
export interface HTTPClient {
    request(req: HTTPRequest): Promise<HTTPResponse>;
}
