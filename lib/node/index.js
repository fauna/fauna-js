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

// src/tagged-type.ts
var TaggedTypeFormat = class {
  static encode(obj) {
    return new TaggedTypeEncoded(obj).result;
  }
  static decode(input) {
    return JSON.parse(input, (_, value) => {
      if (value == null)
        return null;
      if (value["@mod"]) {
        return value["@mod"];
      } else if (value["@doc"]) {
        return value["@doc"];
      } else if (value["@int"]) {
        return Number(value["@int"]);
      } else if (value["@long"]) {
        return BigInt(value["@long"]);
      } else if (value["@double"]) {
        return Number(value["@double"]);
      } else if (value["@date"]) {
        return new Date(value["@date"] + "T00:00:00.000Z");
      } else if (value["@time"]) {
        return new Date(value["@time"]);
      } else if (value["@object"]) {
        return value["@object"];
      }
      return value;
    });
  }
};
var LONG_MIN = BigInt("-9223372036854775808");
var LONG_MAX = BigInt("9223372036854775807");
var TaggedTypeEncoded = class {
  result;
  #encodeMap = {
    bigint: (value) => {
      if (value < LONG_MIN || value > LONG_MAX) {
        throw new TypeError(
          "Precision loss when converting BigInt to Fauna type"
        );
      }
      return {
        "@long": value.toString()
      };
    },
    number: (value) => {
      if (value === Number.POSITIVE_INFINITY || value === Number.NEGATIVE_INFINITY) {
        throw new TypeError(`Cannot convert ${value} to a Fauna type`);
      }
      if (`${value}`.includes(".")) {
        return { "@double": value.toString() };
      } else {
        if (value >= -(2 ** 31) && value <= 2 ** 31 - 1) {
          return { "@int": value.toString() };
        } else if (Number.isSafeInteger(value)) {
          return {
            "@long": value.toString()
          };
        }
        return { "@double": value.toString() };
      }
    },
    string: (value) => {
      return value;
    },
    object: (input) => {
      let wrapped = false;
      const _out = {};
      for (const k in input) {
        if (k.startsWith("@")) {
          wrapped = true;
        }
        _out[k] = TaggedTypeFormat.encode(input[k]);
      }
      return wrapped ? { "@object": _out } : _out;
    },
    array: (input) => {
      const _out = [];
      for (const i in input)
        _out.push(TaggedTypeFormat.encode(input[i]));
      return _out;
    },
    date: (dateValue) => {
      if (dateValue.getUTCHours() == 0 && dateValue.getUTCMinutes() == 0 && dateValue.getUTCSeconds() == 0 && dateValue.getUTCMilliseconds() == 0) {
        return { "@date": dateValue.toISOString().split("T")[0] };
      }
      return { "@time": dateValue.toISOString() };
    }
  };
  constructor(input) {
    this.result = input;
    switch (typeof input) {
      case "bigint":
        this.result = this.#encodeMap["bigint"](input);
        break;
      case "string":
        this.result = this.#encodeMap["string"](input);
        break;
      case "number":
        this.result = this.#encodeMap["number"](input);
        break;
      case "object":
        if (input == null) {
          this.result = null;
        } else if (Array.isArray(input)) {
          this.result = this.#encodeMap["array"](input);
        } else if (input instanceof Date) {
          this.result = this.#encodeMap["date"](input);
        } else {
          this.result = this.#encodeMap["object"](input);
        }
        break;
    }
  }
};

