var _ = (t, e, r) => {
  if (!e.has(t)) throw TypeError("Cannot " + r);
};
var T = (t, e, r) => (
    _(t, e, "read from private field"), r ? r.call(t) : e.get(t)
  ),
  q = (t, e, r) => {
    if (e.has(t))
      throw TypeError("Cannot add the same private member more than once");
    e instanceof WeakSet ? e.add(t) : e.set(t, r);
  },
  J = (t, e, r, n) => (
    _(t, e, "write to private field"), n ? n.call(t, r) : e.set(t, r), r
  );
var O = (t, e, r) => (_(t, e, "access private method"), r);
var A = {
  cloud: new URL("https://db.fauna.com"),
  preview: new URL("https://db.fauna-preview.com"),
  local: new URL("http://localhost:8443"),
  localhost: new URL("http://localhost:8443"),
};
var H = (t) => t instanceof Object && "summary" in t,
  j = (t) => H(t) && "data" in t,
  C = (t) => H(t) && "error" in t,
  P = (t) => j(t) || C(t),
  c = class extends Error {
    constructor(...e) {
      super(...e);
    }
  },
  o = class extends c {
    httpStatus;
    code;
    summary;
    constructor(e, r) {
      super(e.error.message),
        Error.captureStackTrace && Error.captureStackTrace(this, o),
        (this.name = "ServiceError"),
        (this.code = e.error.code),
        (this.httpStatus = r),
        e.summary && (this.summary = e.summary);
    }
  },
  l = class extends o {
    constructor(e, r) {
      super(e, r),
        Error.captureStackTrace && Error.captureStackTrace(this, l),
        (this.name = "QueryRuntimeError");
    }
  },
  d = class extends o {
    constructor(e, r) {
      super(e, r),
        Error.captureStackTrace && Error.captureStackTrace(this, d),
        (this.name = "QueryCheckError");
    }
  },
  m = class extends o {
    stats;
    constructor(e, r) {
      super(e, r),
        Error.captureStackTrace && Error.captureStackTrace(this, m),
        (this.name = "QueryTimeoutError"),
        (this.stats = e.stats);
    }
  },
  h = class extends o {
    constructor(e, r) {
      super(e, r),
        Error.captureStackTrace && Error.captureStackTrace(this, h),
        (this.name = "AuthenticationError");
    }
  },
  g = class extends o {
    constructor(e, r) {
      super(e, r),
        Error.captureStackTrace && Error.captureStackTrace(this, g),
        (this.name = "AuthorizationError");
    }
  },
  f = class extends o {
    constructor(e, r) {
      super(e, r),
        Error.captureStackTrace && Error.captureStackTrace(this, f),
        (this.name = "ThrottlingError");
    }
  },
  Q = class extends o {
    constructor(e, r) {
      super(e, r),
        Error.captureStackTrace && Error.captureStackTrace(this, Q),
        (this.name = "ServiceInternalError");
    }
  },
  x = class extends o {
    constructor(e, r) {
      super(e, r),
        Error.captureStackTrace && Error.captureStackTrace(this, x),
        (this.name = "ServiceTimeoutError");
    }
  },
  S = class extends c {
    constructor(e, r) {
      super(e, r),
        Error.captureStackTrace && Error.captureStackTrace(this, S),
        (this.name = "ClientError");
    }
  },
  E = class extends c {
    constructor(e, r) {
      super(e, r),
        Error.captureStackTrace && Error.captureStackTrace(this, E),
        (this.name = "NetworkError");
    }
  },
  a = class extends c {
    httpStatus;
    constructor(e, r) {
      super(e),
        Error.captureStackTrace && Error.captureStackTrace(this, a),
        (this.name = "ProtocolError"),
        (this.httpStatus = r);
    }
  };
var D = (t) => "status" in t && "body" in t,
  U = async (t, e) => {
    let r = await fetch(t, e).catch((s) => {
        throw new E("The network connection encountered a problem.", {
          cause: s,
        });
      }),
      n = r.status,
      i = await r.json().catch((s) => {
        throw new a(
          "Error parsing response as JSON. Response: " + JSON.stringify(s),
          n
        );
      });
    return { status: n, body: i };
  };
