import {
  Client,
  ClientConfiguration,
  endpoints,
  fql,
  HTTPClient,
} from "../src";
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
  return {
    url: url.toString(),
    http2_session_idle_ms,
    http2_max_streams: 100,
    fetch_keepalive: false,
  };
};

export const newDB = async (name: string): Promise<Client> => {
  const parentClient = getClient();

  const secretQ = await parentClient.query<string>(fql`
    if (Database.byName(${name}).exists()) {
      Key.where(.database == ${name}).forEach(.delete())
      Database.byName(${name})!.delete()
    }
    Database.create({ name: ${name} })
    Key.create({ role: "admin", database: ${name} }).secret
  `);

  return getClient({ secret: secretQ.data });
};
