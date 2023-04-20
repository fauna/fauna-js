import { Client, ClientConfiguration, endpoints, HTTPClient } from "../src";

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