var z = { max_conns: 10, endpoint: A.cloud, timeout_ms: 6e4, fetch: U },
  B = class {
    clientConfiguration;
    #e;
    constructor(e) {
      this.clientConfiguration = { ...z, ...e, secret: this.#s(e) };
    }
    async query(e, r) {
      return "query" in e ? this.#t({ ...e, ...r }) : this.#t(e.toQuery(r));
    }
    #r(e) {
      if (D(e)) {
        let r = e.body,
          n = e.status;
        if (C(r)) return this.#o(r, n);
        throw new a(
          "Response body is an unknown format: " + JSON.stringify(r),
          n
        );
      }
      return new S("A client level error occurred. Fauna was not called.", {
        cause: e,
      });
    }
    #s(e) {
      let r;
      typeof process == "object" && (r = process.env.FAUNA_SECRET);
      let n = e?.secret || r;
      if (n === void 0)
        throw new Error(
          "You must provide a secret to the driver. Set it in an environmental variable named FAUNA_SECRET or pass it to the Client constructor."
        );
      return n;
    }
    #o(e, r) {
      switch (r) {
        case 400:
          return r === 400 && $.includes(e.error.code)
            ? new d(e, r)
            : new l(e, r);
        case 401:
          return new h(e, r);
        case 403:
          return new g(e, r);
        case 429:
          return new f(e, r);
        case 440:
          return new m(e, r);
        case 500:
          return new Q(e, r);
        case 503:
          return new x(e, r);
        default:
          return new o(e, r);
      }
    }
    async #t(e) {
      let { query: r, arguments: n } = e,
        i = {};
      this.#n(e, i);
      try {
        let s = `${this.clientConfiguration.endpoint.toString()}query/1`,
          u = {
            Authorization: `Bearer ${this.clientConfiguration.secret}`,
            "Content-Type": "application/json",
            "x-typecheck": "false",
            "x-format": "simple",
          };
        this.#n(this.clientConfiguration, u);
        let w = await this.clientConfiguration.fetch(s, {
            method: "POST",
            headers: u,
            body: JSON.stringify({ query: r, arguments: n }),
            keepalive: !0,
          }),
          p = w.body;
        if (C(p) || !P(p)) throw this.#r(w);
        if (!j(p))
          throw new a(
            "Unknown response format: " + JSON.stringify(w),
            w.status
          );
        let R = p.txn_time,
          F = new Date(R);
        return (
          ((this.#e === void 0 && R !== void 0) ||
            (R !== void 0 && this.#e !== void 0 && this.#e < F)) &&
            (this.#e = F),
          p
        );
      } catch (s) {
        throw s instanceof c ? s : this.#r(s);
      }
    }
    #n(e, r) {
      for (let n of Object.entries(e))
        if (
          [
            "last_txn",
            "timeout_ms",
            "linearized",
            "max_contention_retries",
            "traceparent",
            "tags",
          ].includes(n[0])
        ) {
          let i,
            s = `x-${n[0].replaceAll("_", "-")}`;
          n[0] === "tags"
            ? ((s = "x-fauna-tags"),
              (i = Object.entries(n[1])
                .map((u) => u.join("="))
                .join(",")))
            : typeof n[1] == "string"
            ? (i = n[1])
            : (i = String(n[1])),
            n[0] === "traceparent" && (s = n[0]),
            (r[s] = i);
        }
      r["x-last-txn"] === void 0 &&
        this.#e !== void 0 &&
        (r["x-last-txn"] = this.#e.toISOString());
    }
  },
  $ = [
    "invalid_function_definition",
    "invalid_identifier",
    "invalid_query",
    "invalid_syntax",
    "invalid_type",
  ];
function K(t, ...e) {
  return N.create(t, ...e);
}
var y,
  k,
  L,
  v,
  I,
  b = class {
    constructor(e) {
      q(this, v);
      q(this, y, void 0);
      var r;
      if ("queryFragments" in e) {
        if (
          e.queryFragments.length === 0 ||
          e.queryFragments.length !== e.queryArgs.length + 1
        )
          throw new Error("invalid query constructed");
        J(this, y, { ...e, queryArgs: O((r = b), k, L).call(r, e.queryArgs) });
      } else J(this, y, e);
    }
    static create(e, ...r) {
      var n;
      return new b({
        queryFragments: e,
        queryArgs: O((n = b), k, L).call(n, r),
      });
    }
    toQuery(e = {}, r = 0) {
      return { ...O(this, v, I).call(this, r), ...e };
    }
  },
  N = b;
(y = new WeakMap()),
  (k = new WeakSet()),
  (L = function (e) {
    return e.map((r) =>
      typeof r?.toQuery == "function" ? r : new b({ json: r })
    );
  }),
  (v = new WeakSet()),
  (I = function (e = 0) {
    if ("queryFragments" in T(this, y)) {
      let { queryFragments: r, queryArgs: n } = T(this, y),
        i = r[0];
      if (i === void 0) throw new Error("Internal error!");
      let s = [i],
        u = {};
      return (
        n.forEach((w, p) => {
          let { query: R, arguments: F } = w.toQuery({}, e);
          F !== void 0 && (e += Object.keys(F).length);
          let V = r[p + 1];
          if (V === void 0) throw new Error("Internal error!");
          s.push(R, V), (u = { ...u, ...F });
        }),
        { query: s.join(""), arguments: u }
      );
    } else {
      let r = `arg${e}`,
        n = {};
      return (n[r] = T(this, y).json), { query: `${r}`, arguments: n };
    }
  }),
  q(N, k);
export {
  h as AuthenticationError,
  g as AuthorizationError,
  B as Client,
  S as ClientError,
  U as DefaultFetch,
  E as NetworkError,
  a as ProtocolError,
  d as QueryCheckError,
  l as QueryRuntimeError,
  m as QueryTimeoutError,
  o as ServiceError,
  Q as ServiceInternalError,
  x as ServiceTimeoutError,
  f as ThrottlingError,
  A as endpoints,
  K as fql,
};
//# sourceMappingURL=index.js.map
