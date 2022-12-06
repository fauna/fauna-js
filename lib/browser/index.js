var Bt = Object.create;
var We = Object.defineProperty;
var jt = Object.getOwnPropertyDescriptor;
var qt = Object.getOwnPropertyNames;
var kt = Object.getPrototypeOf,
  Ht = Object.prototype.hasOwnProperty;
var Ke = (e, t) => () => (t || e((t = { exports: {} }).exports, t), t.exports);
var Qt = (e, t, r, n) => {
  if ((t && typeof t == "object") || typeof t == "function")
    for (let s of qt(t))
      !Ht.call(e, s) &&
        s !== r &&
        We(e, s, {
          get: () => t[s],
          enumerable: !(n = jt(t, s)) || n.enumerable,
        });
  return e;
};
var $e = (e, t, r) => (
  (r = e != null ? Bt(kt(e)) : {}),
  Qt(
    t || !e || !e.__esModule
      ? We(r, "default", { value: e, enumerable: !0 })
      : r,
    e
  )
);
var Se = (e, t, r) => {
  if (!t.has(e)) throw TypeError("Cannot " + r);
};
var g = (e, t, r) => (
    Se(e, t, "read from private field"), r ? r.call(e) : t.get(e)
  ),
  O = (e, t, r) => {
    if (t.has(e))
      throw TypeError("Cannot add the same private member more than once");
    t instanceof WeakSet ? t.add(e) : t.set(e, r);
  },
  V = (e, t, r, n) => (
    Se(e, t, "write to private field"), n ? n.call(e, r) : t.set(e, r), r
  );
var w = (e, t, r) => (Se(e, t, "access private method"), r);
var Xe = Ke((qr, be) => {
  be.exports = ve;
  be.exports.HttpsAgent = ve;
  function ve() {}
});
var it = Ke((Mr, ot) => {
  ot.exports = typeof self == "object" ? self.FormData : window.FormData;
});
var Ee = $e(Xe());
function z(e, t) {
  return function () {
    return e.apply(t, arguments);
  };
}
var { toString: Ge } = Object.prototype,
  { getPrototypeOf: Te } = Object,
  Ae = ((e) => (t) => {
    let r = Ge.call(t);
    return e[r] || (e[r] = r.slice(8, -1).toLowerCase());
  })(Object.create(null)),
  T = (e) => ((e = e.toLowerCase()), (t) => Ae(t) === e),
  ie = (e) => (t) => typeof t === e,
  { isArray: W } = Array,
  ge = ie("undefined");
function It(e) {
  return (
    e !== null &&
    !ge(e) &&
    e.constructor !== null &&
    !ge(e.constructor) &&
    q(e.constructor.isBuffer) &&
    e.constructor.isBuffer(e)
  );
}
var Ze = T("ArrayBuffer");
function Jt(e) {
  let t;
  return (
    typeof ArrayBuffer < "u" && ArrayBuffer.isView
      ? (t = ArrayBuffer.isView(e))
      : (t = e && e.buffer && Ze(e.buffer)),
    t
  );
}
var Mt = ie("string"),
  q = ie("function"),
  et = ie("number"),
  tt = (e) => e !== null && typeof e == "object",
  Vt = (e) => e === !0 || e === !1,
  oe = (e) => {
    if (Ae(e) !== "object") return !1;
    let t = Te(e);
    return (
      (t === null ||
        t === Object.prototype ||
        Object.getPrototypeOf(t) === null) &&
      !(Symbol.toStringTag in e) &&
      !(Symbol.iterator in e)
    );
  },
  zt = T("Date"),
  Wt = T("File"),
  Kt = T("Blob"),
  $t = T("FileList"),
  vt = (e) => tt(e) && q(e.pipe),
  Xt = (e) => {
    let t = "[object FormData]";
    return (
      e &&
      ((typeof FormData == "function" && e instanceof FormData) ||
        Ge.call(e) === t ||
        (q(e.toString) && e.toString() === t))
    );
  },
  Yt = T("URLSearchParams"),
  Gt = (e) =>
    e.trim ? e.trim() : e.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, "");
