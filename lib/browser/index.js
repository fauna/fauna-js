var Ut = Object.create;
var We = Object.defineProperty;
var Lt = Object.getOwnPropertyDescriptor;
var Bt = Object.getOwnPropertyNames;
var qt = Object.getPrototypeOf,
  jt = Object.prototype.hasOwnProperty;
var Ke = (e, t) => () => (t || e((t = { exports: {} }).exports, t), t.exports);
var Ht = (e, t, r, n) => {
  if ((t && typeof t == "object") || typeof t == "function")
    for (let s of Bt(t))
      !jt.call(e, s) &&
        s !== r &&
        We(e, s, {
          get: () => t[s],
          enumerable: !(n = Lt(t, s)) || n.enumerable,
        });
  return e;
};
var $e = (e, t, r) => (
  (r = e != null ? Ut(qt(e)) : {}),
  Ht(
    t || !e || !e.__esModule
      ? We(r, "default", { value: e, enumerable: !0 })
      : r,
    e
  )
);
var be = (e, t, r) => {
  if (!t.has(e)) throw TypeError("Cannot " + r);
};
var ie = (e, t, r) => (
    be(e, t, "read from private field"), r ? r.call(e) : t.get(e)
  ),
  ae = (e, t, r) => {
    if (t.has(e))
      throw TypeError("Cannot add the same private member more than once");
    t instanceof WeakSet ? t.add(e) : t.set(e, r);
  },
  Te = (e, t, r, n) => (
    be(e, t, "write to private field"), n ? n.call(e, r) : t.set(e, r), r
  );
var ue = (e, t, r) => (be(e, t, "access private method"), r);
var Ye = Ke((qr, Oe) => {
  Oe.exports = Xe;
  Oe.exports.HttpsAgent = Xe;
  function Xe() {}
});
var at = Ke((Mr, it) => {
  it.exports = typeof self == "object" ? self.FormData : window.FormData;
});
var xe = $e(Ye());
function K(e, t) {
  return function () {
    return e.apply(t, arguments);
  };
}
var { toString: Ze } = Object.prototype,
  { getPrototypeOf: Ce } = Object,
  _e = ((e) => (t) => {
    let r = Ze.call(t);
    return e[r] || (e[r] = r.slice(8, -1).toLowerCase());
  })(Object.create(null)),
  b = (e) => ((e = e.toLowerCase()), (t) => _e(t) === e),
  le = (e) => (t) => typeof t === e,
  { isArray: $ } = Array,
  Ae = le("undefined");
function Qt(e) {
  return (
    e !== null &&
    !Ae(e) &&
    e.constructor !== null &&
    !Ae(e.constructor) &&
    I(e.constructor.isBuffer) &&
    e.constructor.isBuffer(e)
  );
}
var et = b("ArrayBuffer");
function It(e) {
  let t;
  return (
    typeof ArrayBuffer < "u" && ArrayBuffer.isView
      ? (t = ArrayBuffer.isView(e))
      : (t = e && e.buffer && et(e.buffer)),
    t
  );
}
var Jt = le("string"),
  I = le("function"),
  tt = le("number"),
  rt = (e) => e !== null && typeof e == "object",
  Mt = (e) => e === !0 || e === !1,
  ce = (e) => {
    if (_e(e) !== "object") return !1;
    let t = Ce(e);
    return (
      (t === null ||
        t === Object.prototype ||
        Object.getPrototypeOf(t) === null) &&
      !(Symbol.toStringTag in e) &&
      !(Symbol.iterator in e)
    );
  },
  Vt = b("Date"),
  zt = b("File"),
  vt = b("Blob"),
  Wt = b("FileList"),
  Kt = (e) => rt(e) && I(e.pipe),
  $t = (e) => {
    let t = "[object FormData]";
    return (
      e &&
      ((typeof FormData == "function" && e instanceof FormData) ||
        Ze.call(e) === t ||
        (I(e.toString) && e.toString() === t))
    );
  },
  Xt = b("URLSearchParams"),
  Yt = (e) =>
    e.trim ? e.trim() : e.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, "");
function fe(e, t, { allOwnKeys: r = !1 } = {}) {
  if (e === null || typeof e > "u") return;
  let n, s;
  if ((typeof e != "object" && (e = [e]), $(e)))
    for (n = 0, s = e.length; n < s; n++) t.call(null, e[n], n, e);
  else {
    let i = r ? Object.getOwnPropertyNames(e) : Object.keys(e),
      o = i.length,
      c;
    for (n = 0; n < o; n++) (c = i[n]), t.call(null, e[c], c, e);
  }
}
function Ne() {
  let e = {},
    t = (r, n) => {
      ce(e[n]) && ce(r)
        ? (e[n] = Ne(e[n], r))
        : ce(r)
        ? (e[n] = Ne({}, r))
        : $(r)
        ? (e[n] = r.slice())
        : (e[n] = r);
    };
  for (let r = 0, n = arguments.length; r < n; r++)
    arguments[r] && fe(arguments[r], t);
  return e;
}
var Gt = (e, t, r, { allOwnKeys: n } = {}) => (
    fe(
      t,
      (s, i) => {
        r && I(s) ? (e[i] = K(s, r)) : (e[i] = s);
      },
      { allOwnKeys: n }
    ),
    e
  ),
  Zt = (e) => (e.charCodeAt(0) === 65279 && (e = e.slice(1)), e),
  er = (e, t, r, n) => {
    (e.prototype = Object.create(t.prototype, n)),
      (e.prototype.constructor = e),
      Object.defineProperty(e, "super", { value: t.prototype }),
      r && Object.assign(e.prototype, r);
  },
  tr = (e, t, r, n) => {
    let s,
      i,
      o,
      c = {};
    if (((t = t || {}), e == null)) return t;
    do {
      for (s = Object.getOwnPropertyNames(e), i = s.length; i-- > 0; )
        (o = s[i]), (!n || n(o, e, t)) && !c[o] && ((t[o] = e[o]), (c[o] = !0));
      e = r !== !1 && Ce(e);
    } while (e && (!r || r(e, t)) && e !== Object.prototype);
    return t;
  },
  rr = (e, t, r) => {
    (e = String(e)),
      (r === void 0 || r > e.length) && (r = e.length),
      (r -= t.length);
    let n = e.indexOf(t, r);
    return n !== -1 && n === r;
  },
  nr = (e) => {
    if (!e) return null;
    if ($(e)) return e;
    let t = e.length;
    if (!tt(t)) return null;
    let r = new Array(t);
    for (; t-- > 0; ) r[t] = e[t];
    return r;
  },
  sr = (
    (e) => (t) =>
      e && t instanceof e
  )(typeof Uint8Array < "u" && Ce(Uint8Array)),
  or = (e, t) => {
    let n = (e && e[Symbol.iterator]).call(e),
      s;
    for (; (s = n.next()) && !s.done; ) {
      let i = s.value;
      t.call(e, i[0], i[1]);
    }
  },
  ir = (e, t) => {
    let r,
      n = [];
    for (; (r = e.exec(t)) !== null; ) n.push(r);
    return n;
  },
  ar = b("HTMLFormElement"),
  ur = (e) =>
    e.toLowerCase().replace(/[_-\s]([a-z\d])(\w*)/g, function (r, n, s) {
      return n.toUpperCase() + s;
    }),
  Ge = (
    ({ hasOwnProperty: e }) =>
    (t, r) =>
      e.call(t, r)
  )(Object.prototype),
  cr = b("RegExp"),
  nt = (e, t) => {
    let r = Object.getOwnPropertyDescriptors(e),
      n = {};
    fe(r, (s, i) => {
      t(s, i, e) !== !1 && (n[i] = s);
    }),
      Object.defineProperties(e, n);
  },
  lr = (e) => {
    nt(e, (t, r) => {
      let n = e[r];
      if (!!I(n)) {
        if (((t.enumerable = !1), "writable" in t)) {
          t.writable = !1;
          return;
        }
        t.set ||
          (t.set = () => {
            throw Error("Can not read-only method '" + r + "'");
          });
      }
    });
  },
  fr = (e, t) => {
    let r = {},
      n = (s) => {
        s.forEach((i) => {
          r[i] = !0;
        });
      };
    return $(e) ? n(e) : n(String(e).split(t)), r;
  },
  mr = () => {},
  pr = (e, t) => ((e = +e), Number.isFinite(e) ? e : t),
  a = {
    isArray: $,
    isArrayBuffer: et,
    isBuffer: Qt,
    isFormData: $t,
    isArrayBufferView: It,
    isString: Jt,
    isNumber: tt,
    isBoolean: Mt,
    isObject: rt,
    isPlainObject: ce,
    isUndefined: Ae,
    isDate: Vt,
    isFile: zt,
    isBlob: vt,
    isRegExp: cr,
    isFunction: I,
    isStream: Kt,
    isURLSearchParams: Xt,
    isTypedArray: sr,
    isFileList: Wt,
    forEach: fe,
    merge: Ne,
    extend: Gt,
    trim: Yt,
    stripBOM: Zt,
    inherits: er,
    toFlatObject: tr,
    kindOf: _e,
    kindOfTest: b,
    endsWith: rr,
    toArray: nr,
    forEachEntry: or,
    matchAll: ir,
    isHTMLForm: ar,
    hasOwnProperty: Ge,
    hasOwnProp: Ge,
    reduceDescriptors: nt,
    freezeMethods: lr,
    toObjectSet: fr,
    toCamelCase: ur,
    noop: mr,
    toFiniteNumber: pr,
  };