// src/client.ts
var defaultClientConfiguration = {
  endpoint: endpoints.cloud,
  max_conns: 10
};
var Client = class {
  #clientConfiguration;
  #httpClient;
  #lastTxnTs;
  #url;
  constructor(clientConfiguration, httpClient) {
    this.#clientConfiguration = {
      ...defaultClientConfiguration,
      ...clientConfiguration,
      secret: this.#getSecret(clientConfiguration)
    };
    this.#url = `${this.clientConfiguration.endpoint.toString()}query/1`;
    if (!httpClient) {
      this.#httpClient = getDefaultHTTPClient();
    } else {
      this.#httpClient = httpClient;
    }
  }
  get lastTxnTs() {
    return this.#lastTxnTs;
  }
  set lastTxnTs(ts) {
    if (this.lastTxnTs !== void 0 && ts < this.lastTxnTs) {
      throw new Error("Must be greater than current value");
    }
    this.#lastTxnTs = ts;
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
      const headers = {
        Authorization: `Bearer ${this.#clientConfiguration.secret}`,
        "x-typecheck": "false"
      };
      this.#setHeaders(
        { ...this.clientConfiguration, ...queryRequest },
        headers
      );
      const isTaggedFormat = (this.#clientConfiguration.format ?? "tagged") === "tagged" || queryRequest.format === "tagged";
      const queryArgs = isTaggedFormat ? TaggedTypeFormat.encode(queryRequest.arguments) : queryRequest.arguments;
      const requestData = {
        query: queryRequest.query,
        arguments: queryArgs
      };
      const fetchResponse = await this.#httpClient.request({
        url: this.#url,
        method: "POST",
        headers,
        data: requestData
      });
      let parsedResponse;
      try {
        parsedResponse = {
          ...fetchResponse,
          body: isTaggedFormat ? TaggedTypeFormat.decode(fetchResponse.body) : JSON.parse(fetchResponse.body)
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
      const txn_ts = parsedResponse.body.txn_ts;
      if (this.#lastTxnTs === void 0 && txn_ts !== void 0 || txn_ts !== void 0 && this.#lastTxnTs !== void 0 && this.#lastTxnTs < txn_ts) {
        this.#lastTxnTs = txn_ts;
      }
      return parsedResponse.body;
    } catch (e) {
      throw this.#getError(e);
    }
  }
  #setHeaders(fromObject, headerObject) {
    for (const entry of Object.entries(fromObject)) {
      if ([
        "format",
        "last_txn_ts",
        "query_timeout_ms",
        "linearized",
        "max_contention_retries",
        "traceparent",
        "query_tags"
      ].includes(entry[0])) {
        let headerValue;
        let headerKey = `x-${entry[0].replaceAll("_", "-")}`;
        if ("query_tags" === entry[0]) {
          headerValue = Object.entries(entry[1]).map((tag) => tag.join("=")).join(",");
        } else if ("last_txn_ts" === entry[0]) {
          headerValue = entry[1];
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
    if (headerObject["x-last-txn-ts"] === void 0 && this.#lastTxnTs !== void 0) {
      headerObject["x-last-txn-ts"] = this.#lastTxnTs;
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
var isQueryBuilder = (obj) => obj instanceof Object && typeof obj.toQuery === "function";
function fql(queryFragments, ...queryArgs) {
  return new TemplateQueryBuilder(queryFragments, ...queryArgs);
}
var TemplateQueryBuilder = class {
  #queryFragments;
  #queryArgs;
  constructor(queryFragments, ...queryArgs) {
    if (queryFragments.length === 0 || queryFragments.length !== queryArgs.length + 1) {
      throw new Error("invalid query constructed");
    }
    this.#queryFragments = queryFragments;
    this.#queryArgs = queryArgs;
  }
  toQuery(requestHeaders = {}) {
    return { ...this.#render(requestHeaders), ...requestHeaders };
  }
  #render(requestHeaders) {
    if (this.#queryFragments.length === 1) {
      return { query: { fql: [this.#queryFragments[0]] }, arguments: {} };
    }
    let resultArgs = {};
    const renderedFragments = this.#queryFragments.flatMap((fragment, i) => {
      if (i === this.#queryFragments.length - 1) {
        return fragment === "" ? [] : [fragment];
      }
      const arg = this.#queryArgs[i];
      let subQuery;
      if (isQueryBuilder(arg)) {
        const request = arg.toQuery(requestHeaders);
        subQuery = request.query;
        resultArgs = { ...resultArgs, ...request.arguments };
      } else {
        subQuery = { value: TaggedTypeFormat.encode(arg) };
      }
      return [fragment, subQuery].filter((x) => x !== "");
    });
    return {
      query: { fql: renderedFragments },
      arguments: resultArgs
    };
  }
};
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
