import { Client } from "../src/client";
import { ClientConfiguration, endpoints } from "../src/client-configuration";
import { HTTPClient } from "../src/http-client";

export const getClient = (
  config?: Partial<ClientConfiguration>,
  httpClient?: HTTPClient
) => {
  const secret = process.env["FAUNA_SECRET"] ?? "secret";
  const endpoint = process.env["FAUNA_ENDPOINT"]
    ? new URL(process.env["FAUNA_ENDPOINT"])
    : endpoints.local;
  return new Client(
    {
      secret,
      endpoint,
      ...config,
    },
    httpClient
  );
};
