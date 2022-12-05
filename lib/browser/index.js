var zt = Object.create;
var tt = Object.defineProperty;
var vt = Object.getOwnPropertyDescriptor;
var Wt = Object.getOwnPropertyNames;
var Kt = Object.getPrototypeOf,
  $t = Object.prototype.hasOwnProperty;
var rt = (e, t) => () => (t || e((t = { exports: {} }).exports, t), t.exports);
var Xt = (e, t, r, n) => {
  if ((t && typeof t == "object") || typeof t == "function")
    for (let s of Wt(t))
      !$t.call(e, s) &&
        s !== r &&
        tt(e, s, {
          get: () => t[s],
          enumerable: !(n = vt(t, s)) || n.enumerable,
        });
  return e;
};
var nt = (e, t, r) => (
  (r = e != null ? zt(Kt(e)) : {}),
  Xt(
    t || !e || !e.__esModule
      ? tt(r, "default", { value: e, enumerable: !0 })
      : r,
    e
  )
);
var Pe = (e, t, r) => {
  if (!t.has(e)) throw TypeError("Cannot " + r);
};
var O = (e, t, r) => (
    Pe(e, t, "read from private field"), r ? r.call(e) : t.get(e)
  ),
  w = (e, t, r) => {
    if (t.has(e))
      throw TypeError("Cannot add the same private member more than once");
    t instanceof WeakSet ? t.add(e) : t.set(e, r);
  },
  G = (e, t, r, n) => (
    Pe(e, t, "write to private field"), n ? n.call(e, r) : t.set(e, r), r
  );
var R = (e, t, r) => (Pe(e, t, "access private method"), r);
var ot = rt((Kr, Fe) => {
  Fe.exports = st;
  Fe.exports.HttpsAgent = st;
  function st() {}
});
var ht = rt((en, dt) => {
  dt.exports = typeof self == "object" ? self.FormData : window.FormData;
});
var Ae = nt(ot());
function Z(e, t) {
  return function () {
    return e.apply(t, arguments);
  };
}
var { toString: at } = Object.prototype,
  { getPrototypeOf: Ue } = Object,
  Le = ((e) => (t) => {
    let r = at.call(t);
    return e[r] || (e[r] = r.slice(8, -1).toLowerCase());
  })(Object.create(null)),
  A = (e) => ((e = e.toLowerCase()), (t) => Le(t) === e),
  de = (e) => (t) => typeof t === e,
  { isArray: ee } = Array,
  De = de("undefined");
function Yt(e) {
  return (
    e !== null &&
    !De(e) &&
    e.constructor !== null &&
    !De(e.constructor) &&
    z(e.constructor.isBuffer) &&
    e.constructor.isBuffer(e)
  );
}
var ut = A("ArrayBuffer");
function Gt(e) {
  let t;
  return (
    typeof ArrayBuffer < "u" && ArrayBuffer.isView
      ? (t = ArrayBuffer.isView(e))
      : (t = e && e.buffer && ut(e.buffer)),
    t
  );
}
var Zt = de("string"),
  z = de("function"),
  ct = de("number"),
  lt = (e) => e !== null && typeof e == "object",
  er = (e) => e === !0 || e === !1,
  pe = (e) => {
    if (Le(e) !== "object") return !1;
    let t = Ue(e);
    return (
      (t === null ||
        t === Object.prototype ||
        Object.getPrototypeOf(t) === null) &&
      !(Symbol.toStringTag in e) &&
      !(Symbol.iterator in e)
    );
  },
  tr = A("Date"),
  rr = A("File"),
  nr = A("Blob"),
  sr = A("FileList"),
  or = (e) => lt(e) && z(e.pipe),
  ir = (e) => {
    let t = "[object FormData]";
    return (
      e &&
      ((typeof FormData == "function" && e instanceof FormData) ||
        at.call(e) === t ||
        (z(e.toString) && e.toString() === t))
    );
  },
  ar = A("URLSearchParams"),
  ur = (e) =>
    e.trim ? e.trim() : e.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, "");