function J(e, t, r, n, s) {
  Error.call(this),
    Error.captureStackTrace
      ? Error.captureStackTrace(this, this.constructor)
      : (this.stack = new Error().stack),
    (this.message = e),
    (this.name = "AxiosError"),
    t && (this.code = t),
    r && (this.config = r),
    n && (this.request = n),
    s && (this.response = s);
}
a.inherits(J, Error, {
  toJSON: function () {
    return {
      message: this.message,
      name: this.name,
      description: this.description,
      number: this.number,
      fileName: this.fileName,
      lineNumber: this.lineNumber,
      columnNumber: this.columnNumber,
      stack: this.stack,
      config: this.config,
      code: this.code,
      status:
        this.response && this.response.status ? this.response.status : null,
    };
  },
});
var st = J.prototype,
  ot = {};
[
  "ERR_BAD_OPTION_VALUE",
  "ERR_BAD_OPTION",
  "ECONNABORTED",
  "ETIMEDOUT",
  "ERR_NETWORK",
  "ERR_FR_TOO_MANY_REDIRECTS",
  "ERR_DEPRECATED",
  "ERR_BAD_RESPONSE",
  "ERR_BAD_REQUEST",
  "ERR_CANCELED",
  "ERR_NOT_SUPPORT",
  "ERR_INVALID_URL",
].forEach((e) => {
  ot[e] = { value: e };
});
Object.defineProperties(J, ot);
Object.defineProperty(st, "isAxiosError", { value: !0 });
J.from = (e, t, r, n, s, i) => {
  let o = Object.create(st);
  return (
    a.toFlatObject(
      e,
      o,
      function (l) {
        return l !== Error.prototype;
      },
      (c) => c !== "isAxiosError"
    ),
    J.call(o, e.message, t, r, n, s),
    (o.cause = e),
    (o.name = e.name),
    i && Object.assign(o, i),
    o
  );
};
var d = J;
var ut = $e(at(), 1),
  ct = ut.default;
