var J = (n, e, r) => {
  if (!e.has(n)) throw TypeError("Cannot " + r);
};
var a = (n, e, r) => (
    J(n, e, "read from private field"), r ? r.call(n) : e.get(n)
  ),
  u = (n, e, r) => {
    if (e.has(n))
      throw TypeError("Cannot add the same private member more than once");
    e instanceof WeakSet ? e.add(n) : e.set(n, r);
  },
  k = (n, e, r, t) => (
    J(n, e, "write to private field"), t ? t.call(n, r) : e.set(n, r), r
  );
var i = (n, e, r) => (J(n, e, "access private method"), r);
var I = {
  cloud: new URL("https://db.fauna.com"),
  preview: new URL("https://db.fauna-preview.com"),
  local: new URL("http://localhost:8443"),
  localhost: new URL("http://localhost:8443"),
};
var M = async (n, e) => {
  let r = await fetch(n, e),
    t = r.status,
    o = await r.json();
  return { status: t, body: o };
};
var z = (n) => "error" in n,
  s = class extends Error {
    constructor(r, t) {
      super(t.error.message);
      Error.captureStackTrace && Error.captureStackTrace(this, s),
        (this.name = "ServiceError"),
        (this.code = t.error.code),
        (this.httpStatus = r),
        t.summary && (this.summary = t.summary);
    }
  },
  m = class extends s {
    constructor(e, r) {
      super(e, r),
        Error.captureStackTrace && Error.captureStackTrace(this, m),
        (this.name = "QueryRuntimeError");
    }
  },
  d = class extends s {
    constructor(e, r) {
      super(e, r),
        Error.captureStackTrace && Error.captureStackTrace(this, d),
        (this.name = "QueryCheckError");
    }
  },
  f = class extends s {
    constructor(r, t) {
      super(r, t);
      Error.captureStackTrace && Error.captureStackTrace(this, f),
        (this.name = "QueryTimeoutError"),
        (this.stats = t.stats);
    }
  },
  g = class extends s {
    constructor(e, r) {
      super(e, r),
        Error.captureStackTrace && Error.captureStackTrace(this, g),
        (this.name = "AuthenticationError");
    }
  },
  h = class extends s {
    constructor(e, r) {
      super(e, r),
        Error.captureStackTrace && Error.captureStackTrace(this, h),
        (this.name = "AuthorizationError");
    }
  },
  E = class extends s {
    constructor(e, r) {
      super(e, r),
        Error.captureStackTrace && Error.captureStackTrace(this, E),
        (this.name = "ThrottlingError");
    }
  },
  T = class extends s {
    constructor(e, r) {
      super(e, r),
        Error.captureStackTrace && Error.captureStackTrace(this, T),
        (this.name = "ServiceInternalError");
    }
  },
  S = class extends s {
    constructor(e, r) {
      super(e, r),
        Error.captureStackTrace && Error.captureStackTrace(this, S),
        (this.name = "ServiceTimeoutError");
    }
  },
  Q = class extends Error {
    constructor(e, r) {
      super(e, r),
        Error.captureStackTrace && Error.captureStackTrace(this, Q),
        (this.name = "ClientError");
    }
  },
  R = class extends Error {
    constructor(e, r) {
      super(e, r),
        Error.captureStackTrace && Error.captureStackTrace(this, R),
        (this.name = "NetworkError");
    }
  },
  x = class extends Error {
    constructor(r) {
      super(r.message);
      Error.captureStackTrace && Error.captureStackTrace(this, x),
        (this.name = "ProtocolError"),
        (this.httpStatus = r.httpStatus);
    }
  };
var G = { max_conns: 10, endpoint: I.cloud, timeout_ms: 6e4, fetch: M },
  y,
  C,
  $,
  q,
  j,
  A,
  K,
  O,
  V,
  v,
  W,
  L = class {
    constructor(e) {
      u(this, C);
      u(this, q);
      u(this, A);
      u(this, O);
      u(this, v);
      u(this, y, void 0);
      this.clientConfiguration = {
        ...G,
        ...e,
        secret: i(this, C, $).call(this, e),
      };
    }
    async query(e, r) {
      return "query" in e
        ? i(this, q, j).call(this, { ...e, ...r })
        : i(this, q, j).call(this, e.toQuery(r));
    }
  };
