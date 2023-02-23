"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __accessCheck = (obj, member, msg) => {
  if (!member.has(obj))
    throw TypeError("Cannot " + msg);
};
var __privateGet = (obj, member, getter) => {
  __accessCheck(obj, member, "read from private field");
  return getter ? getter.call(obj) : member.get(obj);
};
var __privateAdd = (obj, member, value) => {
  if (member.has(obj))
    throw TypeError("Cannot add the same private member more than once");
  member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
};
var __privateSet = (obj, member, value, setter) => {
  __accessCheck(obj, member, "write to private field");
  setter ? setter.call(obj, value) : member.set(obj, value);
  return value;
};
var __privateMethod = (obj, member, method) => {
  __accessCheck(obj, member, "access private method");
  return method;
};

// src/index.ts
var src_exports = {};
__export(src_exports, {
  AuthenticationError: () => AuthenticationError,
  AuthorizationError: () => AuthorizationError,
  Client: () => Client,
  ClientError: () => ClientError,
  NetworkError: () => NetworkError,
  ProtocolError: () => ProtocolError,
  QueryCheckError: () => QueryCheckError,
  QueryRuntimeError: () => QueryRuntimeError,
  QueryTimeoutError: () => QueryTimeoutError,
  ServiceError: () => ServiceError,
  ServiceInternalError: () => ServiceInternalError,
  ServiceTimeoutError: () => ServiceTimeoutError,
  ThrottlingError: () => ThrottlingError,
  endpoints: () => endpoints,
  fql: () => fql
});
module.exports = __toCommonJS(src_exports);

// src/client-configuration.ts
var endpoints = {
  cloud: new URL("https://db.fauna.com"),
  preview: new URL("https://db.fauna-preview.com"),
  local: new URL("http://localhost:8443"),
  localhost: new URL("http://localhost:8443")
};

// src/wire-protocol.ts
var isQuerySuccess = (res) => res instanceof Object && "data" in res;
var isQueryFailure = (res) => res instanceof Object && "error" in res && res.error instanceof Object && "code" in res.error && "message" in res.error;
var ServiceError = class extends Error {
  httpStatus;
  code;
  summary;
  constructor(failure, httpStatus) {
    super(failure.error.message);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ServiceError);
    }
    this.name = "ServiceError";
    this.code = failure.error.code;
    this.httpStatus = httpStatus;
    if (failure.summary) {
      this.summary = failure.summary;
    }
  }
};
var QueryRuntimeError = class extends ServiceError {
  constructor(failure, httpStatus) {
    super(failure, httpStatus);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, QueryRuntimeError);
    }
    this.name = "QueryRuntimeError";
  }
};
var QueryCheckError = class extends ServiceError {
  constructor(failure, httpStatus) {
    super(failure, httpStatus);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, QueryCheckError);
    }
    this.name = "QueryCheckError";
  }
};
var QueryTimeoutError = class extends ServiceError {
  stats;
  constructor(failure, httpStatus) {
    super(failure, httpStatus);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, QueryTimeoutError);
    }
    this.name = "QueryTimeoutError";
    this.stats = failure.stats;
  }
};
var AuthenticationError = class extends ServiceError {
  constructor(failure, httpStatus) {
    super(failure, httpStatus);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AuthenticationError);
    }
    this.name = "AuthenticationError";
  }
};
var AuthorizationError = class extends ServiceError {
  constructor(failure, httpStatus) {
    super(failure, httpStatus);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AuthorizationError);
    }
    this.name = "AuthorizationError";
  }
};
var ThrottlingError = class extends ServiceError {
  constructor(failure, httpStatus) {
    super(failure, httpStatus);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ThrottlingError);
    }
    this.name = "ThrottlingError";
  }
};
var ServiceInternalError = class extends ServiceError {
  constructor(failure, httpStatus) {
    super(failure, httpStatus);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ServiceInternalError);
    }
    this.name = "ServiceInternalError";
  }
};
var ServiceTimeoutError = class extends ServiceError {
  constructor(failure, httpStatus) {
    super(failure, httpStatus);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ServiceTimeoutError);
    }
    this.name = "ServiceTimeoutError";
  }
};
var ClientError = class extends Error {
  constructor(message, options) {
    super(message, options);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ClientError);
    }
    this.name = "ClientError";
  }
};
var NetworkError = class extends Error {
  constructor(message, options) {
    super(message, options);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NetworkError);
    }
    this.name = "NetworkError";
  }
};
var ProtocolError = class extends Error {
  httpStatus;
  constructor(error) {
    super(error.message);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ProtocolError);
    }
    this.name = "ProtocolError";
    this.httpStatus = error.httpStatus;
  }
};