function Pe(e) {
  return a.isPlainObject(e) || a.isArray(e);
}
function ft(e) {
  return a.endsWith(e, "[]") ? e.slice(0, -2) : e;
}
function lt(e, t, r) {
  return e
    ? e
        .concat(t)
        .map(function (s, i) {
          return (s = ft(s)), !r && i ? "[" + s + "]" : s;
        })
        .join(r ? "." : "")
    : t;
}
function dr(e) {
  return a.isArray(e) && !e.some(Pe);
}
var hr = a.toFlatObject(a, {}, null, function (t) {
  return /^is[A-Z]/.test(t);
});
function yr(e) {
  return (
    e &&
    a.isFunction(e.append) &&
    e[Symbol.toStringTag] === "FormData" &&
    e[Symbol.iterator]
  );
}
function Er(e, t, r) {
  if (!a.isObject(e)) throw new TypeError("target must be an object");
  (t = t || new (ct || FormData)()),
    (r = a.toFlatObject(
      r,
      { metaTokens: !0, dots: !1, indexes: !1 },
      !1,
      function (y, C) {
        return !a.isUndefined(C[y]);
      }
    ));
  let n = r.metaTokens,
    s = r.visitor || m,
    i = r.dots,
    o = r.indexes,
    l = (r.Blob || (typeof Blob < "u" && Blob)) && yr(t);
  if (!a.isFunction(s)) throw new TypeError("visitor must be a function");
  function u(f) {
    if (f === null) return "";
    if (a.isDate(f)) return f.toISOString();
    if (!l && a.isBlob(f))
      throw new d("Blob is not supported. Use a Buffer instead.");
    return a.isArrayBuffer(f) || a.isTypedArray(f)
      ? l && typeof Blob == "function"
        ? new Blob([f])
        : Buffer.from(f)
      : f;
  }
  function m(f, y, C) {
    let w = f;
    if (f && !C && typeof f == "object") {
      if (a.endsWith(y, "{}"))
        (y = n ? y : y.slice(0, -2)), (f = JSON.stringify(f));
      else if (
        (a.isArray(f) && dr(f)) ||
        a.isFileList(f) ||
        (a.endsWith(y, "[]") && (w = a.toArray(f)))
      )
        return (
          (y = ft(y)),
          w.forEach(function (we, kt) {
            !a.isUndefined(we) &&
              t.append(
                o === !0 ? lt([y], kt, i) : o === null ? y : y + "[]",
                u(we)
              );
          }),
          !1
        );
    }
    return Pe(f) ? !0 : (t.append(lt(C, y, i), u(f)), !1);
  }
  let E = [],
    h = Object.assign(hr, {
      defaultVisitor: m,
      convertValue: u,
      isVisitable: Pe,
    });
  function p(f, y) {
    if (!a.isUndefined(f)) {
      if (E.indexOf(f) !== -1)
        throw Error("Circular reference detected in " + y.join("."));
      E.push(f),
        a.forEach(f, function (w, Q) {
          (!a.isUndefined(w) &&
            s.call(t, w, a.isString(Q) ? Q.trim() : Q, y, h)) === !0 &&
            p(w, y ? y.concat(Q) : [Q]);
        }),
        E.pop();
    }
  }
  if (!a.isObject(e)) throw new TypeError("data must be an object");
  return p(e), t;
}
var T = Er;
function mt(e) {
  let t = {
    "!": "%21",
    "'": "%27",
    "(": "%28",
    ")": "%29",
    "~": "%7E",
    "%20": "+",
    "%00": "\0",
  };
  return encodeURIComponent(e).replace(/[!'()~]|%20|%00/g, function (n) {
    return t[n];
  });
}
function pt(e, t) {
  (this._pairs = []), e && T(e, this, t);
}
var dt = pt.prototype;
dt.append = function (t, r) {
  this._pairs.push([t, r]);
};
dt.toString = function (t) {
  let r = t
    ? function (n) {
        return t.call(this, n, mt);
      }
    : mt;
  return this._pairs
    .map(function (s) {
      return r(s[0]) + "=" + r(s[1]);
    }, "")
    .join("&");
};
var me = pt;
function gr(e) {
  return encodeURIComponent(e)
    .replace(/%3A/gi, ":")
    .replace(/%24/g, "$")
    .replace(/%2C/gi, ",")
    .replace(/%20/g, "+")
    .replace(/%5B/gi, "[")
    .replace(/%5D/gi, "]");
}
function X(e, t, r) {
  if (!t) return e;
  let n = e.indexOf("#");
  n !== -1 && (e = e.slice(0, n));
  let s = (r && r.encode) || gr,
    i = a.isURLSearchParams(t) ? t.toString() : new me(t, r).toString(s);
  return i && (e += (e.indexOf("?") === -1 ? "?" : "&") + i), e;
}
var Fe = class {
    constructor() {
      this.handlers = [];
    }
    use(t, r, n) {
      return (
        this.handlers.push({
          fulfilled: t,
          rejected: r,
          synchronous: n ? n.synchronous : !1,
          runWhen: n ? n.runWhen : null,
        }),
        this.handlers.length - 1
      );
    }
    eject(t) {
      this.handlers[t] && (this.handlers[t] = null);
    }
    clear() {
      this.handlers && (this.handlers = []);
    }
    forEach(t) {
      a.forEach(this.handlers, function (n) {
        n !== null && t(n);
      });
    }
  },
  De = Fe;
var pe = {
  silentJSONParsing: !0,
  forcedJSONParsing: !0,
  clarifyTimeoutError: !1,
};
var ht = typeof URLSearchParams < "u" ? URLSearchParams : me;
var yt = FormData;
var xr = (() => {
    let e;
    return typeof navigator < "u" &&
      ((e = navigator.product) === "ReactNative" ||
        e === "NativeScript" ||
        e === "NS")
      ? !1
      : typeof window < "u" && typeof document < "u";
  })(),
  g = {
    isBrowser: !0,
    classes: { URLSearchParams: ht, FormData: yt, Blob },
    isStandardBrowserEnv: xr,
    protocols: ["http", "https", "file", "blob", "url", "data"],
  };
function ke(e, t) {
  return T(
    e,
    new g.classes.URLSearchParams(),
    Object.assign(
      {
        visitor: function (r, n, s, i) {
          return g.isNode && a.isBuffer(r)
            ? (this.append(n, r.toString("base64")), !1)
            : i.defaultVisitor.apply(this, arguments);
        },
      },
      t
    )
  );
}
function Sr(e) {
  return a
    .matchAll(/\w+|\[(\w*)]/g, e)
    .map((t) => (t[0] === "[]" ? "" : t[1] || t[0]));
}
function Rr(e) {
  let t = {},
    r = Object.keys(e),
    n,
    s = r.length,
    i;
  for (n = 0; n < s; n++) (i = r[n]), (t[i] = e[i]);
  return t;
}
function wr(e) {
  function t(r, n, s, i) {
    let o = r[i++],
      c = Number.isFinite(+o),
      l = i >= r.length;
    return (
      (o = !o && a.isArray(s) ? s.length : o),
      l
        ? (a.hasOwnProp(s, o) ? (s[o] = [s[o], n]) : (s[o] = n), !c)
        : ((!s[o] || !a.isObject(s[o])) && (s[o] = []),
          t(r, n, s[o], i) && a.isArray(s[o]) && (s[o] = Rr(s[o])),
          !c)
    );
  }
  if (a.isFormData(e) && a.isFunction(e.entries)) {
    let r = {};
    return (
      a.forEachEntry(e, (n, s) => {
        t(Sr(n), s, r, 0);
      }),
      r
    );
  }
  return null;
}
var de = wr;
function Ue(e, t, r) {
  let n = r.config.validateStatus;
  !r.status || !n || n(r.status)
    ? e(r)
    : t(
        new d(
          "Request failed with status code " + r.status,
          [d.ERR_BAD_REQUEST, d.ERR_BAD_RESPONSE][
            Math.floor(r.status / 100) - 4
          ],
          r.config,
          r.request,
          r
        )
      );
}
var Et = g.isStandardBrowserEnv
  ? (function () {
      return {
        write: function (r, n, s, i, o, c) {
          let l = [];
          l.push(r + "=" + encodeURIComponent(n)),
            a.isNumber(s) && l.push("expires=" + new Date(s).toGMTString()),
            a.isString(i) && l.push("path=" + i),
            a.isString(o) && l.push("domain=" + o),
            c === !0 && l.push("secure"),
            (document.cookie = l.join("; "));
        },
        read: function (r) {
          let n = document.cookie.match(
            new RegExp("(^|;\\s*)(" + r + ")=([^;]*)")
          );
          return n ? decodeURIComponent(n[3]) : null;
        },
        remove: function (r) {
          this.write(r, "", Date.now() - 864e5);
        },
      };
    })()
  : (function () {
      return {
        write: function () {},
        read: function () {
          return null;
        },
        remove: function () {},
      };
    })();