(y = new WeakMap()),
  (C = new WeakSet()),
  ($ = function (e) {
    let r;
    typeof process == "object" && (r = process.env.FAUNA_SECRET);
    let t = e?.secret || r;
    if (t === void 0)
      throw new Error(
        "You must provide a secret to the driver. Set it in an environmental variable named FAUNA_SECRET or pass it to the Client constructor."
      );
    return t;
  }),
  (q = new WeakSet()),
  (j = async function (e) {
    let { query: r, arguments: t } = e;
    try {
      let o = `${this.clientConfiguration.endpoint.toString()}query/1`,
        c = {
          Authorization: `Bearer ${this.clientConfiguration.secret}`,
          "Content-Type": "application/json",
        };
      i(this, v, W).call(this, this.clientConfiguration, c);
      let p = await this.clientConfiguration.fetch(o, {
          method: "POST",
          headers: c,
          body: JSON.stringify({
            query: r,
            arguments: t,
            typecheck: !1,
            format: "simple",
          }),
          keepalive: !0,
        }),
        F = p.body;
      if (z(F)) throw i(this, O, V).call(this, p.status, F);
      let w = F.txn_time,
        N = new Date(w);
      return (
        ((a(this, y) === void 0 && w !== void 0) ||
          (w !== void 0 && a(this, y) !== void 0 && a(this, y) < N)) &&
          k(this, y, N),
        F
      );
    } catch (o) {
      throw o instanceof s ? o : i(this, A, K).call(this, o);
    }
  }),
  (A = new WeakSet()),
  (K = function (e) {
    if (e.response) {
      if (e.response.data?.error) {
        let r = e.response.data.error;
        return (
          r.summary === void 0 &&
            e.response.data.summary !== void 0 &&
            (r.summary = e.response.data.summary),
          i(this, O, V).call(this, r, e.response.status)
        );
      }
      return new x({ message: e.message, httpStatus: e.response.status });
    }
    return e.request?.status === 0 ||
      e.request?.socket?.connecting ||
      Z.includes(e.code) ||
      e.message === "Network Error"
      ? new R("The network connection encountered a problem.", { cause: e })
      : new Q("A client level error occurred. Fauna was not called.", {
          cause: e,
        });
  }),
  (O = new WeakSet()),
  (V = function (e, r) {
    return e === 401
      ? new g(e, r)
      : e === 403
      ? new h(e, r)
      : e === 500
      ? new T(e, r)
      : e === 503
      ? new S(e, r)
      : e === 429
      ? new E(e, r)
      : e === 440
      ? new f(e, r)
      : e === 400 && X.includes(r.error.code)
      ? new d(e, r)
      : e === 400
      ? new m(e, r)
      : new s(e, r);
  }),
  (v = new WeakSet()),
  (W = function (e, r) {
    for (let t of Object.entries(e))
      if (
        [
          "last_txn",
          "timeout_ms",
          "linearized",
          "max_contention_retries",
          "traceparent",
          "tags",
        ].includes(t[0])
      ) {
        let o,
          c = `x-${t[0].replaceAll("_", "-")}`;
        t[0] === "tags"
          ? ((c = "x-fauna-tags"),
            (o = Object.entries(t[1])
              .map((p) => p.join("="))
              .join(",")))
          : typeof t[1] == "string"
          ? (o = t[1])
          : (o = String(t[1])),
          t[0] === "traceparent" && (c = t[0]),
          (r[c] = o);
      }
    r["x-last-txn"] === void 0 &&
      a(this, y) !== void 0 &&
      (r["x-last-txn"] = a(this, y).toISOString());
  });
var X = [
    "invalid_function_definition",
    "invalid_identifier",
    "invalid_query",
    "invalid_syntax",
    "invalid_type",
  ],
  Z = [
    "ECONNABORTED",
    "ECONNREFUSED",
    "ECONNRESET",
    "ERR_NETWORK",
    "ETIMEDOUT",
    "ERR_HTTP_REQUEST_TIMEOUT",
    "ERR_HTTP2_GOAWAY_SESSION",
    "ERR_HTTP2_INVALID_SESSION",
    "ERR_HTTP2_INVALID_STREAM",
    "ERR_HTTP2_OUT_OF_STREAMS",
    "ERR_HTTP2_SESSION_ERROR",
    "ERR_HTTP2_STREAM_CANCEL",
    "ERR_HTTP2_STREAM_ERROR",
  ];
function ee(n, ...e) {
  return U.create(n, ...e);
}
var l,
  _,
  B,
  H,
  Y,
  b = class {
    constructor(e) {
      u(this, H);
      u(this, l, void 0);
      var r;
      if ("queryFragments" in e) {
        if (
          e.queryFragments.length === 0 ||
          e.queryFragments.length !== e.queryArgs.length + 1
        )
          throw new Error("invalid query constructed");
        k(this, l, { ...e, queryArgs: i((r = b), _, B).call(r, e.queryArgs) });
      } else k(this, l, e);
    }
    static create(e, ...r) {
      var t;
      return new b({
        queryFragments: e,
        queryArgs: i((t = b), _, B).call(t, r),
      });
    }
    toQuery(e = {}, r = 0) {
      return { ...i(this, H, Y).call(this, r), ...e };
    }
  },
  U = b;
(l = new WeakMap()),
  (_ = new WeakSet()),
  (B = function (e) {
    return e.map((r) =>
      typeof r?.toQuery == "function" ? r : new b({ json: r })
    );
  }),
  (H = new WeakSet()),
  (Y = function (e = 0) {
    if ("queryFragments" in a(this, l)) {
      let { queryFragments: r, queryArgs: t } = a(this, l),
        o = r[0];
      if (o === void 0) throw new Error("Internal error!");
      let c = [o],
        p = {};
      return (
        t.forEach((F, w) => {
          let { query: N, arguments: P } = F.toQuery({}, e);
          P !== void 0 && (e += Object.keys(P).length);
          let D = r[w + 1];
          if (D === void 0) throw new Error("Internal error!");
          c.push(N, D), (p = { ...p, ...P });
        }),
        { query: c.join(""), arguments: p }
      );
    } else {
      let r = `arg${e}`,
        t = {};
      return (t[r] = a(this, l).json), { query: `${r}`, arguments: t };
    }
  }),
  u(U, _);
export {
  g as AuthenticationError,
  h as AuthorizationError,
  L as Client,
  Q as ClientError,
  R as NetworkError,
  x as ProtocolError,
  d as QueryCheckError,
  m as QueryRuntimeError,
  f as QueryTimeoutError,
  s as ServiceError,
  T as ServiceInternalError,
  S as ServiceTimeoutError,
  E as ThrottlingError,
  I as endpoints,
  ee as fql,
};
//# sourceMappingURL=index.js.map