// src/http-client/fetch-client.ts
var FetchClient = class {
  async request({
    data,
    headers: requestHeaders,
    method,
    url
  }) {
    const response = await fetch(url, {
      method,
      headers: { ...requestHeaders, "Content-Type": "application/json" },
      body: JSON.stringify(data)
    }).catch((error) => {
      throw new NetworkError("The network connection encountered a problem.", {
        cause: error
      });
    });
    const status = response.status;
    const responseHeaders = {};
    response.headers.forEach((value, key) => responseHeaders[key] = value);
    const body = await response.text();
    return {
      status,
      body,
      headers: responseHeaders
    };
  }
};

// src/http-client/index.ts
var getDefaultHTTPClient = () => {
  return new FetchClient();
};
var isHTTPResponse = (res) => res instanceof Object && "body" in res && "headers" in res && "status" in res;

// src/client.ts
var defaultClientConfiguration = {
  max_conns: 10,
  endpoint: endpoints.cloud,
  timeout_ms: 6e4
};
var Client = class {
  #clientConfiguration;
  #httpClient;
  #lastTxn;
  constructor(clientConfiguration, client) {
    this.#clientConfiguration = {
      ...defaultClientConfiguration,
      ...clientConfiguration,
      secret: this.#getSecret(clientConfiguration)
    };
    if (!client) {
      this.#httpClient = getDefaultHTTPClient();
    } else {
      this.#httpClient = client;
    }
  }
  get lastTxnTime() {
    return this.#lastTxn;
  }
  set lastTxnTime(time) {
    if (this.lastTxnTime !== void 0 && time.getTime() < this.lastTxnTime.getTime()) {
      throw new Error("Must be greater than current value");
    }
    this.#lastTxn = time;
  }
  get clientConfiguration() {
    const { secret, ...rest } = this.#clientConfiguration;
    return rest;
  }
  async query(request, headers) {
    if ("query" in request) {
      return this.#query({ ...request, ...headers });
    }
    return this.#query(request.toQuery(headers));
  }
  #getError(e) {
    if (e instanceof ClientError || e instanceof NetworkError || e instanceof ProtocolError || e instanceof ServiceError) {
      return e;
    }
    if (isHTTPResponse(e)) {
      if (isQueryFailure(e.body)) {
        const failure = e.body;
        const status = e.status;
        return this.#getServiceError(failure, status);
      }
      return new ProtocolError({
        message: `Response is in an unkown format: ${e.body}`,
        httpStatus: e.status
      });
    }
    return new ClientError(
      "A client level error occurred. Fauna was not called.",
      {
        cause: e
      }
    );
  }
  #getSecret(partialClientConfig) {
    let fallback = void 0;
    if (typeof process === "object") {
      fallback = process.env["FAUNA_SECRET"];
    }
    const maybeSecret = partialClientConfig?.secret || fallback;
    if (maybeSecret === void 0) {
      throw new Error(
        "You must provide a secret to the driver. Set it in an environmental variable named FAUNA_SECRET or pass it to the Client constructor."
      );
    }
    return maybeSecret;
  }
  #getServiceError(failure, httpStatus) {
    switch (httpStatus) {
      case 400:
        if (httpStatus === 400 && queryCheckFailureCodes.includes(failure.error.code)) {
          return new QueryCheckError(failure, httpStatus);
        }
        return new QueryRuntimeError(failure, httpStatus);
      case 401:
        return new AuthenticationError(failure, httpStatus);
      case 403:
        return new AuthorizationError(failure, httpStatus);
      case 429:
        return new ThrottlingError(failure, httpStatus);
      case 440:
        return new QueryTimeoutError(failure, httpStatus);
      case 500:
        return new ServiceInternalError(failure, httpStatus);
      case 503:
        return new ServiceTimeoutError(failure, httpStatus);
      default:
        return new ServiceError(failure, httpStatus);
    }
  }
  async #query(queryRequest) {
    try {
      const url = `${this.clientConfiguration.endpoint.toString()}query/1`;
      const headers = {
        Authorization: `Bearer ${this.#clientConfiguration.secret}`,
        "x-typecheck": "false",
        "x-format": "simple"
      };
      this.#setHeaders(
        { ...this.clientConfiguration, ...queryRequest },
        headers
      );
      const requestData = {
        query: queryRequest.query,
        arguments: queryRequest.arguments
      };
      const fetchResponse = await this.#httpClient.request({
        url,
        method: "POST",
        headers,
        data: requestData
      });
      let parsedResponse;
      try {
        parsedResponse = {
          ...fetchResponse,
          body: JSON.parse(fetchResponse.body)
        };
      } catch (error) {
        throw new ProtocolError({
          message: `Error parsing response as JSON: ${error}`,
          httpStatus: fetchResponse.status
        });
      }
      if (!isQuerySuccess(parsedResponse.body)) {
        throw this.#getError(parsedResponse);
      }
      const txn_time = parsedResponse.body.txn_time;
      const txnDate = new Date(txn_time);
      if (this.#lastTxn === void 0 && txn_time !== void 0 || txn_time !== void 0 && this.#lastTxn !== void 0 && this.#lastTxn < txnDate) {
        this.#lastTxn = txnDate;
      }
      return parsedResponse.body;
    } catch (e) {
      throw this.#getError(e);
    }
  }
  #setHeaders(fromObject, headerObject) {
    for (const entry of Object.entries(fromObject)) {
      if ([
        "last_txn",
        "timeout_ms",
        "linearized",
        "max_contention_retries",
        "traceparent",
        "tags"
      ].includes(entry[0])) {
        let headerValue;
        let headerKey = `x-${entry[0].replaceAll("_", "-")}`;
        if ("tags" === entry[0]) {
          headerKey = "x-fauna-tags";
          headerValue = Object.entries(entry[1]).map((tag) => tag.join("=")).join(",");
        } else {
          if (typeof entry[1] === "string") {
            headerValue = entry[1];
          } else {
            headerValue = String(entry[1]);
          }
        }
        if ("traceparent" === entry[0]) {
          headerKey = entry[0];
        }
        headerObject[headerKey] = headerValue;
      }
    }
    if (headerObject["x-last-txn"] === void 0 && this.#lastTxn !== void 0) {
      headerObject["x-last-txn"] = this.#lastTxn.toISOString();
    }
  }
};
var queryCheckFailureCodes = [
  "invalid_function_definition",
  "invalid_identifier",
  "invalid_query",
  "invalid_syntax",
  "invalid_type"
];