function Le(e) {
  return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(e);
}
function Be(e, t) {
  return t ? e.replace(/\/+$/, "") + "/" + t.replace(/^\/+/, "") : e;
}
function Y(e, t) {
  return e && !Le(t) ? Be(e, t) : t;
}
var gt = g.isStandardBrowserEnv
  ? (function () {
      let t = /(msie|trident)/i.test(navigator.userAgent),
        r = document.createElement("a"),
        n;
      function s(i) {
        let o = i;
        return (
          t && (r.setAttribute("href", o), (o = r.href)),
          r.setAttribute("href", o),
          {
            href: r.href,
            protocol: r.protocol ? r.protocol.replace(/:$/, "") : "",
            host: r.host,
            search: r.search ? r.search.replace(/^\?/, "") : "",
            hash: r.hash ? r.hash.replace(/^#/, "") : "",
            hostname: r.hostname,
            port: r.port,
            pathname:
              r.pathname.charAt(0) === "/" ? r.pathname : "/" + r.pathname,
          }
        );
      }
      return (
        (n = s(window.location.href)),
        function (o) {
          let c = a.isString(o) ? s(o) : o;
          return c.protocol === n.protocol && c.host === n.host;
        }
      );
    })()
  : (function () {
      return function () {
        return !0;
      };
    })();
function xt(e, t, r) {
  d.call(this, e ?? "canceled", d.ERR_CANCELED, t, r),
    (this.name = "CanceledError");
}
a.inherits(xt, d, { __CANCEL__: !0 });
var O = xt;
function qe(e) {
  let t = /^([-+\w]{1,25})(:?\/\/|:)/.exec(e);
  return (t && t[1]) || "";
}
var br = a.toObjectSet([
    "age",
    "authorization",
    "content-length",
    "content-type",
    "etag",
    "expires",
    "from",
    "host",
    "if-modified-since",
    "if-unmodified-since",
    "last-modified",
    "location",
    "max-forwards",
    "proxy-authorization",
    "referer",
    "retry-after",
    "user-agent",
  ]),
  St = (e) => {
    let t = {},
      r,
      n,
      s;
    return (
      e &&
        e
          .split(
            `
`
          )
          .forEach(function (o) {
            (s = o.indexOf(":")),
              (r = o.substring(0, s).trim().toLowerCase()),
              (n = o.substring(s + 1).trim()),
              !(!r || (t[r] && br[r])) &&
                (r === "set-cookie"
                  ? t[r]
                    ? t[r].push(n)
                    : (t[r] = [n])
                  : (t[r] = t[r] ? t[r] + ", " + n : n));
          }),
      t
    );
  };
var Rt = Symbol("internals"),
  bt = Symbol("defaults");
function Z(e) {
  return e && String(e).trim().toLowerCase();
}
function he(e) {
  return e === !1 || e == null ? e : String(e);
}
function Tr(e) {
  let t = Object.create(null),
    r = /([^\s,;=]+)\s*(?:=\s*([^,;]+))?/g,
    n;
  for (; (n = r.exec(e)); ) t[n[1]] = n[2];
  return t;
}
function wt(e, t, r, n) {
  if (a.isFunction(n)) return n.call(this, t, r);
  if (!!a.isString(t)) {
    if (a.isString(n)) return t.indexOf(n) !== -1;
    if (a.isRegExp(n)) return n.test(t);
  }
}
function Or(e) {
  return e
    .trim()
    .toLowerCase()
    .replace(/([a-z\d])(\w*)/g, (t, r, n) => r.toUpperCase() + n);
}
function Ar(e, t) {
  let r = a.toCamelCase(" " + t);
  ["get", "set", "has"].forEach((n) => {
    Object.defineProperty(e, n + r, {
      value: function (s, i, o) {
        return this[n].call(this, t, s, i, o);
      },
      configurable: !0,
    });
  });
}
function G(e, t) {
  t = t.toLowerCase();
  let r = Object.keys(e),
    n = r.length,
    s;
  for (; n-- > 0; ) if (((s = r[n]), t === s.toLowerCase())) return s;
  return null;
}
function M(e, t) {
  e && this.set(e), (this[bt] = t || null);
}
Object.assign(M.prototype, {
  set: function (e, t, r) {
    let n = this;
    function s(i, o, c) {
      let l = Z(o);
      if (!l) throw new Error("header name must be a non-empty string");
      let u = G(n, l);
      (u && c !== !0 && (n[u] === !1 || c === !1)) ||
        (a.isArray(i) ? (i = i.map(he)) : (i = he(i)), (n[u || o] = i));
    }
    return (
      a.isPlainObject(e)
        ? a.forEach(e, (i, o) => {
            s(i, o, t);
          })
        : s(t, e, r),
      this
    );
  },
  get: function (e, t) {
    if (((e = Z(e)), !e)) return;
    let r = G(this, e);
    if (r) {
      let n = this[r];
      if (!t) return n;
      if (t === !0) return Tr(n);
      if (a.isFunction(t)) return t.call(this, n, r);
      if (a.isRegExp(t)) return t.exec(n);
      throw new TypeError("parser must be boolean|regexp|function");
    }
  },
  has: function (e, t) {
    if (((e = Z(e)), e)) {
      let r = G(this, e);
      return !!(r && (!t || wt(this, this[r], r, t)));
    }
    return !1;
  },
  delete: function (e, t) {
    let r = this,
      n = !1;
    function s(i) {
      if (((i = Z(i)), i)) {
        let o = G(r, i);
        o && (!t || wt(r, r[o], o, t)) && (delete r[o], (n = !0));
      }
    }
    return a.isArray(e) ? e.forEach(s) : s(e), n;
  },
  clear: function () {
    return Object.keys(this).forEach(this.delete.bind(this));
  },
  normalize: function (e) {
    let t = this,
      r = {};
    return (
      a.forEach(this, (n, s) => {
        let i = G(r, s);
        if (i) {
          (t[i] = he(n)), delete t[s];
          return;
        }
        let o = e ? Or(s) : String(s).trim();
        o !== s && delete t[s], (t[o] = he(n)), (r[o] = !0);
      }),
      this
    );
  },
  toJSON: function () {
    let e = Object.create(null);
    return (
      a.forEach(Object.assign({}, this[bt] || null, this), (t, r) => {
        t == null || t === !1 || (e[r] = a.isArray(t) ? t.join(", ") : t);
      }),
      e
    );
  },
});
Object.assign(M, {
  from: function (e) {
    return a.isString(e)
      ? new this(St(e))
      : e instanceof this
      ? e
      : new this(e);
  },
  accessor: function (e) {
    let r = (this[Rt] = this[Rt] = { accessors: {} }).accessors,
      n = this.prototype;
    function s(i) {
      let o = Z(i);
      r[o] || (Ar(n, i), (r[o] = !0));
    }
    return a.isArray(e) ? e.forEach(s) : s(e), this;
  },
});
M.accessor([
  "Content-Type",
  "Content-Length",
  "Accept",
  "Accept-Encoding",
  "User-Agent",
]);
a.freezeMethods(M.prototype);
a.freezeMethods(M);
var R = M;
function Nr(e, t) {
  e = e || 10;
  let r = new Array(e),
    n = new Array(e),
    s = 0,
    i = 0,
    o;
  return (
    (t = t !== void 0 ? t : 1e3),
    function (l) {
      let u = Date.now(),
        m = n[i];
      o || (o = u), (r[s] = l), (n[s] = u);
      let E = i,
        h = 0;
      for (; E !== s; ) (h += r[E++]), (E = E % e);
      if (((s = (s + 1) % e), s === i && (i = (i + 1) % e), u - o < t)) return;
      let p = m && u - m;
      return p ? Math.round((h * 1e3) / p) : void 0;
    }
  );
}
var Tt = Nr;
function Ot(e, t) {
  let r = 0,
    n = Tt(50, 250);
  return (s) => {
    let i = s.loaded,
      o = s.lengthComputable ? s.total : void 0,
      c = i - r,
      l = n(c),
      u = i <= o;
    r = i;
    let m = {
      loaded: i,
      total: o,
      progress: o ? i / o : void 0,
      bytes: c,
      rate: l || void 0,
      estimated: l && o && u ? (o - i) / l : void 0,
    };
    (m[t ? "download" : "upload"] = !0), e(m);
  };
}
function ee(e) {
  return new Promise(function (r, n) {
    let s = e.data,
      i = R.from(e.headers).normalize(),
      o = e.responseType,
      c;
    function l() {
      e.cancelToken && e.cancelToken.unsubscribe(c),
        e.signal && e.signal.removeEventListener("abort", c);
    }
    a.isFormData(s) && g.isStandardBrowserEnv && i.setContentType(!1);
    let u = new XMLHttpRequest();
    if (e.auth) {
      let p = e.auth.username || "",
        f = e.auth.password
          ? unescape(encodeURIComponent(e.auth.password))
          : "";
      i.set("Authorization", "Basic " + btoa(p + ":" + f));
    }
    let m = Y(e.baseURL, e.url);
    u.open(e.method.toUpperCase(), X(m, e.params, e.paramsSerializer), !0),
      (u.timeout = e.timeout);
    function E() {
      if (!u) return;
      let p = R.from("getAllResponseHeaders" in u && u.getAllResponseHeaders()),
        y = {
          data:
            !o || o === "text" || o === "json" ? u.responseText : u.response,
          status: u.status,
          statusText: u.statusText,
          headers: p,
          config: e,
          request: u,
        };
      Ue(
        function (w) {
          r(w), l();
        },
        function (w) {
          n(w), l();
        },
        y
      ),
        (u = null);
    }
    if (
      ("onloadend" in u
        ? (u.onloadend = E)
        : (u.onreadystatechange = function () {
            !u ||
              u.readyState !== 4 ||
              (u.status === 0 &&
                !(u.responseURL && u.responseURL.indexOf("file:") === 0)) ||
              setTimeout(E);
          }),
      (u.onabort = function () {
        !u || (n(new d("Request aborted", d.ECONNABORTED, e, u)), (u = null));
      }),
      (u.onerror = function () {
        n(new d("Network Error", d.ERR_NETWORK, e, u)), (u = null);
      }),
      (u.ontimeout = function () {
        let f = e.timeout
            ? "timeout of " + e.timeout + "ms exceeded"
            : "timeout exceeded",
          y = e.transitional || pe;
        e.timeoutErrorMessage && (f = e.timeoutErrorMessage),
          n(
            new d(f, y.clarifyTimeoutError ? d.ETIMEDOUT : d.ECONNABORTED, e, u)
          ),
          (u = null);
      }),
      g.isStandardBrowserEnv)
    ) {
      let p =
        (e.withCredentials || gt(m)) &&
        e.xsrfCookieName &&
        Et.read(e.xsrfCookieName);
      p && i.set(e.xsrfHeaderName, p);
    }
    s === void 0 && i.setContentType(null),
      "setRequestHeader" in u &&
        a.forEach(i.toJSON(), function (f, y) {
          u.setRequestHeader(y, f);
        }),
      a.isUndefined(e.withCredentials) ||
        (u.withCredentials = !!e.withCredentials),
      o && o !== "json" && (u.responseType = e.responseType),
      typeof e.onDownloadProgress == "function" &&
        u.addEventListener("progress", Ot(e.onDownloadProgress, !0)),
      typeof e.onUploadProgress == "function" &&
        u.upload &&
        u.upload.addEventListener("progress", Ot(e.onUploadProgress)),
      (e.cancelToken || e.signal) &&
        ((c = (p) => {
          !u ||
            (n(!p || p.type ? new O(null, e, u) : p), u.abort(), (u = null));
        }),
        e.cancelToken && e.cancelToken.subscribe(c),
        e.signal &&
          (e.signal.aborted ? c() : e.signal.addEventListener("abort", c)));
    let h = qe(m);
    if (h && g.protocols.indexOf(h) === -1) {
      n(new d("Unsupported protocol " + h + ":", d.ERR_BAD_REQUEST, e));
      return;
    }
    u.send(s || null);
  });
}
var At = { http: ee, xhr: ee },
  je = {
    getAdapter: (e) => {
      if (a.isString(e)) {
        let t = At[e];
        if (!e)
          throw Error(
            a.hasOwnProp(e)
              ? `Adapter '${e}' is not available in the build`
              : `Can not resolve adapter '${e}'`
          );
        return t;
      }
      if (!a.isFunction(e)) throw new TypeError("adapter is not a function");
      return e;
    },
    adapters: At,
  };
var Cr = { "Content-Type": "application/x-www-form-urlencoded" };
function _r() {
  let e;
  return (
    typeof XMLHttpRequest < "u"
      ? (e = je.getAdapter("xhr"))
      : typeof process < "u" &&
        a.kindOf(process) === "process" &&
        (e = je.getAdapter("http")),
    e
  );
}
function Pr(e, t, r) {
  if (a.isString(e))
    try {
      return (t || JSON.parse)(e), a.trim(e);
    } catch (n) {
      if (n.name !== "SyntaxError") throw n;
    }
  return (r || JSON.stringify)(e);
}
var ye = {
  transitional: pe,
  adapter: _r(),
  transformRequest: [
    function (t, r) {
      let n = r.getContentType() || "",
        s = n.indexOf("application/json") > -1,
        i = a.isObject(t);
      if ((i && a.isHTMLForm(t) && (t = new FormData(t)), a.isFormData(t)))
        return s && s ? JSON.stringify(de(t)) : t;
      if (
        a.isArrayBuffer(t) ||
        a.isBuffer(t) ||
        a.isStream(t) ||
        a.isFile(t) ||
        a.isBlob(t)
      )
        return t;
      if (a.isArrayBufferView(t)) return t.buffer;
      if (a.isURLSearchParams(t))
        return (
          r.setContentType(
            "application/x-www-form-urlencoded;charset=utf-8",
            !1
          ),
          t.toString()
        );
      let c;
      if (i) {
        if (n.indexOf("application/x-www-form-urlencoded") > -1)
          return ke(t, this.formSerializer).toString();
        if ((c = a.isFileList(t)) || n.indexOf("multipart/form-data") > -1) {
          let l = this.env && this.env.FormData;
          return T(c ? { "files[]": t } : t, l && new l(), this.formSerializer);
        }
      }
      return i || s ? (r.setContentType("application/json", !1), Pr(t)) : t;
    },
  ],
  transformResponse: [
    function (t) {
      let r = this.transitional || ye.transitional,
        n = r && r.forcedJSONParsing,
        s = this.responseType === "json";
      if (t && a.isString(t) && ((n && !this.responseType) || s)) {
        let o = !(r && r.silentJSONParsing) && s;
        try {
          return JSON.parse(t);
        } catch (c) {
          if (o)
            throw c.name === "SyntaxError"
              ? d.from(c, d.ERR_BAD_RESPONSE, this, null, this.response)
              : c;
        }
      }
      return t;
    },
  ],
  timeout: 0,
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",
  maxContentLength: -1,
  maxBodyLength: -1,
  env: { FormData: g.classes.FormData, Blob: g.classes.Blob },
  validateStatus: function (t) {
    return t >= 200 && t < 300;
  },
  headers: { common: { Accept: "application/json, text/plain, */*" } },
};
a.forEach(["delete", "get", "head"], function (t) {
  ye.headers[t] = {};
});
a.forEach(["post", "put", "patch"], function (t) {
  ye.headers[t] = a.merge(Cr);
});
var V = ye;
function te(e, t) {
  let r = this || V,
    n = t || r,
    s = R.from(n.headers),
    i = n.data;
  return (
    a.forEach(e, function (c) {
      i = c.call(r, i, s.normalize(), t ? t.status : void 0);
    }),
    s.normalize(),
    i
  );
}
function re(e) {
  return !!(e && e.__CANCEL__);
}
function He(e) {
  if (
    (e.cancelToken && e.cancelToken.throwIfRequested(),
    e.signal && e.signal.aborted)
  )
    throw new O();
}
function Ee(e) {
  return (
    He(e),
    (e.headers = R.from(e.headers)),
    (e.data = te.call(e, e.transformRequest)),
    (e.adapter || V.adapter)(e).then(
      function (n) {
        return (
          He(e),
          (n.data = te.call(e, e.transformResponse, n)),
          (n.headers = R.from(n.headers)),
          n
        );
      },
      function (n) {
        return (
          re(n) ||
            (He(e),
            n &&
              n.response &&
              ((n.response.data = te.call(e, e.transformResponse, n.response)),
              (n.response.headers = R.from(n.response.headers)))),
          Promise.reject(n)
        );
      }
    )
  );
}
function A(e, t) {
  t = t || {};
  let r = {};
  function n(u, m) {
    return a.isPlainObject(u) && a.isPlainObject(m)
      ? a.merge(u, m)
      : a.isPlainObject(m)
      ? a.merge({}, m)
      : a.isArray(m)
      ? m.slice()
      : m;
  }
  function s(u) {
    if (a.isUndefined(t[u])) {
      if (!a.isUndefined(e[u])) return n(void 0, e[u]);
    } else return n(e[u], t[u]);
  }
  function i(u) {
    if (!a.isUndefined(t[u])) return n(void 0, t[u]);
  }
  function o(u) {
    if (a.isUndefined(t[u])) {
      if (!a.isUndefined(e[u])) return n(void 0, e[u]);
    } else return n(void 0, t[u]);
  }
  function c(u) {
    if (u in t) return n(e[u], t[u]);
    if (u in e) return n(void 0, e[u]);
  }
  let l = {
    url: i,
    method: i,
    data: i,
    baseURL: o,
    transformRequest: o,
    transformResponse: o,
    paramsSerializer: o,
    timeout: o,
    timeoutMessage: o,
    withCredentials: o,
    adapter: o,
    responseType: o,
    xsrfCookieName: o,
    xsrfHeaderName: o,
    onUploadProgress: o,
    onDownloadProgress: o,
    decompress: o,
    maxContentLength: o,
    maxBodyLength: o,
    beforeRedirect: o,
    transport: o,
    httpAgent: o,
    httpsAgent: o,
    cancelToken: o,
    socketPath: o,
    responseEncoding: o,
    validateStatus: c,
  };
  return (
    a.forEach(Object.keys(e).concat(Object.keys(t)), function (m) {
      let E = l[m] || s,
        h = E(m);
      (a.isUndefined(h) && E !== c) || (r[m] = h);
    }),
    r
  );
}
var ge = "1.1.2";
var Qe = {};
["object", "boolean", "number", "function", "string", "symbol"].forEach(
  (e, t) => {
    Qe[e] = function (n) {
      return typeof n === e || "a" + (t < 1 ? "n " : " ") + e;
    };
  }
);
var Nt = {};
Qe.transitional = function (t, r, n) {
  function s(i, o) {
    return (
      "[Axios v" +
      ge +
      "] Transitional option '" +
      i +
      "'" +
      o +
      (n ? ". " + n : "")
    );
  }
  return (i, o, c) => {
    if (t === !1)
      throw new d(
        s(o, " has been removed" + (r ? " in " + r : "")),
        d.ERR_DEPRECATED
      );
    return (
      r &&
        !Nt[o] &&
        ((Nt[o] = !0),
        console.warn(
          s(
            o,
            " has been deprecated since v" +
              r +
              " and will be removed in the near future"
          )
        )),
      t ? t(i, o, c) : !0
    );
  };
};
function Fr(e, t, r) {
  if (typeof e != "object")
    throw new d("options must be an object", d.ERR_BAD_OPTION_VALUE);
  let n = Object.keys(e),
    s = n.length;
  for (; s-- > 0; ) {
    let i = n[s],
      o = t[i];
    if (o) {
      let c = e[i],
        l = c === void 0 || o(c, i, e);
      if (l !== !0)
        throw new d("option " + i + " must be " + l, d.ERR_BAD_OPTION_VALUE);
      continue;
    }
    if (r !== !0) throw new d("Unknown option " + i, d.ERR_BAD_OPTION);
  }
}
var Ie = { assertOptions: Fr, validators: Qe };
var z = Ie.validators,
  v = class {
    constructor(t) {
      (this.defaults = t),
        (this.interceptors = { request: new De(), response: new De() });
    }
    request(t, r) {
      typeof t == "string" ? ((r = r || {}), (r.url = t)) : (r = t || {}),
        (r = A(this.defaults, r));
      let n = r.transitional;
      n !== void 0 &&
        Ie.assertOptions(
          n,
          {
            silentJSONParsing: z.transitional(z.boolean),
            forcedJSONParsing: z.transitional(z.boolean),
            clarifyTimeoutError: z.transitional(z.boolean),
          },
          !1
        ),
        (r.method = (r.method || this.defaults.method || "get").toLowerCase());
      let s = r.headers && a.merge(r.headers.common, r.headers[r.method]);
      s &&
        a.forEach(
          ["delete", "get", "head", "post", "put", "patch", "common"],
          function (p) {
            delete r.headers[p];
          }
        ),
        (r.headers = new R(r.headers, s));
      let i = [],
        o = !0;
      this.interceptors.request.forEach(function (p) {
        (typeof p.runWhen == "function" && p.runWhen(r) === !1) ||
          ((o = o && p.synchronous), i.unshift(p.fulfilled, p.rejected));
      });
      let c = [];
      this.interceptors.response.forEach(function (p) {
        c.push(p.fulfilled, p.rejected);
      });
      let l,
        u = 0,
        m;
      if (!o) {
        let h = [Ee.bind(this), void 0];
        for (
          h.unshift.apply(h, i),
            h.push.apply(h, c),
            m = h.length,
            l = Promise.resolve(r);
          u < m;

        )
          l = l.then(h[u++], h[u++]);
        return l;
      }
      m = i.length;
      let E = r;
      for (u = 0; u < m; ) {
        let h = i[u++],
          p = i[u++];
        try {
          E = h(E);
        } catch (f) {
          p.call(this, f);
          break;
        }
      }
      try {
        l = Ee.call(this, E);
      } catch (h) {
        return Promise.reject(h);
      }
      for (u = 0, m = c.length; u < m; ) l = l.then(c[u++], c[u++]);
      return l;
    }
    getUri(t) {
      t = A(this.defaults, t);
      let r = Y(t.baseURL, t.url);
      return X(r, t.params, t.paramsSerializer);
    }
  };
a.forEach(["delete", "get", "head", "options"], function (t) {
  v.prototype[t] = function (r, n) {
    return this.request(
      A(n || {}, { method: t, url: r, data: (n || {}).data })
    );
  };
});
a.forEach(["post", "put", "patch"], function (t) {
  function r(n) {
    return function (i, o, c) {
      return this.request(
        A(c || {}, {
          method: t,
          headers: n ? { "Content-Type": "multipart/form-data" } : {},
          url: i,
          data: o,
        })
      );
    };
  }
  (v.prototype[t] = r()), (v.prototype[t + "Form"] = r(!0));
});
var ne = v;
var se = class {
    constructor(t) {
      if (typeof t != "function")
        throw new TypeError("executor must be a function.");
      let r;
      this.promise = new Promise(function (i) {
        r = i;
      });
      let n = this;
      this.promise.then((s) => {
        if (!n._listeners) return;
        let i = n._listeners.length;
        for (; i-- > 0; ) n._listeners[i](s);
        n._listeners = null;
      }),
        (this.promise.then = (s) => {
          let i,
            o = new Promise((c) => {
              n.subscribe(c), (i = c);
            }).then(s);
          return (
            (o.cancel = function () {
              n.unsubscribe(i);
            }),
            o
          );
        }),
        t(function (i, o, c) {
          n.reason || ((n.reason = new O(i, o, c)), r(n.reason));
        });
    }
    throwIfRequested() {
      if (this.reason) throw this.reason;
    }
    subscribe(t) {
      if (this.reason) {
        t(this.reason);
        return;
      }
      this._listeners ? this._listeners.push(t) : (this._listeners = [t]);
    }
    unsubscribe(t) {
      if (!this._listeners) return;
      let r = this._listeners.indexOf(t);
      r !== -1 && this._listeners.splice(r, 1);
    }
    static source() {
      let t;
      return {
        token: new se(function (s) {
          t = s;
        }),
        cancel: t,
      };
    }
  },
  Ct = se;
function Je(e) {
  return function (r) {
    return e.apply(null, r);
  };
}
function Me(e) {
  return a.isObject(e) && e.isAxiosError === !0;
}
function _t(e) {
  let t = new ne(e),
    r = K(ne.prototype.request, t);
  return (
    a.extend(r, ne.prototype, t, { allOwnKeys: !0 }),
    a.extend(r, t, null, { allOwnKeys: !0 }),
    (r.create = function (s) {
      return _t(A(e, s));
    }),
    r
  );
}
var S = _t(V);
S.Axios = ne;
S.CanceledError = O;
S.CancelToken = Ct;
S.isCancel = re;
S.VERSION = ge;
S.toFormData = T;
S.AxiosError = d;
S.Cancel = S.CanceledError;
S.all = function (t) {
  return Promise.all(t);
};
S.spread = Je;
S.isAxiosError = Me;
S.formToJSON = (e) => de(a.isHTMLForm(e) ? new FormData(e) : e);
var Pt = S;
var Ft = Pt;
var Ve = {
  production: new URL("https://db.fauna.com"),
  preview: new URL("https://db.fauna-preview.com"),
  local: new URL("http://localhost:8443"),
  localhost: new URL("http://localhost:8443"),
};
var x = class extends Error {
    httpStatus;
    code;
    summary;
    constructor(t) {
      super(t.message),
        Error.captureStackTrace && Error.captureStackTrace(this, x),
        (this.name = "ServiceError"),
        (this.code = t.code),
        (this.httpStatus = t.httpStatus),
        t.summary && (this.summary = t.summary);
    }
  },
  _ = class extends x {
    constructor(t) {
      super(t),
        Error.captureStackTrace && Error.captureStackTrace(this, _),
        (this.name = "QueryRuntimeError");
    }
  },
  P = class extends x {
    constructor(t) {
      super(t),
        Error.captureStackTrace && Error.captureStackTrace(this, P),
        (this.name = "QueryCheckError");
    }
  },
  F = class extends x {
    stats;
    constructor(t) {
      let { stats: r, ...n } = t;
      super(n),
        Error.captureStackTrace && Error.captureStackTrace(this, F),
        (this.name = "QueryTimeoutError"),
        r && (this.stats = r);
    }
  },
  D = class extends x {
    constructor(t) {
      super(t),
        Error.captureStackTrace && Error.captureStackTrace(this, D),
        (this.name = "AuthenticationError");
    }
  },
  k = class extends x {
    constructor(t) {
      super(t),
        Error.captureStackTrace && Error.captureStackTrace(this, k),
        (this.name = "AuthorizationError");
    }
  },
  U = class extends x {
    constructor(t) {
      super(t),
        Error.captureStackTrace && Error.captureStackTrace(this, U),
        (this.name = "ThrottlingError");
    }
  },
  L = class extends x {
    constructor(t) {
      super(t),
        Error.captureStackTrace && Error.captureStackTrace(this, L),
        (this.name = "ServiceInternalError");
    }
  },
  B = class extends x {
    constructor(t) {
      super(t),
        Error.captureStackTrace && Error.captureStackTrace(this, B),
        (this.name = "ServiceTimeoutError");
    }
  },
  q = class extends Error {
    constructor(t, r) {
      super(t, r),
        Error.captureStackTrace && Error.captureStackTrace(this, q),
        (this.name = "ClientError");
    }
  },
  j = class extends Error {
    constructor(t, r) {
      super(t, r),
        Error.captureStackTrace && Error.captureStackTrace(this, j),
        (this.name = "NetworkError");
    }
  },
  H = class extends Error {
    httpStatus;
    constructor(t) {
      super(t.message),
        Error.captureStackTrace && Error.captureStackTrace(this, H),
        (this.name = "ProtocolError"),
        (this.httpStatus = t.httpStatus);
    }
  };
var Dr = { max_conns: 10, endpoint: Ve.production, timeout_ms: 6e4 },
  ze = class {
    clientConfiguration;
    client;
    #e;
    constructor(t) {
      this.clientConfiguration = { ...Dr, ...t, secret: this.#n(t) };
      let r = this.clientConfiguration.timeout_ms + 1e4,
        n = {
          maxSockets: this.clientConfiguration.max_conns,
          maxFreeSockets: this.clientConfiguration.max_conns,
          timeout: r,
          freeSocketTimeout: 4e3,
          keepAlive: !0,
        };
      (this.client = Ft.create({
        baseURL: this.clientConfiguration.endpoint.toString(),
        timeout: r,
      })),
        (this.client.defaults.httpAgent = new xe.default(n)),
        (this.client.defaults.httpsAgent = new xe.HttpsAgent(n)),
        (this.client.defaults.headers.common.Authorization = `Bearer ${this.clientConfiguration.secret}`),
        (this.client.defaults.headers.common["Content-Type"] =
          "application/json"),
        (this.client.defaults.headers.common["X-Format"] = "simple"),
        this.#r(this.clientConfiguration, this.client.defaults.headers.common);
    }
    #n(t) {
      let r;
      typeof process == "object" && (r = process.env.FAUNA_SECRET);
      let n = t?.secret || r;
      if (n === void 0)
        throw new Error(
          "You must provide a secret to the driver. Set it in an environmental variable named FAUNA_SECRET or pass it to the Client constructor."
        );
      return n;
    }
    async query(t, r) {
      return "query" in t ? this.#t({ ...t, ...r }) : this.#t(t.toQuery(r));
    }
    async #t(t) {
      let { query: r, arguments: n } = t,
        s = {};
      this.#r(t, s);
      try {
        let i = await this.client.post(
            "/query/1",
            { query: r, arguments: n },
            { headers: s }
          ),
          o = new Date(i.data.txn_time);
        return (
          ((this.#e === void 0 && i.data.txn_time !== void 0) ||
            (i.data.txn_time !== void 0 &&
              this.#e !== void 0 &&
              this.#e < o)) &&
            (this.#e = o),
          i.data
        );
      } catch (i) {
        throw this.#s(i);
      }
    }
    #s(t) {
      if (t.response) {
        if (t.response.data?.error) {
          let r = t.response.data.error;
          return (
            r.summary === void 0 &&
              t.response.data.summary !== void 0 &&
              (r.summary = t.response.data.summary),
            this.#o(r, t.response.status)
          );
        }
        return new H({ message: t.message, httpStatus: t.response.status });
      }
      return t.request?.status === 0 ||
        t.request?.socket?.connecting ||
        Ur.includes(t.code) ||
        t.message === "Network Error"
        ? new j("The network connection encountered a problem.", { cause: t })
        : new q("A client level error occurred. Fauna was not called.", {
            cause: t,
          });
    }
    #o(t, r) {
      switch (r) {
        case 400:
          return r === 400 && kr.includes(t.code)
            ? new P({ httpStatus: r, ...t })
            : new _({ httpStatus: r, ...t });
        case 401:
          return new D({ httpStatus: r, ...t });
        case 403:
          return new k({ httpStatus: r, ...t });
        case 429:
          return new U({ httpStatus: r, ...t });
        case 440:
          return new F({ httpStatus: r, ...t });
        case 500:
          return new L({ httpStatus: r, ...t });
        case 503:
          return new B({ httpStatus: r, ...t });
        default:
          return new x({ httpStatus: r, ...t });
      }
    }
    #r(t, r) {
      for (let n of Object.entries(t))
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
          let s,
            i = `x-${n[0].replaceAll("_", "-")}`;
          n[0] === "tags"
            ? ((i = "x-fauna-tags"),
              (s = Object.entries(n[1])
                .map((o) => o.join("="))
                .join(",")))
            : typeof n[1] == "string"
            ? (s = n[1])
            : (s = String(n[1])),
            n[0] === "traceparent" && (i = n[0]),
            (r[i] = s);
        }
      r["x-last-txn"] === void 0 &&
        this.#e !== void 0 &&
        (r["x-last-txn"] = this.#e.toISOString());
    }
  },
  kr = [
    "invalid_function_definition",
    "invalid_identifier",
    "invalid_query",
    "invalid_syntax",
    "invalid_type",
  ],
  Ur = [
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
function Lr(e, ...t) {
  return Se.create(e, ...t);
}
var N,
  oe,
  ve,
  Re,
  Dt,
  W = class {
    constructor(t) {
      ae(this, Re);
      ae(this, N, void 0);
      var r;
      if ("queryFragments" in t) {
        if (
          t.queryFragments.length === 0 ||
          t.queryFragments.length !== t.queryArgs.length + 1
        )
          throw new Error("invalid query constructed");
        Te(this, N, {
          ...t,
          queryArgs: ue((r = W), oe, ve).call(r, t.queryArgs),
        });
      } else Te(this, N, t);
    }
    static create(t, ...r) {
      var n;
      return new W({
        queryFragments: t,
        queryArgs: ue((n = W), oe, ve).call(n, r),
      });
    }
    toQuery(t = {}, r = 0) {
      return { ...ue(this, Re, Dt).call(this, r), ...t };
    }
  },
  Se = W;
(N = new WeakMap()),
  (oe = new WeakSet()),
  (ve = function (t) {
    return t.map((r) =>
      typeof r?.toQuery == "function" ? r : new W({ json: r })
    );
  }),
  (Re = new WeakSet()),
  (Dt = function (t = 0) {
    if ("queryFragments" in ie(this, N)) {
      let { queryFragments: r, queryArgs: n } = ie(this, N),
        s = r[0];
      if (s === void 0) throw new Error("Internal error!");
      let i = [s],
        o = {};
      return (
        n.forEach((c, l) => {
          let { query: u, arguments: m } = c.toQuery({}, t);
          m !== void 0 && (t += Object.keys(m).length);
          let E = r[l + 1];
          if (E === void 0) throw new Error("Internal error!");
          i.push(u, E), (o = { ...o, ...m });
        }),
        { query: i.join(""), arguments: o }
      );
    } else {
      let r = `arg${t}`,
        n = {};
      return (n[r] = ie(this, N).json), { query: `${r}`, arguments: n };
    }
  }),
  ae(Se, oe);
export {
  D as AuthenticationError,
  k as AuthorizationError,
  ze as Client,
  q as ClientError,
  j as NetworkError,
  H as ProtocolError,
  P as QueryCheckError,
  _ as QueryRuntimeError,
  F as QueryTimeoutError,
  x as ServiceError,
  L as ServiceInternalError,
  B as ServiceTimeoutError,
  U as ThrottlingError,
  Ve as endpoints,
  Lr as fql,
};
//# sourceMappingURL=index.js.map
