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

// src/errors.ts
var FaunaError = class extends Error {
  constructor(...args) {
    super(...args);
  }
};
var ServiceError = class extends FaunaError {
  httpStatus;
  code;
  summary;
  constraint_failures;
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
    if (failure.error.constraint_failures !== void 0) {
      this.constraint_failures = failure.error.constraint_failures;
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
var ClientError = class extends FaunaError {
  constructor(message, options) {
    super(message, options);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ClientError);
    }
    this.name = "ClientError";
  }
};
var NetworkError = class extends FaunaError {
  constructor(message, options) {
    super(message, options);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NetworkError);
    }
    this.name = "NetworkError";
  }
};
var ProtocolError = class extends FaunaError {
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

// src/wire-protocol.ts
var isQuerySuccess = (res) => res instanceof Object && "data" in res;
var isQueryFailure = (res) => res instanceof Object && "error" in res && res.error instanceof Object && "code" in res.error && "message" in res.error;

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

// src/regex.ts
var yearpart = /(?:\d{4}|[\u2212-]\d{4,}|\+\d{5,})/;
var monthpart = /(?:0[1-9]|1[0-2])/;
var daypart = /(?:0[1-9]|[12]\d|3[01])/;
var hourpart = /(?:[01][0-9]|2[0-3])/;
var minsecpart = /(?:[0-5][0-9])/;
var decimalpart = /(?:\.\d+)/;
var datesplit = new RegExp(
  `(${yearpart.source}-(${monthpart.source})-(${daypart.source}))`
);
var timesplit = new RegExp(
  `(${hourpart.source}:${minsecpart.source}:${minsecpart.source}${decimalpart.source}?)`
);
var zonesplit = new RegExp(
  `([zZ]|[+\u2212-]${hourpart.source}(?::?${minsecpart.source}|:${minsecpart.source}:${minsecpart.source}))`
);
var plaindate = new RegExp(`^${datesplit.source}$`);
var startsWithPlaindate = new RegExp(`^${datesplit.source}`);
var datetime = new RegExp(
  `^${datesplit.source}T${timesplit.source}${zonesplit.source}$`
);

// src/values/date-time.ts
var TimeStub = class {
  isoString;
  constructor(isoString) {
    this.isoString = isoString;
  }
  static from(isoString) {
    if (typeof isoString !== "string") {
      throw new TypeError(
        `Expected string but received ${typeof isoString}: ${isoString}`
      );
    }
    const matches = datetime.exec(isoString);
    if (matches === null) {
      throw new RangeError(
        `(regex) Expected an ISO date string but received '${isoString}'`
      );
    }
    return new TimeStub(isoString);
  }
  static fromDate(date) {
    return new TimeStub(date.toISOString());
  }
  toDate() {
    const date = new Date(this.isoString);
    if (date.toString() === "Invalid Date") {
      throw new RangeError(
        "Fauna Date could not be converted to Javascript Date"
      );
    }
    return date;
  }
  toString() {
    return `TimeStub("${this.isoString}")`;
  }
};
var DateStub = class {
  dateString;
  constructor(dateString) {
    this.dateString = dateString;
  }
  static from(dateString) {
    if (typeof dateString !== "string") {
      throw new TypeError(
        `Expected string but received ${typeof dateString}: ${dateString}`
      );
    }
    const matches = plaindate.exec(dateString);
    if (matches === null) {
      throw new RangeError(
        `Expected a plain date string but received '${dateString}'`
      );
    }
    return new DateStub(matches[0]);
  }
  static fromDate(date) {
    const dateString = date.toISOString();
    const matches = startsWithPlaindate.exec(dateString);
    if (matches === null) {
      throw new ClientError(`Failed to parse date '${date}'`);
    }
    return new DateStub(matches[0]);
  }
  toDate() {
    const date = new Date(this.dateString + "T00:00:00Z");
    if (date.toString() === "Invalid Date") {
      throw new RangeError(
        "Fauna Date could not be converted to Javascript Date"
      );
    }
    return date;
  }
  toString() {
    return `DateStub("${this.dateString}")`;
  }
};

// src/values/doc.ts
var DocumentReference = class {
  coll;
  id;
  constructor({ coll, id }) {
    this.id = id;
    if (typeof coll === "string") {
      this.coll = new Module(coll);
    } else {
      this.coll = coll;
    }
  }
};
var Document = class extends DocumentReference {
  ts;
  constructor(obj) {
    const { coll, id, ts, ...rest } = obj;
    super({ coll, id });
    this.ts = ts;
    Object.assign(this, rest);
  }
  toObject() {
    return { ...this };
  }
};
var NamedDocumentReference = class {
  coll;
  name;
  constructor({ coll, name }) {
    this.name = name;
    if (typeof coll === "string") {
      this.coll = new Module(coll);
    } else {
      this.coll = coll;
    }
  }
};
var NamedDocument = class extends NamedDocumentReference {
  ts;
  data;
  constructor(obj) {
    const { coll, name, ts, data, ...rest } = obj;
    super({ coll, name });
    this.ts = ts;
    this.data = data || {};
    Object.assign(this, rest);
  }
  toObject() {
    return { ...this };
  }
};
var Module = class {
  name;
  constructor(name) {
    this.name = name;
  }
};

// src/values/set.ts
var Set = class {
  data;
  after;
  constructor({ data, after }) {
    this.data = data;
    this.after = after;
  }
};

// src/tagged-type.ts
var TaggedTypeFormat = class {
  static encode(obj) {
    return encode(obj);
  }
  static decode(input) {
    return JSON.parse(input, (_, value) => {
      if (value == null)
        return null;
      if (value["@mod"]) {
        return new Module(value["@mod"]);
      } else if (value["@doc"]) {
        if (typeof value["@doc"] === "string") {
          const [modName, id] = value["@doc"].split(":");
          return new DocumentReference({ coll: modName, id });
        }
        const obj = value["@doc"];
        if (obj.id) {
          return new Document(obj);
        } else {
          return new NamedDocument(obj);
        }
      } else if (value["@ref"]) {
        const obj = value["@ref"];
        if (obj.id) {
          return new DocumentReference(obj);
        } else {
          return new NamedDocumentReference(obj);
        }
      } else if (value["@set"]) {
        return new Set(value["@set"]);
      } else if (value["@int"]) {
        return Number(value["@int"]);
      } else if (value["@long"]) {
        return BigInt(value["@long"]);
      } else if (value["@double"]) {
        return Number(value["@double"]);
      } else if (value["@date"]) {
        return DateStub.from(value["@date"]);
      } else if (value["@time"]) {
        return TimeStub.from(value["@time"]);
      } else if (value["@object"]) {
        return value["@object"];
      }
      return value;
    });
  }
};
var LONG_MIN = BigInt("-9223372036854775808");
var LONG_MAX = BigInt("9223372036854775807");
var encodeMap = {
  bigint: (value) => {
    if (value < LONG_MIN || value > LONG_MAX) {
      throw new RangeError(
        "Precision loss when converting BigInt to Fauna type"
      );
    }
    return {
      "@long": value.toString()
    };
  },
  number: (value) => {
    if (value === Number.POSITIVE_INFINITY || value === Number.NEGATIVE_INFINITY) {
      throw new RangeError(`Cannot convert ${value} to a Fauna type.`);
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
      _out[k] = encode(input[k]);
    }
    return wrapped ? { "@object": _out } : _out;
  },
  array: (input) => {
    const _out = [];
    for (const i in input)
      _out.push(encode(input[i]));
    return _out;
  },
  date: (dateValue) => ({
    "@time": dateValue.toISOString()
  }),
  faunadate: (value) => ({ "@date": value.dateString }),
  faunatime: (value) => ({ "@time": value.isoString }),
  module: (value) => ({ "@mod": value.name }),
  documentReference: (value) => ({
    "@ref": { id: value.id, coll: { "@mod": value.coll.name } }
  }),
  document: (value) => ({
    "@ref": { id: value.id, coll: { "@mod": value.coll.name } }
  }),
  namedDocumentReference: (value) => ({
    "@ref": { name: value.name, coll: { "@mod": value.coll.name } }
  }),
  namedDocument: (value) => ({
    "@ref": { name: value.name, coll: { "@mod": value.coll.name } }
  }),
  set: (value) => ({
    "@set": { data: encodeMap["array"](value.data), after: value.after }
  })
};
var encode = (input) => {
  switch (typeof input) {
    case "bigint":
      return encodeMap["bigint"](input);
    case "string":
      return encodeMap["string"](input);
    case "number":
      return encodeMap["number"](input);
    case "object":
      if (input == null) {
        return null;
      } else if (Array.isArray(input)) {
        return encodeMap["array"](input);
      } else if (input instanceof Date) {
        return encodeMap["date"](input);
      } else if (input instanceof DateStub) {
        return encodeMap["faunadate"](input);
      } else if (input instanceof TimeStub) {
        return encodeMap["faunatime"](input);
      } else if (input instanceof Module) {
        return encodeMap["module"](input);
      } else if (input instanceof DocumentReference) {
        return encodeMap["documentReference"](input);
      } else if (input instanceof Document) {
        return encodeMap["document"](input);
      } else if (input instanceof NamedDocumentReference) {
        return encodeMap["namedDocumentReference"](input);
      } else if (input instanceof NamedDocument) {
        return encodeMap["namedDocument"](input);
      } else if (input instanceof Set) {
        return encodeMap["set"](input);
      } else {
        return encodeMap["object"](input);
      }
      break;
  }
  return input;
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
    this.#lastTxnTs = this.#lastTxnTs ? Math.max(ts, this.#lastTxnTs) : ts;
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
        Authorization: `Bearer ${this.#clientConfiguration.secret}`
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
        if (parsedResponse.body.query_tags) {
          const tags_array = parsedResponse.body.query_tags.split(",").map((tag) => tag.split("="));
          parsedResponse.body.query_tags = Object.fromEntries(tags_array);
        }
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
        "query_timeout_ms",
        "linearized",
        "max_contention_retries",
        "traceparent",
        "typecheck",
        "query_tags"
      ].includes(entry[0])) {
        let headerValue;
        let headerKey = `x-${entry[0].replaceAll("_", "-")}`;
        if ("query_tags" === entry[0]) {
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