function he(e, t, { allOwnKeys: r = !1 } = {}) {
  if (e === null || typeof e > "u") return;
  let n, s;
  if ((typeof e != "object" && (e = [e]), ee(e)))
    for (n = 0, s = e.length; n < s; n++) t.call(null, e[n], n, e);
  else {
    let i = r ? Object.getOwnPropertyNames(e) : Object.keys(e),
      o = i.length,
      c;
    for (n = 0; n < o; n++) (c = i[n]), t.call(null, e[c], c, e);
  }
}
function ke() {
  let e = {},
    t = (r, n) => {
      pe(e[n]) && pe(r)
        ? (e[n] = ke(e[n], r))
        : pe(r)
        ? (e[n] = ke({}, r))
        : ee(r)
        ? (e[n] = r.slice())
        : (e[n] = r);
    };
  for (let r = 0, n = arguments.length; r < n; r++)
    arguments[r] && he(arguments[r], t);
  return e;
}
var cr = (e, t, r, { allOwnKeys: n } = {}) => (
    he(
      t,
      (s, i) => {
        r && z(s) ? (e[i] = Z(s, r)) : (e[i] = s);
      },
      { allOwnKeys: n }
    ),
    e
  ),
  lr = (e) => (e.charCodeAt(0) === 65279 && (e = e.slice(1)), e),
  fr = (e, t, r, n) => {
    (e.prototype = Object.create(t.prototype, n)),
      (e.prototype.constructor = e),
      Object.defineProperty(e, "super", { value: t.prototype }),
      r && Object.assign(e.prototype, r);
  },
  mr = (e, t, r, n) => {
    let s,
      i,
      o,
      c = {};
    if (((t = t || {}), e == null)) return t;
    do {
      for (s = Object.getOwnPropertyNames(e), i = s.length; i-- > 0; )
        (o = s[i]), (!n || n(o, e, t)) && !c[o] && ((t[o] = e[o]), (c[o] = !0));
      e = r !== !1 && Ue(e);
    } while (e && (!r || r(e, t)) && e !== Object.prototype);
    return t;
  },
  pr = (e, t, r) => {
    (e = String(e)),
      (r === void 0 || r > e.length) && (r = e.length),
      (r -= t.length);
    let n = e.indexOf(t, r);
    return n !== -1 && n === r;
  },
  dr = (e) => {
    if (!e) return null;
    if (ee(e)) return e;
    let t = e.length;
    if (!ct(t)) return null;
    let r = new Array(t);
    for (; t-- > 0; ) r[t] = e[t];
    return r;
  },
  hr = (
    (e) => (t) =>
      e && t instanceof e
  )(typeof Uint8Array < "u" && Ue(Uint8Array)),
  yr = (e, t) => {
    let n = (e && e[Symbol.iterator]).call(e),
      s;
    for (; (s = n.next()) && !s.done; ) {
      let i = s.value;
      t.call(e, i[0], i[1]);
    }
  },
  Er = (e, t) => {
    let r,
      n = [];
    for (; (r = e.exec(t)) !== null; ) n.push(r);
    return n;
  },
  gr = A("HTMLFormElement"),
  xr = (e) =>
    e.toLowerCase().replace(/[_-\s]([a-z\d])(\w*)/g, function (r, n, s) {
      return n.toUpperCase() + s;
    }),
  it = (
    ({ hasOwnProperty: e }) =>
    (t, r) =>
      e.call(t, r)
  )(Object.prototype),
  Sr = A("RegExp"),
  ft = (e, t) => {
    let r = Object.getOwnPropertyDescriptors(e),
      n = {};
    he(r, (s, i) => {
      t(s, i, e) !== !1 && (n[i] = s);
    }),
      Object.defineProperties(e, n);
  },
  Rr = (e) => {
    ft(e, (t, r) => {
      let n = e[r];
      if (!!z(n)) {
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
  wr = (e, t) => {
    let r = {},
      n = (s) => {
        s.forEach((i) => {
          r[i] = !0;
        });
      };
    return ee(e) ? n(e) : n(String(e).split(t)), r;
  },
  br = () => {},
  Tr = (e, t) => ((e = +e), Number.isFinite(e) ? e : t),
  a = {
    isArray: ee,
    isArrayBuffer: ut,
    isBuffer: Yt,
    isFormData: ir,
    isArrayBufferView: Gt,
    isString: Zt,
    isNumber: ct,
    isBoolean: er,
    isObject: lt,
    isPlainObject: pe,
    isUndefined: De,
    isDate: tr,
    isFile: rr,
    isBlob: nr,
    isRegExp: Sr,
    isFunction: z,
    isStream: or,
    isURLSearchParams: ar,
    isTypedArray: hr,
    isFileList: sr,
    forEach: he,
    merge: ke,
    extend: cr,
    trim: ur,
    stripBOM: lr,
    inherits: fr,
    toFlatObject: mr,
    kindOf: Le,
    kindOfTest: A,
    endsWith: pr,
    toArray: dr,
    forEachEntry: yr,
    matchAll: Er,
    isHTMLForm: gr,
    hasOwnProperty: it,
    hasOwnProp: it,
    reduceDescriptors: ft,
    freezeMethods: Rr,
    toObjectSet: wr,
    toCamelCase: xr,
    noop: br,
    toFiniteNumber: Tr,
  };
function v(e, t, r, n, s) {
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
a.inherits(v, Error, {
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
var mt = v.prototype,
  pt = {};
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
  pt[e] = { value: e };
});
Object.defineProperties(v, pt);
Object.defineProperty(mt, "isAxiosError", { value: !0 });
v.from = (e, t, r, n, s, i) => {
  let o = Object.create(mt);
  return (
    a.toFlatObject(
      e,
      o,
      function (l) {
        return l !== Error.prototype;
      },
      (c) => c !== "isAxiosError"
    ),
    v.call(o, e.message, t, r, n, s),
    (o.cause = e),
    (o.name = e.name),
    i && Object.assign(o, i),
    o
  );
};
var d = v;
var yt = nt(ht(), 1),
  Et = yt.default;
function Be(e) {
  return a.isPlainObject(e) || a.isArray(e);
}
function xt(e) {
  return a.endsWith(e, "[]") ? e.slice(0, -2) : e;
}
function gt(e, t, r) {
  return e
    ? e
        .concat(t)
        .map(function (s, i) {
          return (s = xt(s)), !r && i ? "[" + s + "]" : s;
        })
        .join(r ? "." : "")
    : t;
}
function Or(e) {
  return a.isArray(e) && !e.some(Be);
}
var Ar = a.toFlatObject(a, {}, null, function (t) {
  return /^is[A-Z]/.test(t);
});
function Nr(e) {
  return (
    e &&
    a.isFunction(e.append) &&
    e[Symbol.toStringTag] === "FormData" &&
    e[Symbol.iterator]
  );
}
function Cr(e, t, r) {
  if (!a.isObject(e)) throw new TypeError("target must be an object");
  (t = t || new (Et || FormData)()),
    (r = a.toFlatObject(
      r,
      { metaTokens: !0, dots: !1, indexes: !1 },
      !1,
      function (y, D) {
        return !a.isUndefined(D[y]);
      }
    ));
  let n = r.metaTokens,
    s = r.visitor || m,
    i = r.dots,
    o = r.indexes,
    l = (r.Blob || (typeof Blob < "u" && Blob)) && Nr(t);
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
  function m(f, y, D) {
    let T = f;
    if (f && !D && typeof f == "object") {
      if (a.endsWith(y, "{}"))
        (y = n ? y : y.slice(0, -2)), (f = JSON.stringify(f));
      else if (
        (a.isArray(f) && Or(f)) ||
        a.isFileList(f) ||
        (a.endsWith(y, "[]") && (T = a.toArray(f)))
      )
        return (
          (y = xt(y)),
          T.forEach(function (_e, Vt) {
            !a.isUndefined(_e) &&
              t.append(
                o === !0 ? gt([y], Vt, i) : o === null ? y : y + "[]",
                u(_e)
              );
          }),
          !1
        );
    }
    return Be(f) ? !0 : (t.append(gt(D, y, i), u(f)), !1);
  }
  let E = [],
    h = Object.assign(Ar, {
      defaultVisitor: m,
      convertValue: u,
      isVisitable: Be,
    });
  function p(f, y) {
    if (!a.isUndefined(f)) {
      if (E.indexOf(f) !== -1)
        throw Error("Circular reference detected in " + y.join("."));
      E.push(f),
        a.forEach(f, function (T, V) {
          (!a.isUndefined(T) &&
            s.call(t, T, a.isString(V) ? V.trim() : V, y, h)) === !0 &&
            p(T, y ? y.concat(V) : [V]);
        }),
        E.pop();
    }
  }
  if (!a.isObject(e)) throw new TypeError("data must be an object");
  return p(e), t;
}
var C = Cr;
function St(e) {
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
function Rt(e, t) {
  (this._pairs = []), e && C(e, this, t);
}
var wt = Rt.prototype;
wt.append = function (t, r) {
  this._pairs.push([t, r]);
};
wt.toString = function (t) {
  let r = t
    ? function (n) {
        return t.call(this, n, St);
      }
    : St;
  return this._pairs
    .map(function (s) {
      return r(s[0]) + "=" + r(s[1]);
    }, "")
    .join("&");
};
var ye = Rt;
function _r(e) {
  return encodeURIComponent(e)
    .replace(/%3A/gi, ":")
    .replace(/%24/g, "$")
    .replace(/%2C/gi, ",")
    .replace(/%20/g, "+")
    .replace(/%5B/gi, "[")
    .replace(/%5D/gi, "]");
}
function te(e, t, r) {
  if (!t) return e;
  let n = e.indexOf("#");
  n !== -1 && (e = e.slice(0, n));
  let s = (r && r.encode) || _r,
    i = a.isURLSearchParams(t) ? t.toString() : new ye(t, r).toString(s);
  return i && (e += (e.indexOf("?") === -1 ? "?" : "&") + i), e;
}
var qe = class {
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
  je = qe;
var Ee = {
  silentJSONParsing: !0,
  forcedJSONParsing: !0,
  clarifyTimeoutError: !1,
};
var bt = typeof URLSearchParams < "u" ? URLSearchParams : ye;
var Tt = FormData;
var Pr = (() => {
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
    classes: { URLSearchParams: bt, FormData: Tt, Blob },
    isStandardBrowserEnv: Pr,
    protocols: ["http", "https", "file", "blob", "url", "data"],
  };
function He(e, t) {
  return C(
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
function Fr(e) {
  return a
    .matchAll(/\w+|\[(\w*)]/g, e)
    .map((t) => (t[0] === "[]" ? "" : t[1] || t[0]));
}
function Dr(e) {
  let t = {},
    r = Object.keys(e),
    n,
    s = r.length,
    i;
  for (n = 0; n < s; n++) (i = r[n]), (t[i] = e[i]);
  return t;
}
function kr(e) {
  function t(r, n, s, i) {
    let o = r[i++],
      c = Number.isFinite(+o),
      l = i >= r.length;
    return (
      (o = !o && a.isArray(s) ? s.length : o),
      l
        ? (a.hasOwnProp(s, o) ? (s[o] = [s[o], n]) : (s[o] = n), !c)
        : ((!s[o] || !a.isObject(s[o])) && (s[o] = []),
          t(r, n, s[o], i) && a.isArray(s[o]) && (s[o] = Dr(s[o])),
          !c)
    );
  }
  if (a.isFormData(e) && a.isFunction(e.entries)) {
    let r = {};
    return (
      a.forEachEntry(e, (n, s) => {
        t(Fr(n), s, r, 0);
      }),
      r
    );
  }
  return null;
}
var ge = kr;
function Qe(e, t, r) {
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
var Ot = g.isStandardBrowserEnv
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
function Ie(e) {
  return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(e);
}
function Je(e, t) {
  return t ? e.replace(/\/+$/, "") + "/" + t.replace(/^\/+/, "") : e;
}
function re(e, t) {
  return e && !Ie(t) ? Je(e, t) : t;
}
var At = g.isStandardBrowserEnv
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
function Nt(e, t, r) {
  d.call(this, e ?? "canceled", d.ERR_CANCELED, t, r),
    (this.name = "CanceledError");
}
a.inherits(Nt, d, { __CANCEL__: !0 });
var _ = Nt;
function Me(e) {
  let t = /^([-+\w]{1,25})(:?\/\/|:)/.exec(e);
  return (t && t[1]) || "";
}
var Ur = a.toObjectSet([
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
  Ct = (e) => {
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
              !(!r || (t[r] && Ur[r])) &&
                (r === "set-cookie"
                  ? t[r]
                    ? t[r].push(n)
                    : (t[r] = [n])
                  : (t[r] = t[r] ? t[r] + ", " + n : n));
          }),
      t
    );
  };
var _t = Symbol("internals"),
  Ft = Symbol("defaults");
function se(e) {
  return e && String(e).trim().toLowerCase();
}
function xe(e) {
  return e === !1 || e == null ? e : String(e);
}
function Lr(e) {
  let t = Object.create(null),
    r = /([^\s,;=]+)\s*(?:=\s*([^,;]+))?/g,
    n;
  for (; (n = r.exec(e)); ) t[n[1]] = n[2];
  return t;
}
function Pt(e, t, r, n) {
  if (a.isFunction(n)) return n.call(this, t, r);
  if (!!a.isString(t)) {
    if (a.isString(n)) return t.indexOf(n) !== -1;
    if (a.isRegExp(n)) return n.test(t);
  }
}
function Br(e) {
  return e
    .trim()
    .toLowerCase()
    .replace(/([a-z\d])(\w*)/g, (t, r, n) => r.toUpperCase() + n);
}
function qr(e, t) {
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
function ne(e, t) {
  t = t.toLowerCase();
  let r = Object.keys(e),
    n = r.length,
    s;
  for (; n-- > 0; ) if (((s = r[n]), t === s.toLowerCase())) return s;
  return null;
}
function W(e, t) {
  e && this.set(e), (this[Ft] = t || null);
}
Object.assign(W.prototype, {
  set: function (e, t, r) {
    let n = this;
    function s(i, o, c) {
      let l = se(o);
      if (!l) throw new Error("header name must be a non-empty string");
      let u = ne(n, l);
      (u && c !== !0 && (n[u] === !1 || c === !1)) ||
        (a.isArray(i) ? (i = i.map(xe)) : (i = xe(i)), (n[u || o] = i));
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
    if (((e = se(e)), !e)) return;
    let r = ne(this, e);
    if (r) {
      let n = this[r];
      if (!t) return n;
      if (t === !0) return Lr(n);
      if (a.isFunction(t)) return t.call(this, n, r);
      if (a.isRegExp(t)) return t.exec(n);
      throw new TypeError("parser must be boolean|regexp|function");
    }
  },
  has: function (e, t) {
    if (((e = se(e)), e)) {
      let r = ne(this, e);
      return !!(r && (!t || Pt(this, this[r], r, t)));
    }
    return !1;
  },
  delete: function (e, t) {
    let r = this,
      n = !1;
    function s(i) {
      if (((i = se(i)), i)) {
        let o = ne(r, i);
        o && (!t || Pt(r, r[o], o, t)) && (delete r[o], (n = !0));
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
        let i = ne(r, s);
        if (i) {
          (t[i] = xe(n)), delete t[s];
          return;
        }
        let o = e ? Br(s) : String(s).trim();
        o !== s && delete t[s], (t[o] = xe(n)), (r[o] = !0);
      }),
      this
    );
  },
  toJSON: function () {
    let e = Object.create(null);
    return (
      a.forEach(Object.assign({}, this[Ft] || null, this), (t, r) => {
        t == null || t === !1 || (e[r] = a.isArray(t) ? t.join(", ") : t);
      }),
      e
    );
  },
});
Object.assign(W, {
  from: function (e) {
    return a.isString(e)
      ? new this(Ct(e))
      : e instanceof this
      ? e
      : new this(e);
  },
  accessor: function (e) {
    let r = (this[_t] = this[_t] = { accessors: {} }).accessors,
      n = this.prototype;
    function s(i) {
      let o = se(i);
      r[o] || (qr(n, i), (r[o] = !0));
    }
    return a.isArray(e) ? e.forEach(s) : s(e), this;
  },
});
W.accessor([
  "Content-Type",
  "Content-Length",
  "Accept",
  "Accept-Encoding",
  "User-Agent",
]);
a.freezeMethods(W.prototype);
a.freezeMethods(W);
var b = W;
function jr(e, t) {
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
var Dt = jr;
function kt(e, t) {
  let r = 0,
    n = Dt(50, 250);
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
function oe(e) {
  return new Promise(function (r, n) {
    let s = e.data,
      i = b.from(e.headers).normalize(),
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
    let m = re(e.baseURL, e.url);
    u.open(e.method.toUpperCase(), te(m, e.params, e.paramsSerializer), !0),
      (u.timeout = e.timeout);
    function E() {
      if (!u) return;
      let p = b.from("getAllResponseHeaders" in u && u.getAllResponseHeaders()),
        y = {
          data:
            !o || o === "text" || o === "json" ? u.responseText : u.response,
          status: u.status,
          statusText: u.statusText,
          headers: p,
          config: e,
          request: u,
        };
      Qe(
        function (T) {
          r(T), l();
        },
        function (T) {
          n(T), l();
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
          y = e.transitional || Ee;
        e.timeoutErrorMessage && (f = e.timeoutErrorMessage),
          n(
            new d(f, y.clarifyTimeoutError ? d.ETIMEDOUT : d.ECONNABORTED, e, u)
          ),
          (u = null);
      }),
      g.isStandardBrowserEnv)
    ) {
      let p =
        (e.withCredentials || At(m)) &&
        e.xsrfCookieName &&
        Ot.read(e.xsrfCookieName);
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
        u.addEventListener("progress", kt(e.onDownloadProgress, !0)),
      typeof e.onUploadProgress == "function" &&
        u.upload &&
        u.upload.addEventListener("progress", kt(e.onUploadProgress)),
      (e.cancelToken || e.signal) &&
        ((c = (p) => {
          !u ||
            (n(!p || p.type ? new _(null, e, u) : p), u.abort(), (u = null));
        }),
        e.cancelToken && e.cancelToken.subscribe(c),
        e.signal &&
          (e.signal.aborted ? c() : e.signal.addEventListener("abort", c)));
    let h = Me(m);
    if (h && g.protocols.indexOf(h) === -1) {
      n(new d("Unsupported protocol " + h + ":", d.ERR_BAD_REQUEST, e));
      return;
    }
    u.send(s || null);
  });
}
var Ut = { http: oe, xhr: oe },
  Ve = {
    getAdapter: (e) => {
      if (a.isString(e)) {
        let t = Ut[e];
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
    adapters: Ut,
  };
var Hr = { "Content-Type": "application/x-www-form-urlencoded" };
function Qr() {
  let e;
  return (
    typeof XMLHttpRequest < "u"
      ? (e = Ve.getAdapter("xhr"))
      : typeof process < "u" &&
        a.kindOf(process) === "process" &&
        (e = Ve.getAdapter("http")),
    e
  );
}
function Ir(e, t, r) {
  if (a.isString(e))
    try {
      return (t || JSON.parse)(e), a.trim(e);
    } catch (n) {
      if (n.name !== "SyntaxError") throw n;
    }
  return (r || JSON.stringify)(e);
}
var Se = {
  transitional: Ee,
  adapter: Qr(),
  transformRequest: [
    function (t, r) {
      let n = r.getContentType() || "",
        s = n.indexOf("application/json") > -1,
        i = a.isObject(t);
      if ((i && a.isHTMLForm(t) && (t = new FormData(t)), a.isFormData(t)))
        return s && s ? JSON.stringify(ge(t)) : t;
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
          return He(t, this.formSerializer).toString();
        if ((c = a.isFileList(t)) || n.indexOf("multipart/form-data") > -1) {
          let l = this.env && this.env.FormData;
          return C(c ? { "files[]": t } : t, l && new l(), this.formSerializer);
        }
      }
      return i || s ? (r.setContentType("application/json", !1), Ir(t)) : t;
    },
  ],
  transformResponse: [
    function (t) {
      let r = this.transitional || Se.transitional,
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
  Se.headers[t] = {};
});
a.forEach(["post", "put", "patch"], function (t) {
  Se.headers[t] = a.merge(Hr);
});
var K = Se;
function ie(e, t) {
  let r = this || K,
    n = t || r,
    s = b.from(n.headers),
    i = n.data;
  return (
    a.forEach(e, function (c) {
      i = c.call(r, i, s.normalize(), t ? t.status : void 0);
    }),
    s.normalize(),
    i
  );
}
function ae(e) {
  return !!(e && e.__CANCEL__);
}
function ze(e) {
  if (
    (e.cancelToken && e.cancelToken.throwIfRequested(),
    e.signal && e.signal.aborted)
  )
    throw new _();
}
function Re(e) {
  return (
    ze(e),
    (e.headers = b.from(e.headers)),
    (e.data = ie.call(e, e.transformRequest)),
    (e.adapter || K.adapter)(e).then(
      function (n) {
        return (
          ze(e),
          (n.data = ie.call(e, e.transformResponse, n)),
          (n.headers = b.from(n.headers)),
          n
        );
      },
      function (n) {
        return (
          ae(n) ||
            (ze(e),
            n &&
              n.response &&
              ((n.response.data = ie.call(e, e.transformResponse, n.response)),
              (n.response.headers = b.from(n.response.headers)))),
          Promise.reject(n)
        );
      }
    )
  );
}
function P(e, t) {
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
var we = "1.1.2";
var ve = {};
["object", "boolean", "number", "function", "string", "symbol"].forEach(
  (e, t) => {
    ve[e] = function (n) {
      return typeof n === e || "a" + (t < 1 ? "n " : " ") + e;
    };
  }
);
var Lt = {};
ve.transitional = function (t, r, n) {
  function s(i, o) {
    return (
      "[Axios v" +
      we +
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
        !Lt[o] &&
        ((Lt[o] = !0),
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
function Jr(e, t, r) {
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
var We = { assertOptions: Jr, validators: ve };
var $ = We.validators,
  X = class {
    constructor(t) {
      (this.defaults = t),
        (this.interceptors = { request: new je(), response: new je() });
    }
    request(t, r) {
      typeof t == "string" ? ((r = r || {}), (r.url = t)) : (r = t || {}),
        (r = P(this.defaults, r));
      let n = r.transitional;
      n !== void 0 &&
        We.assertOptions(
          n,
          {
            silentJSONParsing: $.transitional($.boolean),
            forcedJSONParsing: $.transitional($.boolean),
            clarifyTimeoutError: $.transitional($.boolean),
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
        (r.headers = new b(r.headers, s));
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
        let h = [Re.bind(this), void 0];
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
        l = Re.call(this, E);
      } catch (h) {
        return Promise.reject(h);
      }
      for (u = 0, m = c.length; u < m; ) l = l.then(c[u++], c[u++]);
      return l;
    }
    getUri(t) {
      t = P(this.defaults, t);
      let r = re(t.baseURL, t.url);
      return te(r, t.params, t.paramsSerializer);
    }
  };
a.forEach(["delete", "get", "head", "options"], function (t) {
  X.prototype[t] = function (r, n) {
    return this.request(
      P(n || {}, { method: t, url: r, data: (n || {}).data })
    );
  };
});
a.forEach(["post", "put", "patch"], function (t) {
  function r(n) {
    return function (i, o, c) {
      return this.request(
        P(c || {}, {
          method: t,
          headers: n ? { "Content-Type": "multipart/form-data" } : {},
          url: i,
          data: o,
        })
      );
    };
  }
  (X.prototype[t] = r()), (X.prototype[t + "Form"] = r(!0));
});
var ue = X;
var ce = class {
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
          n.reason || ((n.reason = new _(i, o, c)), r(n.reason));
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
        token: new ce(function (s) {
          t = s;
        }),
        cancel: t,
      };
    }
  },
  Bt = ce;
function Ke(e) {
  return function (r) {
    return e.apply(null, r);
  };
}
function $e(e) {
  return a.isObject(e) && e.isAxiosError === !0;
}
function qt(e) {
  let t = new ue(e),
    r = Z(ue.prototype.request, t);
  return (
    a.extend(r, ue.prototype, t, { allOwnKeys: !0 }),
    a.extend(r, t, null, { allOwnKeys: !0 }),
    (r.create = function (s) {
      return qt(P(e, s));
    }),
    r
  );
}
var S = qt(K);
S.Axios = ue;
S.CanceledError = _;
S.CancelToken = Bt;
S.isCancel = ae;
S.VERSION = we;
S.toFormData = C;
S.AxiosError = d;
S.Cancel = S.CanceledError;
S.all = function (t) {
  return Promise.all(t);
};
S.spread = Ke;
S.isAxiosError = $e;
S.formToJSON = (e) => ge(a.isHTMLForm(e) ? new FormData(e) : e);
var jt = S;
var Ht = jt;
var Xe = {
  cloud: new URL("https://db.fauna.com"),
  preview: new URL("https://db.fauna-preview.com"),
  local: new URL("http://localhost:8443"),
  localhost: new URL("http://localhost:8443"),
};
var x = class extends Error {
    constructor(r) {
      super(r.message);
      Error.captureStackTrace && Error.captureStackTrace(this, x),
        (this.name = "ServiceError"),
        (this.code = r.code),
        (this.httpStatus = r.httpStatus),
        r.summary && (this.summary = r.summary);
    }
  },
  k = class extends x {
    constructor(t) {
      super(t),
        Error.captureStackTrace && Error.captureStackTrace(this, k),
        (this.name = "QueryRuntimeError");
    }
  },
  U = class extends x {
    constructor(t) {
      super(t),
        Error.captureStackTrace && Error.captureStackTrace(this, U),
        (this.name = "QueryCheckError");
    }
  },
  L = class extends x {
    constructor(r) {
      let { stats: n, ...s } = r;
      super(s);
      Error.captureStackTrace && Error.captureStackTrace(this, L),
        (this.name = "QueryTimeoutError"),
        n && (this.stats = n);
    }
  },
  B = class extends x {
    constructor(t) {
      super(t),
        Error.captureStackTrace && Error.captureStackTrace(this, B),
        (this.name = "AuthenticationError");
    }
  },
  q = class extends x {
    constructor(t) {
      super(t),
        Error.captureStackTrace && Error.captureStackTrace(this, q),
        (this.name = "AuthorizationError");
    }
  },
  j = class extends x {
    constructor(t) {
      super(t),
        Error.captureStackTrace && Error.captureStackTrace(this, j),
        (this.name = "ThrottlingError");
    }
  },
  H = class extends x {
    constructor(t) {
      super(t),
        Error.captureStackTrace && Error.captureStackTrace(this, H),
        (this.name = "ServiceInternalError");
    }
  },
  Q = class extends x {
    constructor(t) {
      super(t),
        Error.captureStackTrace && Error.captureStackTrace(this, Q),
        (this.name = "ServiceTimeoutError");
    }
  },
  I = class extends Error {
    constructor(t, r) {
      super(t, r),
        Error.captureStackTrace && Error.captureStackTrace(this, I),
        (this.name = "ClientError");
    }
  },
  J = class extends Error {
    constructor(t, r) {
      super(t, r),
        Error.captureStackTrace && Error.captureStackTrace(this, J),
        (this.name = "NetworkError");
    }
  },
  M = class extends Error {
    constructor(r) {
      super(r.message);
      Error.captureStackTrace && Error.captureStackTrace(this, M),
        (this.name = "ProtocolError"),
        (this.httpStatus = r.httpStatus);
    }
  };
var Mr = { max_conns: 10, endpoint: Xe.cloud, timeout_ms: 6e4 },
  N,
  be,
  Qt,
  le,
  Ge,
  Te,
  It,
  Oe,
  Jt,
  fe,
  Ze,
  Ye = class {
    constructor(t) {
      w(this, be);
      w(this, le);
      w(this, Te);
      w(this, Oe);
      w(this, fe);
      w(this, N, void 0);
      this.clientConfiguration = {
        ...Mr,
        ...t,
        secret: R(this, be, Qt).call(this, t),
      };
      let r = this.clientConfiguration.timeout_ms + 1e4,
        n = {
          maxSockets: this.clientConfiguration.max_conns,
          maxFreeSockets: this.clientConfiguration.max_conns,
          timeout: r,
          freeSocketTimeout: 4e3,
          keepAlive: !0,
        };
      (this.client = Ht.create({
        baseURL: this.clientConfiguration.endpoint.toString(),
        timeout: r,
      })),
        (this.client.defaults.httpAgent = new Ae.default(n)),
        (this.client.defaults.httpsAgent = new Ae.HttpsAgent(n)),
        (this.client.defaults.headers.common.Authorization = `Bearer ${this.clientConfiguration.secret}`),
        (this.client.defaults.headers.common["Content-Type"] =
          "application/json"),
        R(this, fe, Ze).call(
          this,
          this.clientConfiguration,
          this.client.defaults.headers.common
        );
    }
    async query(t, r) {
      return "query" in t
        ? R(this, le, Ge).call(this, { ...t, ...r })
        : R(this, le, Ge).call(this, t.toQuery(r));
    }
  };
(N = new WeakMap()),
  (be = new WeakSet()),
  (Qt = function (t) {
    let r;
    typeof process == "object" && (r = process.env.FAUNA_SECRET);
    let n = t?.secret || r;
    if (n === void 0)
      throw new Error(
        "You must provide a secret to the driver. Set it in an environmental variable named FAUNA_SECRET or pass it to the Client constructor."
      );
    return n;
  }),
  (le = new WeakSet()),
  (Ge = async function (t) {
    let { query: r, arguments: n } = t,
      s = {};
    R(this, fe, Ze).call(this, t, s);
    try {
      let i = await this.client.post(
          "/query/1",
          { query: r, arguments: n },
          { headers: s }
        ),
        o = new Date(i.data.txn_time);
      return (
        ((O(this, N) === void 0 && i.data.txn_time !== void 0) ||
          (i.data.txn_time !== void 0 &&
            O(this, N) !== void 0 &&
            O(this, N) < o)) &&
          G(this, N, o),
        i.data
      );
    } catch (i) {
      throw R(this, Te, It).call(this, i);
    }
  }),
  (Te = new WeakSet()),
  (It = function (t) {
    if (t.response) {
      if (t.response.data?.error) {
        let r = t.response.data.error;
        return (
          r.summary === void 0 &&
            t.response.data.summary !== void 0 &&
            (r.summary = t.response.data.summary),
          R(this, Oe, Jt).call(this, r, t.response.status)
        );
      }
      return new M({ message: t.message, httpStatus: t.response.status });
    }
    return t.request?.status === 0 ||
      t.request?.socket?.connecting ||
      zr.includes(t.code) ||
      t.message === "Network Error"
      ? new J("The network connection encountered a problem.", { cause: t })
      : new I("A client level error occurred. Fauna was not called.", {
          cause: t,
        });
  }),
  (Oe = new WeakSet()),
  (Jt = function (t, r) {
    return r === 401
      ? new B({ httpStatus: r, ...t })
      : r === 403
      ? new q({ httpStatus: r, ...t })
      : r === 500
      ? new H({ httpStatus: r, ...t })
      : r === 503
      ? new Q({ httpStatus: r, ...t })
      : r === 429
      ? new j({ httpStatus: r, ...t })
      : r === 440
      ? new L({ httpStatus: r, ...t })
      : r === 400 && Vr.includes(t.code)
      ? new U({ httpStatus: r, ...t })
      : r === 400
      ? new k({ httpStatus: r, ...t })
      : new x({ httpStatus: r, ...t });
  }),
  (fe = new WeakSet()),
  (Ze = function (t, r) {
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
      O(this, N) !== void 0 &&
      (r["x-last-txn"] = O(this, N).toISOString());
  });
var Vr = [
    "invalid_function_definition",
    "invalid_identifier",
    "invalid_query",
    "invalid_syntax",
    "invalid_type",
  ],
  zr = [
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
function vr(e, ...t) {
  return Ne.create(e, ...t);
}
var F,
  me,
  et,
  Ce,
  Mt,
  Y = class {
    constructor(t) {
      w(this, Ce);
      w(this, F, void 0);
      var r;
      if ("queryFragments" in t) {
        if (
          t.queryFragments.length === 0 ||
          t.queryFragments.length !== t.queryArgs.length + 1
        )
          throw new Error("invalid query constructed");
        G(this, F, {
          ...t,
          queryArgs: R((r = Y), me, et).call(r, t.queryArgs),
        });
      } else G(this, F, t);
    }
    static create(t, ...r) {
      var n;
      return new Y({
        queryFragments: t,
        queryArgs: R((n = Y), me, et).call(n, r),
      });
    }
    toQuery(t = {}, r = 0) {
      return { ...R(this, Ce, Mt).call(this, r), ...t };
    }
  },
  Ne = Y;
(F = new WeakMap()),
  (me = new WeakSet()),
  (et = function (t) {
    return t.map((r) =>
      typeof r?.toQuery == "function" ? r : new Y({ json: r })
    );
  }),
  (Ce = new WeakSet()),
  (Mt = function (t = 0) {
    if ("queryFragments" in O(this, F)) {
      let { queryFragments: r, queryArgs: n } = O(this, F),
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
      return (n[r] = O(this, F).json), { query: `${r}`, arguments: n };
    }
  }),
  w(Ne, me);
export {
  B as AuthenticationError,
  q as AuthorizationError,
  Ye as Client,
  I as ClientError,
  J as NetworkError,
  M as ProtocolError,
  U as QueryCheckError,
  k as QueryRuntimeError,
  L as QueryTimeoutError,
  x as ServiceError,
  H as ServiceInternalError,
  Q as ServiceTimeoutError,
  j as ThrottlingError,
  Xe as endpoints,
  vr as fql,
};
//# sourceMappingURL=index.js.map
