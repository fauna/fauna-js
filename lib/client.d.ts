import { ClientConfiguration } from "./client-configuration";
import type { QueryBuilder } from "./query-builder";
import { type QueryRequest, type QueryRequestHeaders, type QuerySuccess } from "./wire-protocol";
import { type HTTPClient } from "./http-client";
/**
 * Client for calling Fauna.
 */
export declare class Client {
    #private;
    /**
     * Constructs a new {@link Client}.
     * @param clientConfiguration - the {@link ClientConfiguration} to apply. Defaults to recommended ClientConfiguraiton.
     * @param httpClient - The underlying {@link HTTPClient} that will execute the actual HTTP calls. Defaults to recommended HTTPClient.
     * @example
     * ```typescript
     *  const myClient = new Client(
     *   {
     *     endpoint: endpoints.cloud,
     *     max_conns: 10,
     *     secret: "foo",
     *     query_timeout_ms: 60_000,
     *   }
     * );
     * ```
     */
    constructor(clientConfiguration?: Partial<ClientConfiguration>, httpClient?: HTTPClient);
    /**
     * @returns the last transaction time seen by this client, or undefined if this client has not seen a transaction time.
     */
    get lastTxnTs(): number | undefined;
    /**
     * Sets the last transaction time of this client.
     * @param time - the last transaction time to set.
     * @throws Error if lastTxnTs is before the current lastTxn of the driver
     */
    set lastTxnTs(ts: number);
    /**
     * Return the {@link ClientConfiguration} of this client, save for the secret.
     */
    get clientConfiguration(): Omit<ClientConfiguration, "secret">;
    /**
     * Queries Fauna.
     * @param request - a {@link QueryRequest} or {@link QueryBuilder} to build a request with.
     *  Note, you can embed header fields in this object; if you do that there's no need to
     *  pass the headers parameter.
     * @param headers - optional {@link QueryRequestHeaders} to apply on top of the request input.
     *   Values in this headers parameter take precedence over the same values in the request
     *   parameter. This field is primarily intended to be used when you pass a QueryBuilder as
     *   the parameter.
     * @returns Promise&lt;{@link QuerySuccess}&gt;.
     * @throws {@link ServiceError} Fauna emitted an error. The ServiceError will be
     *   one of ServiceError's child classes if the error can be further categorized,
     *   or a concrete ServiceError if it cannot. ServiceError child types are
     *   {@link AuthenticaionError}, {@link AuthorizationError}, {@link QueryCheckError}
     *   {@link QueryRuntimeError}, {@link QueryTimeoutError}, {@link ServiceInternalError}
     *   {@link ServiceTimeoutError}, {@link ThrottlingError}.
     *   You can use either the type, or the underlying httpStatus + code to determine
     *   the root cause.
     * @throws {@link ProtocolError} the client a HTTP error not sent by Fauna.
     * @throws {@link NetworkError} the client encountered a network issue
     * connecting to Fauna.
     * @throws A {@link ClientError} the client fails to submit the request
     * due to an internal error.
     */
    query<T = any>(request: QueryRequest | QueryBuilder, headers?: QueryRequestHeaders): Promise<QuerySuccess<T>>;
}