// src/query-builder.ts
function fql(queryFragments, ...queryArgs) {
  return QueryBuilderImpl.create(queryFragments, ...queryArgs);
}
var _queryInterpolation, _buildersFromArgs, buildersFromArgs_fn, _render, render_fn;
var _QueryBuilderImpl = class {
  constructor(queryInterpolation) {
    __privateAdd(this, _render);
    __privateAdd(this, _queryInterpolation, void 0);
    var _a;
    if ("queryFragments" in queryInterpolation) {
      if (queryInterpolation.queryFragments.length === 0 || queryInterpolation.queryFragments.length !== queryInterpolation.queryArgs.length + 1) {
        throw new Error("invalid query constructed");
      }
      __privateSet(this, _queryInterpolation, {
        ...queryInterpolation,
        queryArgs: __privateMethod(_a = _QueryBuilderImpl, _buildersFromArgs, buildersFromArgs_fn).call(_a, queryInterpolation.queryArgs)
      });
    } else {
      __privateSet(this, _queryInterpolation, queryInterpolation);
    }
  }
  static create(queryFragments, ...queryArgs) {
    var _a;
    return new _QueryBuilderImpl({
      queryFragments,
      queryArgs: __privateMethod(_a = _QueryBuilderImpl, _buildersFromArgs, buildersFromArgs_fn).call(_a, queryArgs)
    });
  }
  toQuery(requestHeaders = {}, initialArgNumber = 0) {
    return { ...__privateMethod(this, _render, render_fn).call(this, initialArgNumber), ...requestHeaders };
  }
};
var QueryBuilderImpl = _QueryBuilderImpl;
_queryInterpolation = new WeakMap();
_buildersFromArgs = new WeakSet();
buildersFromArgs_fn = function(queryArgs) {
  return queryArgs.map((queryArg) => {
    if (typeof queryArg?.toQuery === "function") {
      return queryArg;
    }
    return new _QueryBuilderImpl({ json: queryArg });
  });
};
_render = new WeakSet();
render_fn = function(nextArg = 0) {
  if ("queryFragments" in __privateGet(this, _queryInterpolation)) {
    const { queryFragments, queryArgs: localArgs } = __privateGet(this, _queryInterpolation);
    const queryFragment = queryFragments[0];
    if (queryFragment === void 0) {
      throw new Error("Internal error!");
    }
    const renderedQuery = [queryFragment];
    let args = {};
    localArgs.forEach((arg, i) => {
      const { query: argQuery, arguments: argArguments } = arg.toQuery(
        {},
        nextArg
      );
      if (argArguments !== void 0) {
        nextArg += Object.keys(argArguments).length;
      }
      const queryFragment2 = queryFragments[i + 1];
      if (queryFragment2 === void 0) {
        throw new Error("Internal error!");
      }
      renderedQuery.push(argQuery, queryFragment2);
      args = { ...args, ...argArguments };
    });
    return { query: renderedQuery.join(""), arguments: args };
  } else {
    const argName = `arg${nextArg}`;
    const args = {};
    args[argName] = __privateGet(this, _queryInterpolation).json;
    return {
      query: `${argName}`,
      arguments: args
    };
  }
};
__privateAdd(QueryBuilderImpl, _buildersFromArgs);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AuthenticationError,
  AuthorizationError,
  Client,
  ClientError,
  NetworkError,
  ProtocolError,
  QueryCheckError,
  QueryRuntimeError,
  QueryTimeoutError,
  ServiceError,
  ServiceInternalError,
  ServiceTimeoutError,
  ThrottlingError,
  endpoints,
  fql
});
//# sourceMappingURL=index.js.map
