import { Client, ClientConfiguration, endpoints } from "fauna";
import { getSecret } from "../utils";

/**
 * Your task - return a client that talks to Fauna's preview endpoint,
 * has a max_conns to Fauna of 10, and has a query timeout of 60 seconds.
 * You can use the getSecret() function to retrieve your secret from
 * the FAUNA_SECRET environmental variable.
 */
export function constructingClients(): Client {
  const secret = getSecret();
  // the driver includes a client class you can use to talk to Fauna.
  // it can be constructed by passing an object matching the driver's
  // ClientConfiguration type to the driver.
  const clientConfiguration: ClientConfiguration = {
    // there are required and optional fields in a ClientConfiguration.
    // Required are the endpoint, the max_conns the client should maintain to Fauna,
    // the secret you'll use to communicate to Fauna, and the query timeout to use.
    // Here's a basic settings:
    endpoint: endpoints.preview,
    max_conns: 10,
    query_timeout_ms: 60_000,
    secret,
  };
  // note, the driver also exposes an "endpoints" constant that embeds certain default
  // endpoints you can configure a client with.
  // Those are: cloud - to query Fauna, preview - to query the preview endpoint, and local
  // to query a local container.
  // Note that its no longer necessary to specify a region group - Fauna will automatically
  // route your traffice to the right region group.
  return new Client(clientConfiguration);
}

/**
 * Your task - return an array the URLs of the three endpoints that come
 * pre-configurable for a ClientConfiguration.
 * The first item should be Fauna's cloud endpoint, the second
 * item should be against Fauna's preview endpoint, and the final
 * should be against the localhost (which you can use to test against
 * a local container).
 * Hint: the client contains an `endpoints` object you can use for this!
 */
export function useEndpoints() {
  return [endpoints.cloud, endpoints.preview, endpoints.local];
}

/**
 * Your task - extend endpoints to have new URL endpoint of
 * "http://localhost:8888" name it 'otherLocal'
 * then return the entire extended endpoints object.
 * endpoints is provided by the client and is extensible in case you want to run through a proxy
 * or call some other endpoint not supported by default in the driver (such as a local container
 * on a port other than the standatd 8443).
 */
export function extendEndpoints() {
  // you can extend by:
  // endpoints.otherLocal = new URL("http://localhost:8888");
  // return endpoints;
  // here though we vend a solution in a new object to compare your answer without
  // mutating the endpoints object!
  return { ...endpoints, otherLocal: new URL("http://localhost:8888") };
}

/**
 * Your task - you an also configure a client to have default values for the
 * following headers:
 *   linerarized - If true, unconditionally run the query as strictly serialized.
 *     This affects read-only transactions. Transactions which write
 *     will always be strictly serialized.
 *   max_contention_retries: The max number of times to retry the query if contention is encountered.
 *  query_tags - tags to apply to your query; avaiable in logs and telemetry (see https://github.com/fauna/querylogs-demo)
 *  traceparent - A traceparent provided back via logging and telemetry.Must match format: https://www.w3.org/TR/trace-context/#traceparent-header
 * Return a client that has linearized set to true and max_contention_retries set to 5.
 * all other settings do not matter.
 */
export function defaultHeaders() {
  return new Client({
    endpoint: endpoints.preview,
    secret: getSecret(),
    query_timeout_ms: 60_000,
    max_conns: 10,
    linearized: true,
    max_contention_retries: 5,
  });
}
