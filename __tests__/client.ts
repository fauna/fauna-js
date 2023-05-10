import { Client, ClientConfiguration, endpoints, HTTPClient } from "../src";
import { HTTPClientOptions } from "../src/http-client/http-client";

export const getClient = (
  config?: Partial<ClientConfiguration>,
  httpClient?: HTTPClient
) => {
  const { secret, endpoint } = getDefaultSecretAndEndpoint();
  return new Client(
    {
      secret,
      endpoint,
      ...config,
    },
    httpClient
  );
};

export function getDefaultSecretAndEndpoint() {
  const secret = process.env["FAUNA_SECRET"] ?? "secret";
  const endpoint = process.env["FAUNA_ENDPOINT"]
    ? new URL(process.env["FAUNA_ENDPOINT"])
    : endpoints.local;
  return { secret, endpoint };
}

export const getDefaultHTTPClientOptions = (): HTTPClientOptions => {
  const url = process.env["FAUNA_ENDPOINT"]
    ? new URL(process.env["FAUNA_ENDPOINT"])
    : endpoints.local;
  const http2_session_idle_ms = 500;
  return { url: url.toString(), http2_session_idle_ms };
};