function ae(e, t, { allOwnKeys: r = !1 } = {}) {
  if (e === null || typeof e > "u") return;
  let n, s;
  if ((typeof e != "object" && (e = [e]), W(e)))
    for (n = 0, s = e.length; n < s; n++) t.call(null, e[n], n, e);
  else {
    let i = r ? Object.getOwnPropertyNames(e) : Object.keys(e),
      o = i.length,
      c;
    for (n = 0; n < o; n++) (c = i[n]), t.call(null, e[c], c, e);
  }
}
function Oe() {
  let e = {},
    t = (r, n) => {
      oe(e[n]) && oe(r)
        ? (e[n] = Oe(e[n], r))
        : oe(r)
        ? (e[n] = Oe({}, r))
        : W(r)
        ? (e[n] = r.slice())
        : (e[n] = r);
    };
  for (let r = 0, n = arguments.length; r < n; r++)
    arguments[r] && ae(arguments[r], t);
  return e;
}
var Zt = (e, t, r, { allOwnKeys: n } = {}) => (
    ae(
      t,
      (s, i) => {
        r && q(s) ? (e[i] = z(s, r)) : (e[i] = s);
      },
      { allOwnKeys: n }
    ),
    e
  ),
  er = (e) => (e.charCodeAt(0) === 65279 && (e = e.slice(1)), e),
  tr = (e, t, r, n) => {
    (e.prototype = Object.create(t.prototype, n)),
      (e.prototype.constructor = e),
      Object.defineProperty(e, "super", { value: t.prototype }),
      r && Object.assign(e.prototype, r);
  },
  rr = (e, t, r, n) => {
    let s,
      i,
      o,
      c = {};
    if (((t = t || {}), e == null)) return t;
    do {
      for (s = Object.getOwnPropertyNames(e), i = s.length; i-- > 0; )
        (o = s[i]), (!n || n(o, e, t)) && !c[o] && ((t[o] = e[o]), (c[o] = !0));
      e = r !== !1 && Te(e);
    } while (e && (!r || r(e, t)) && e !== Object.prototype);
    return t;
  },
  nr = (e, t, r) => {
    (e = String(e)),
      (r === void 0 || r > e.length) && (r = e.length),
      (r -= t.length);
    let n = e.indexOf(t, r);
    return n !== -1 && n === r;
  },
  sr = (e) => {
    if (!e) return null;
    if (W(e)) return e;
    let t = e.length;
    if (!et(t)) return null;
    let r = new Array(t);
    for (; t-- > 0; ) r[t] = e[t];
    return r;
  },
  or = (
    (e) => (t) =>
      e && t instanceof e
  )(typeof Uint8Array < "u" && Te(Uint8Array)),
  ir = (e, t) => {
    let n = (e && e[Symbol.iterator]).call(e),
      s;
    for (; (s = n.next()) && !s.done; ) {
      let i = s.value;
      t.call(e, i[0], i[1]);
    }
  },
  ar = (e, t) => {
    let r,
      n = [];
    for (; (r = e.exec(t)) !== null; ) n.push(r);
    return n;
  },
  ur = T("HTMLFormElement"),
  cr = (e) =>
    e.toLowerCase().replace(/[_-\s]([a-z\d])(\w*)/g, function (r, n, s) {
      return n.toUpperCase() + s;
    }),
  Ye = (
    ({ hasOwnProperty: e }) =>
    (t, r) =>
      e.call(t, r)
  )(Object.prototype),
  lr = T("RegExp"),
  rt = (e, t) => {
    let r = Object.getOwnPropertyDescriptors(e),
      n = {};
    ae(r, (s, i) => {
      t(s, i, e) !== !1 && (n[i] = s);
    }),
      Object.defineProperties(e, n);
  },
  fr = (e) => {
    rt(e, (t, r) => {
      let n = e[r];
      if (!!q(n)) {
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
  mr = (e, t) => {
    let r = {},
      n = (s) => {
        s.forEach((i) => {
          r[i] = !0;
        });
      };
    return W(e) ? n(e) : n(String(e).split(t)), r;
  },
  pr = () => {},
  dr = (e, t) => ((e = +e), Number.isFinite(e) ? e : t),
  a = {
    isArray: W,
    isArrayBuffer: Ze,
    isBuffer: It,
    isFormData: Xt,
    isArrayBufferView: Jt,
    isString: Mt,
    isNumber: et,
    isBoolean: Vt,
    isObject: tt,
    isPlainObject: oe,
    isUndefined: ge,
    isDate: zt,
    isFile: Wt,
    isBlob: Kt,
    isRegExp: lr,
    isFunction: q,
    isStream: vt,
    isURLSearchParams: Yt,
    isTypedArray: or,
    isFileList: $t,
    forEach: ae,
    merge: Oe,
    extend: Zt,
    trim: Gt,
    stripBOM: er,
    inherits: tr,
    toFlatObject: rr,
    kindOf: Ae,
    kindOfTest: T,
    endsWith: nr,
    toArray: sr,
    forEachEntry: ir,
    matchAll: ar,
    isHTMLForm: ur,
    hasOwnProperty: Ye,
    hasOwnProp: Ye,
    reduceDescriptors: rt,
    freezeMethods: fr,
    toObjectSet: mr,
    toCamelCase: cr,
    noop: pr,
    toFiniteNumber: dr,
  };
function k(e, t, r, n, s) {
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
a.inherits(k, Error, {
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
var nt = k.prototype,
  st = {};
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
  st[e] = { value: e };
});
Object.defineProperties(k, st);
Object.defineProperty(nt, "isAxiosError", { value: !0 });
k.from = (e, t, r, n, s, i) => {
  let o = Object.create(nt);
  return (
    a.toFlatObject(
      e,
      o,
      function (l) {
        return l !== Error.prototype;
      },
      (c) => c !== "isAxiosError"
    ),
    k.call(o, e.message, t, r, n, s),
    (o.cause = e),
    (o.name = e.name),
    i && Object.assign(o, i),
    o
  );
};
var d = k;
var at = $e(it(), 1),
  ut = at.default;
function Ne(e) {
  return a.isPlainObject(e) || a.isArray(e);
}
function lt(e) {
  return a.endsWith(e, "[]") ? e.slice(0, -2) : e;
}
function ct(e, t, r) {
  return e
    ? e
        .concat(t)
        .map(function (s, i) {
          return (s = lt(s)), !r && i ? "[" + s + "]" : s;
        })
        .join(r ? "." : "")
    : t;
}
function hr(e) {
  return a.isArray(e) && !e.some(Ne);
}
var yr = a.toFlatObject(a, {}, null, function (t) {
  return /^is[A-Z]/.test(t);
});
function Er(e) {
  return (
    e &&
    a.isFunction(e.append) &&
    e[Symbol.toStringTag] === "FormData" &&
    e[Symbol.iterator]
  );
}
function Rr(e, t, r) {
  if (!a.isObject(e)) throw new TypeError("target must be an object");
  (t = t || new (ut || FormData)()),
    (r = a.toFlatObject(
      r,
      { metaTokens: !0, dots: !1, indexes: !1 },
      !1,
      function (y, F) {
        return !a.isUndefined(F[y]);
      }
    ));
  let n = r.metaTokens,
    s = r.visitor || m,
    i = r.dots,
    o = r.indexes,
    l = (r.Blob || (typeof Blob < "u" && Blob)) && Er(t);
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
  function m(f, y, F) {
    let b = f;
    if (f && !F && typeof f == "object") {
      if (a.endsWith(y, "{}"))
        (y = n ? y : y.slice(0, -2)), (f = JSON.stringify(f));
      else if (
        (a.isArray(f) && hr(f)) ||
        a.isFileList(f) ||
        (a.endsWith(y, "[]") && (b = a.toArray(f)))
      )
        return (
          (y = lt(y)),
          b.forEach(function (we, Lt) {
            !a.isUndefined(we) &&
              t.append(
                o === !0 ? ct([y], Lt, i) : o === null ? y : y + "[]",
                u(we)
              );
          }),
          !1
        );
    }
    return Ne(f) ? !0 : (t.append(ct(F, y, i), u(f)), !1);
  }
  let E = [],
    h = Object.assign(yr, {
      defaultVisitor: m,
      convertValue: u,
      isVisitable: Ne,
    });
  function p(f, y) {
    if (!a.isUndefined(f)) {
      if (E.indexOf(f) !== -1)
        throw Error("Circular reference detected in " + y.join("."));
      E.push(f),
        a.forEach(f, function (b, j) {
          (!a.isUndefined(b) &&
            s.call(t, b, a.isString(j) ? j.trim() : j, y, h)) === !0 &&
            p(b, y ? y.concat(j) : [j]);
        }),
        E.pop();
    }
  }
  if (!a.isObject(e)) throw new TypeError("data must be an object");
  return p(e), t;
}
var N = Rr;
function ft(e) {
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
function mt(e, t) {
  (this._pairs = []), e && N(e, this, t);
}
var pt = mt.prototype;
pt.append = function (t, r) {
  this._pairs.push([t, r]);
};
pt.toString = function (t) {
  let r = t
    ? function (n) {
        return t.call(this, n, ft);
      }
    : ft;
  return this._pairs
    .map(function (s) {
      return r(s[0]) + "=" + r(s[1]);
    }, "")
    .join("&");
};
var ue = mt;
function xr(e) {
  return encodeURIComponent(e)
    .replace(/%3A/gi, ":")
    .replace(/%24/g, "$")
    .replace(/%2C/gi, ",")
    .replace(/%20/g, "+")
    .replace(/%5B/gi, "[")
    .replace(/%5D/gi, "]");
}
function K(e, t, r) {
  if (!t) return e;
  let n = e.indexOf("#");
  n !== -1 && (e = e.slice(0, n));
  let s = (r && r.encode) || xr,
    i = a.isURLSearchParams(t) ? t.toString() : new ue(t, r).toString(s);
  return i && (e += (e.indexOf("?") === -1 ? "?" : "&") + i), e;
}
var Ce = class {
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
  _e = Ce;
var ce = {
  silentJSONParsing: !0,
  forcedJSONParsing: !0,
  clarifyTimeoutError: !1,
};
var dt = typeof URLSearchParams < "u" ? URLSearchParams : ue;
var ht = FormData;
var wr = (() => {
    let e;
    return typeof navigator < "u" &&
      ((e = navigator.product) === "ReactNative" ||
        e === "NativeScript" ||
        e === "NS")
      ? !1
      : typeof window < "u" && typeof document < "u";
  })(),
  R = {
    isBrowser: !0,
    classes: { URLSearchParams: dt, FormData: ht, Blob },
    isStandardBrowserEnv: wr,
    protocols: ["http", "https", "file", "blob", "url", "data"],
  };
function Pe(e, t) {
  return N(
    e,
    new R.classes.URLSearchParams(),
    Object.assign(
      {
        visitor: function (r, n, s, i) {
          return R.isNode && a.isBuffer(r)
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
function br(e) {
  let t = {},
    r = Object.keys(e),
    n,
    s = r.length,
    i;
  for (n = 0; n < s; n++) (i = r[n]), (t[i] = e[i]);
  return t;
}
function gr(e) {
  function t(r, n, s, i) {
    let o = r[i++],
      c = Number.isFinite(+o),
      l = i >= r.length;
    return (
      (o = !o && a.isArray(s) ? s.length : o),
      l
        ? (a.hasOwnProp(s, o) ? (s[o] = [s[o], n]) : (s[o] = n), !c)
        : ((!s[o] || !a.isObject(s[o])) && (s[o] = []),
          t(r, n, s[o], i) && a.isArray(s[o]) && (s[o] = br(s[o])),
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
var le = gr;
function Fe(e, t, r) {
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
var yt = R.isStandardBrowserEnv
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
function De(e) {
  return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(e);
}
function Ue(e, t) {
  return t ? e.replace(/\/+$/, "") + "/" + t.replace(/^\/+/, "") : e;
}
function $(e, t) {
  return e && !De(t) ? Ue(e, t) : t;
}
var Et = R.isStandardBrowserEnv
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
function Rt(e, t, r) {
  d.call(this, e ?? "canceled", d.ERR_CANCELED, t, r),
    (this.name = "CanceledError");
}
a.inherits(Rt, d, { __CANCEL__: !0 });
var C = Rt;
function Le(e) {
  let t = /^([-+\w]{1,25})(:?\/\/|:)/.exec(e);
  return (t && t[1]) || "";
}
var Or = a.toObjectSet([
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
  xt = (e) => {
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
              !(!r || (t[r] && Or[r])) &&
                (r === "set-cookie"
                  ? t[r]
                    ? t[r].push(n)
                    : (t[r] = [n])
                  : (t[r] = t[r] ? t[r] + ", " + n : n));
          }),
      t
    );
  };
var wt = Symbol("internals"),
  bt = Symbol("defaults");
function X(e) {
  return e && String(e).trim().toLowerCase();
}
function fe(e) {
  return e === !1 || e == null ? e : String(e);
}
function Tr(e) {
  let t = Object.create(null),
    r = /([^\s,;=]+)\s*(?:=\s*([^,;]+))?/g,
    n;
  for (; (n = r.exec(e)); ) t[n[1]] = n[2];
  return t;
}
function St(e, t, r, n) {
  if (a.isFunction(n)) return n.call(this, t, r);
  if (!!a.isString(t)) {
    if (a.isString(n)) return t.indexOf(n) !== -1;
    if (a.isRegExp(n)) return n.test(t);
  }
}
function Ar(e) {
  return e
    .trim()
    .toLowerCase()
    .replace(/([a-z\d])(\w*)/g, (t, r, n) => r.toUpperCase() + n);
}
function Nr(e, t) {
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
function v(e, t) {
  t = t.toLowerCase();
  let r = Object.keys(e),
    n = r.length,
    s;
  for (; n-- > 0; ) if (((s = r[n]), t === s.toLowerCase())) return s;
  return null;
}
function H(e, t) {
  e && this.set(e), (this[bt] = t || null);
}
Object.assign(H.prototype, {
  set: function (e, t, r) {
    let n = this;
    function s(i, o, c) {
      let l = X(o);
      if (!l) throw new Error("header name must be a non-empty string");
      let u = v(n, l);
      (u && c !== !0 && (n[u] === !1 || c === !1)) ||
        (a.isArray(i) ? (i = i.map(fe)) : (i = fe(i)), (n[u || o] = i));
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
    if (((e = X(e)), !e)) return;
    let r = v(this, e);
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
    if (((e = X(e)), e)) {
      let r = v(this, e);
      return !!(r && (!t || St(this, this[r], r, t)));
    }
    return !1;
  },
  delete: function (e, t) {
    let r = this,
      n = !1;
    function s(i) {
      if (((i = X(i)), i)) {
        let o = v(r, i);
        o && (!t || St(r, r[o], o, t)) && (delete r[o], (n = !0));
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
        let i = v(r, s);
        if (i) {
          (t[i] = fe(n)), delete t[s];
          return;
        }
        let o = e ? Ar(s) : String(s).trim();
        o !== s && delete t[s], (t[o] = fe(n)), (r[o] = !0);
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
Object.assign(H, {
  from: function (e) {
    return a.isString(e)
      ? new this(xt(e))
      : e instanceof this
      ? e
      : new this(e);
  },
  accessor: function (e) {
    let r = (this[wt] = this[wt] = { accessors: {} }).accessors,
      n = this.prototype;
    function s(i) {
      let o = X(i);
      r[o] || (Nr(n, i), (r[o] = !0));
    }
    return a.isArray(e) ? e.forEach(s) : s(e), this;
  },
});
H.accessor([
  "Content-Type",
  "Content-Length",
  "Accept",
  "Accept-Encoding",
  "User-Agent",
]);
a.freezeMethods(H.prototype);
a.freezeMethods(H);
var S = H;
function Cr(e, t) {
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
var gt = Cr;
function Ot(e, t) {
  let r = 0,
    n = gt(50, 250);
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
function Y(e) {
  return new Promise(function (r, n) {
    let s = e.data,
      i = S.from(e.headers).normalize(),
      o = e.responseType,
      c;
    function l() {
      e.cancelToken && e.cancelToken.unsubscribe(c),
        e.signal && e.signal.removeEventListener("abort", c);
    }
    a.isFormData(s) && R.isStandardBrowserEnv && i.setContentType(!1);
    let u = new XMLHttpRequest();
    if (e.auth) {
      let p = e.auth.username || "",
        f = e.auth.password
          ? unescape(encodeURIComponent(e.auth.password))
          : "";
      i.set("Authorization", "Basic " + btoa(p + ":" + f));
    }
    let m = $(e.baseURL, e.url);
    u.open(e.method.toUpperCase(), K(m, e.params, e.paramsSerializer), !0),
      (u.timeout = e.timeout);
    function E() {
      if (!u) return;
      let p = S.from("getAllResponseHeaders" in u && u.getAllResponseHeaders()),
        y = {
          data:
            !o || o === "text" || o === "json" ? u.responseText : u.response,
          status: u.status,
          statusText: u.statusText,
          headers: p,
          config: e,
          request: u,
        };
      Fe(
        function (b) {
          r(b), l();
        },
        function (b) {
          n(b), l();
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
          y = e.transitional || ce;
        e.timeoutErrorMessage && (f = e.timeoutErrorMessage),
          n(
            new d(f, y.clarifyTimeoutError ? d.ETIMEDOUT : d.ECONNABORTED, e, u)
          ),
          (u = null);
      }),
      R.isStandardBrowserEnv)
    ) {
      let p =
        (e.withCredentials || Et(m)) &&
        e.xsrfCookieName &&
        yt.read(e.xsrfCookieName);
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
            (n(!p || p.type ? new C(null, e, u) : p), u.abort(), (u = null));
        }),
        e.cancelToken && e.cancelToken.subscribe(c),
        e.signal &&
          (e.signal.aborted ? c() : e.signal.addEventListener("abort", c)));
    let h = Le(m);
    if (h && R.protocols.indexOf(h) === -1) {
      n(new d("Unsupported protocol " + h + ":", d.ERR_BAD_REQUEST, e));
      return;
    }
    u.send(s || null);
  });
}
var Tt = { http: Y, xhr: Y },
  Be = {
    getAdapter: (e) => {
      if (a.isString(e)) {
        let t = Tt[e];
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
    adapters: Tt,
  };
var _r = { "Content-Type": "application/x-www-form-urlencoded" };
function Pr() {
  let e;
  return (
    typeof XMLHttpRequest < "u"
      ? (e = Be.getAdapter("xhr"))
      : typeof process < "u" &&
        a.kindOf(process) === "process" &&
        (e = Be.getAdapter("http")),
    e
  );
}
function Fr(e, t, r) {
  if (a.isString(e))
    try {
      return (t || JSON.parse)(e), a.trim(e);
    } catch (n) {
      if (n.name !== "SyntaxError") throw n;
    }
  return (r || JSON.stringify)(e);
}
var me = {
  transitional: ce,
  adapter: Pr(),
  transformRequest: [
    function (t, r) {
      let n = r.getContentType() || "",
        s = n.indexOf("application/json") > -1,
        i = a.isObject(t);
      if ((i && a.isHTMLForm(t) && (t = new FormData(t)), a.isFormData(t)))
        return s && s ? JSON.stringify(le(t)) : t;
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
          return Pe(t, this.formSerializer).toString();
        if ((c = a.isFileList(t)) || n.indexOf("multipart/form-data") > -1) {
          let l = this.env && this.env.FormData;
          return N(c ? { "files[]": t } : t, l && new l(), this.formSerializer);
        }
      }
      return i || s ? (r.setContentType("application/json", !1), Fr(t)) : t;
    },
  ],
  transformResponse: [
    function (t) {
      let r = this.transitional || me.transitional,
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
  env: { FormData: R.classes.FormData, Blob: R.classes.Blob },
  validateStatus: function (t) {
    return t >= 200 && t < 300;
  },
  headers: { common: { Accept: "application/json, text/plain, */*" } },
};
a.forEach(["delete", "get", "head"], function (t) {
  me.headers[t] = {};
});
a.forEach(["post", "put", "patch"], function (t) {
  me.headers[t] = a.merge(_r);
});
var Q = me;
function G(e, t) {
  let r = this || Q,
    n = t || r,
    s = S.from(n.headers),
    i = n.data;
  return (
    a.forEach(e, function (c) {
      i = c.call(r, i, s.normalize(), t ? t.status : void 0);
    }),
    s.normalize(),
    i
  );
}
function Z(e) {
  return !!(e && e.__CANCEL__);
}
function je(e) {
  if (
    (e.cancelToken && e.cancelToken.throwIfRequested(),
    e.signal && e.signal.aborted)
  )
    throw new C();
}
function pe(e) {
  return (
    je(e),
    (e.headers = S.from(e.headers)),
    (e.data = G.call(e, e.transformRequest)),
    (e.adapter || Q.adapter)(e).then(
      function (n) {
        return (
          je(e),
          (n.data = G.call(e, e.transformResponse, n)),
          (n.headers = S.from(n.headers)),
          n
        );
      },
      function (n) {
        return (
          Z(n) ||
            (je(e),
            n &&
              n.response &&
              ((n.response.data = G.call(e, e.transformResponse, n.response)),
              (n.response.headers = S.from(n.response.headers)))),
          Promise.reject(n)
        );
      }
    )
  );
}
function _(e, t) {
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
var de = "1.1.2";
var qe = {};
["object", "boolean", "number", "function", "string", "symbol"].forEach(
  (e, t) => {
    qe[e] = function (n) {
      return typeof n === e || "a" + (t < 1 ? "n " : " ") + e;
    };
  }
);
var At = {};
qe.transitional = function (t, r, n) {
  function s(i, o) {
    return (
      "[Axios v" +
      de +
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
        !At[o] &&
        ((At[o] = !0),
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
function Dr(e, t, r) {
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
var ke = { assertOptions: Dr, validators: qe };
var I = ke.validators,
  J = class {
    constructor(t) {
      (this.defaults = t),
        (this.interceptors = { request: new _e(), response: new _e() });
    }
    request(t, r) {
      typeof t == "string" ? ((r = r || {}), (r.url = t)) : (r = t || {}),
        (r = _(this.defaults, r));
      let n = r.transitional;
      n !== void 0 &&
        ke.assertOptions(
          n,
          {
            silentJSONParsing: I.transitional(I.boolean),
            forcedJSONParsing: I.transitional(I.boolean),
            clarifyTimeoutError: I.transitional(I.boolean),
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
        (r.headers = new S(r.headers, s));
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
        let h = [pe.bind(this), void 0];
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
        l = pe.call(this, E);
      } catch (h) {
        return Promise.reject(h);
      }
      for (u = 0, m = c.length; u < m; ) l = l.then(c[u++], c[u++]);
      return l;
    }
    getUri(t) {
      t = _(this.defaults, t);
      let r = $(t.baseURL, t.url);
      return K(r, t.params, t.paramsSerializer);
    }
  };
a.forEach(["delete", "get", "head", "options"], function (t) {
  J.prototype[t] = function (r, n) {
    return this.request(
      _(n || {}, { method: t, url: r, data: (n || {}).data })
    );
  };
});
a.forEach(["post", "put", "patch"], function (t) {
  function r(n) {
    return function (i, o, c) {
      return this.request(
        _(c || {}, {
          method: t,
          headers: n ? { "Content-Type": "multipart/form-data" } : {},
          url: i,
          data: o,
        })
      );
    };
  }
  (J.prototype[t] = r()), (J.prototype[t + "Form"] = r(!0));
});
var ee = J;
var te = class {
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
          n.reason || ((n.reason = new C(i, o, c)), r(n.reason));
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
        token: new te(function (s) {
          t = s;
        }),
        cancel: t,
      };
    }
  },
  Nt = te;
function He(e) {
  return function (r) {
    return e.apply(null, r);
  };
}
function Qe(e) {
  return a.isObject(e) && e.isAxiosError === !0;
}
function Ct(e) {
  let t = new ee(e),
    r = z(ee.prototype.request, t);
  return (
    a.extend(r, ee.prototype, t, { allOwnKeys: !0 }),
    a.extend(r, t, null, { allOwnKeys: !0 }),
    (r.create = function (s) {
      return Ct(_(e, s));
    }),
    r
  );
}
var x = Ct(Q);
x.Axios = ee;
x.CanceledError = C;
x.CancelToken = Nt;
x.isCancel = Z;
x.VERSION = de;
x.toFormData = N;
x.AxiosError = d;
x.Cancel = x.CanceledError;
x.all = function (t) {
  return Promise.all(t);
};
x.spread = He;
x.isAxiosError = Qe;
x.formToJSON = (e) => le(a.isHTMLForm(e) ? new FormData(e) : e);
var _t = x;
var Pt = _t;
var Ie = {
  cloud: new URL("https://db.fauna.com"),
  preview: new URL("https://db.fauna-preview.com"),
  local: new URL("http://localhost:8443"),
  localhost: new URL("http://localhost:8443"),
};
var D = class extends Error {
    constructor(r) {
      super(r.message);
      Error.captureStackTrace && Error.captureStackTrace(this, D),
        (this.name = "ServiceError"),
        (this.code = r.code),
        (this.httpStatus = r.httpStatus),
        r.summary && (this.summary = r.summary);
    }
  },
  U = class extends Error {
    constructor(t, r) {
      super(t, r),
        Error.captureStackTrace && Error.captureStackTrace(this, U),
        (this.name = "ClientError");
    }
  },
  L = class extends Error {
    constructor(t, r) {
      super(t, r),
        Error.captureStackTrace && Error.captureStackTrace(this, L),
        (this.name = "NetworkError");
    }
  },
  B = class extends Error {
    constructor(r) {
      super(r.message);
      Error.captureStackTrace && Error.captureStackTrace(this, B),
        (this.name = "ProtocolError"),
        (this.httpStatus = r.httpStatus);
    }
  };
var Ur = { max_conns: 10, endpoint: Ie.cloud, timeout_ms: 6e4 },
  A,
  he,
  Ft,
  re,
  Me,
  ye,
  Dt,
  ne,
  Ve,
  Je = class {
    constructor(t) {
      O(this, he);
      O(this, re);
      O(this, ye);
      O(this, ne);
      O(this, A, void 0);
      this.clientConfiguration = {
        ...Ur,
        ...t,
        secret: w(this, he, Ft).call(this, t),
      };
      let r = this.clientConfiguration.timeout_ms + 1e4,
        n = {
          maxSockets: this.clientConfiguration.max_conns,
          maxFreeSockets: this.clientConfiguration.max_conns,
          timeout: r,
          freeSocketTimeout: 4e3,
          keepAlive: !0,
        };
      (this.client = Pt.create({
        baseURL: this.clientConfiguration.endpoint.toString(),
        timeout: r,
      })),
        (this.client.defaults.httpAgent = new Ee.default(n)),
        (this.client.defaults.httpsAgent = new Ee.HttpsAgent(n)),
        (this.client.defaults.headers.common.Authorization = `Bearer ${this.clientConfiguration.secret}`),
        (this.client.defaults.headers.common["Content-Type"] =
          "application/json"),
        w(this, ne, Ve).call(
          this,
          this.clientConfiguration,
          this.client.defaults.headers.common
        );
    }
    async query(t, r) {
      return "query" in t
        ? w(this, re, Me).call(this, { ...t, ...r })
        : w(this, re, Me).call(this, t.toQuery(r));
    }
  };
(A = new WeakMap()),
  (he = new WeakSet()),
  (Ft = function (t) {
    let r;
    typeof process == "object" && (r = process.env.FAUNA_SECRET);
    let n = t?.secret || r;
    if (n === void 0)
      throw new Error(
        "You must provide a secret to the driver. Set it in an environmental variable named FAUNA_SECRET or pass it to the Client constructor."
      );
    return n;
  }),
  (re = new WeakSet()),
  (Me = async function (t) {
    let { query: r, arguments: n } = t,
      s = {};
    w(this, ne, Ve).call(this, t, s);
    try {
      let i = await this.client.post(
          "/query/1",
          { query: r, arguments: n },
          { headers: s }
        ),
        o = new Date(i.data.txn_time);
      return (
        ((g(this, A) === void 0 && i.data.txn_time !== void 0) ||
          (i.data.txn_time !== void 0 &&
            g(this, A) !== void 0 &&
            g(this, A) < o)) &&
          V(this, A, o),
        i.data
      );
    } catch (i) {
      throw w(this, ye, Dt).call(this, i);
    }
  }),
  (ye = new WeakSet()),
  (Dt = function (t) {
    if (t.response) {
      if (t.response.data?.error) {
        let r = t.response.data.error;
        return (
          r.summary === void 0 &&
            t.response.data.summary !== void 0 &&
            (r.summary = t.response.data.summary),
          new D({ httpStatus: t.response.status, ...r })
        );
      }
      return new B({ message: t.message, httpStatus: t.response.status });
    }
    return t.request?.status === 0 ||
      t.request?.socket?.connecting ||
      Lr.includes(t.code) ||
      t.message === "Network Error"
      ? new L("The network connection encountered a problem.", { cause: t })
      : new U("A client level error occurred. Fauna was not called.", {
          cause: t,
        });
  }),
  (ne = new WeakSet()),
  (Ve = function (t, r) {
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
      g(this, A) !== void 0 &&
      (r["x-last-txn"] = g(this, A).toISOString());
  });
var Lr = [
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
function Br(e, ...t) {
  return Re.create(e, ...t);
}
var P,
  se,
  ze,
  xe,
  Ut,
  M = class {
    constructor(t) {
      O(this, xe);
      O(this, P, void 0);
      var r;
      if ("queryFragments" in t) {
        if (
          t.queryFragments.length === 0 ||
          t.queryFragments.length !== t.queryArgs.length + 1
        )
          throw new Error("invalid query constructed");
        V(this, P, {
          ...t,
          queryArgs: w((r = M), se, ze).call(r, t.queryArgs),
        });
      } else V(this, P, t);
    }
    static create(t, ...r) {
      var n;
      return new M({
        queryFragments: t,
        queryArgs: w((n = M), se, ze).call(n, r),
      });
    }
    toQuery(t = {}, r = 0) {
      return { ...w(this, xe, Ut).call(this, r), ...t };
    }
  },
  Re = M;
(P = new WeakMap()),
  (se = new WeakSet()),
  (ze = function (t) {
    return t.map((r) =>
      typeof r?.toQuery == "function" ? r : new M({ json: r })
    );
  }),
  (xe = new WeakSet()),
  (Ut = function (t = 0) {
    if ("queryFragments" in g(this, P)) {
      let { queryFragments: r, queryArgs: n } = g(this, P),
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
      return (n[r] = g(this, P).json), { query: `${r}`, arguments: n };
    }
  }),
  O(Re, se);
export {
  Je as Client,
  U as ClientError,
  L as NetworkError,
  B as ProtocolError,
  D as ServiceError,
  Ie as endpoints,
  Br as fql,
};
//# sourceMappingURL=index.js.map
