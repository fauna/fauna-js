import { packageVersion } from "./package-version";

let os: any;
try {
  os = require("node:os");
} catch (_) {
  os = undefined;
}

/**
 * Function to put all of the environment details together.
 * @internal
 */
export const getDriverEnv = (): string => {
  const driverEnv = {
    driver: ["javascript", packageVersion].join("-"),
    env: "unknown",
    os: "unknown",
    runtime: "unknown",
  };

  try {
    /**
     * Determine if we're executing in a Node environment
     */
    const isNode =
      typeof window === "undefined" &&
      typeof process !== "undefined" &&
      process.versions != null &&
      process.versions.node != null;

    /**
     * Determine if we're executing in a Node environment
     */
    const isBrowser =
      typeof window !== "undefined" && typeof window.document !== "undefined";

    /**
     * Determine if we're executing in a Service Worker environment
     */
    const isServiceWorker =
      typeof self === "object" &&
      self.constructor &&
      self.constructor.name === "DedicatedWorkerGlobalScope";

    /**
     * Determine if we're executing in Vercel's Edge Runtime
     * @see {@link https://vercel.com/docs/concepts/functions/edge-functions/edge-runtime#check-if-you're-running-on-the-edge-runtime}
     */
    // @ts-expect-error Cannot find name 'EdgeRuntime'
    const isVercelEdgeRuntime = typeof EdgeRuntime !== "string";

    if (isNode) {
      driverEnv.runtime = ["nodejs", process.version].join("-");
      driverEnv.env = getNodeRuntimeEnv();
      driverEnv.os = [os.platform(), os.release()].join("-");
    } else if (isServiceWorker) {
      driverEnv.runtime = getBrowserDetails(navigator);
      driverEnv.env = "Service Worker";
      driverEnv.os = getBrowserOsDetails(navigator);
    } else if (isBrowser) {
      driverEnv.runtime = getBrowserDetails(navigator);
      driverEnv.env = "browser";
      driverEnv.os = getBrowserOsDetails(navigator);
    } else if (isVercelEdgeRuntime) {
      driverEnv.runtime = "Vercel Edge Runtime";
      driverEnv.env = "edge";
    }
  } catch (e) {
    // ignore errors trying to report on user environment
  }

  return (
    Object.entries(driverEnv)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .filter(([_, val]) => val !== "unknown")
      .map((entry: [string, string]) => entry.join("="))
      .join("; ")
  );
};

/**
 * Get browser environment details
 */
const getBrowserDetails = (navigator: Navigator | WorkerNavigator): string => {
  let browser: string = navigator.appName;
  let browserVersion = "" + parseFloat(navigator.appVersion);
  let nameOffset, verOffset, ix;

  // Opera
  if ((verOffset = navigator.userAgent.indexOf("Opera")) != -1) {
    browser = "Opera";
    browserVersion = navigator.userAgent.substring(verOffset + 6);
    if ((verOffset = navigator.userAgent.indexOf("Version")) != -1) {
      browserVersion = navigator.userAgent.substring(verOffset + 8);
    }
  }
  // MSIE
  else if ((verOffset = navigator.userAgent.indexOf("MSIE")) != -1) {
    browser = "Microsoft Internet Explorer";
    browserVersion = navigator.userAgent.substring(verOffset + 5);
  }

  //IE 11 no longer identifies itself as MS IE, so trap it
  //http://stackoverflow.com/questions/17907445/how-to-detect-ie11
  else if (
    browser == "Netscape" &&
    navigator.userAgent.indexOf("Trident/") != -1
  ) {
    browser = "Microsoft Internet Explorer";
    browserVersion = navigator.userAgent.substring(verOffset + 5);
    if ((verOffset = navigator.userAgent.indexOf("rv:")) != -1) {
      browserVersion = navigator.userAgent.substring(verOffset + 3);
    }
  }

  // Chrome
  else if ((verOffset = navigator.userAgent.indexOf("Chrome")) != -1) {
    browser = "Chrome";
    browserVersion = navigator.userAgent.substring(verOffset + 7);
  }
  // Safari
  else if ((verOffset = navigator.userAgent.indexOf("Safari")) != -1) {
    browser = "Safari";
    browserVersion = navigator.userAgent.substring(verOffset + 7);
    if ((verOffset = navigator.userAgent.indexOf("Version")) != -1) {
      browserVersion = navigator.userAgent.substring(verOffset + 8);
    }

    // Chrome on iPad identifies itself as Safari. Actual results do not match what Google claims
    //  at: https://developers.google.com/chrome/mobile/docs/user-agent?hl=ja
    //  No mention of chrome in the user agent string. However it does mention CriOS, which presumably
    //  can be keyed on to detect it.
    if (navigator.userAgent.indexOf("CriOS") != -1) {
      //Chrome on iPad spoofing Safari...correct it.
      browser = "Chrome";
      //Don't believe there is a way to grab the accurate version number, so leaving that for now.
    }
  }
  // Firefox
  else if ((verOffset = navigator.userAgent.indexOf("Firefox")) != -1) {
    browser = "Firefox";
    browserVersion = navigator.userAgent.substring(verOffset + 8);
  }
  // Other browsers
  else if (
    (nameOffset = navigator.userAgent.lastIndexOf(" ") + 1) <
    (verOffset = navigator.userAgent.lastIndexOf("/"))
  ) {
    browser = navigator.userAgent.substring(nameOffset, verOffset);
    browserVersion = navigator.userAgent.substring(verOffset + 1);
    if (browser.toLowerCase() == browser.toUpperCase()) {
      browser = navigator.appName;
    }
  }
  // trim the browser version string
  if ((ix = browserVersion.indexOf(";")) != -1)
    browserVersion = browserVersion.substring(0, ix);
  if ((ix = browserVersion.indexOf(" ")) != -1)
    browserVersion = browserVersion.substring(0, ix);
  if ((ix = browserVersion.indexOf(")")) != -1)
    browserVersion = browserVersion.substring(0, ix);

  return [browser, browserVersion].join("-");
};

/**
 * Get OS details for the browser
 */
const getBrowserOsDetails = (
  navigator: Navigator | WorkerNavigator
): string => {
  let os = "unknown";
  const clientStrings = [
    { s: "Windows 10", r: /(Windows 10.0|Windows NT 10.0)/ },
    { s: "Windows 8.1", r: /(Windows 8.1|Windows NT 6.3)/ },
    { s: "Windows 8", r: /(Windows 8|Windows NT 6.2)/ },
    { s: "Windows 7", r: /(Windows 7|Windows NT 6.1)/ },
    { s: "Windows Vista", r: /Windows NT 6.0/ },
    { s: "Windows Server 2003", r: /Windows NT 5.2/ },
    { s: "Windows XP", r: /(Windows NT 5.1|Windows XP)/ },
    { s: "Windows 2000", r: /(Windows NT 5.0|Windows 2000)/ },
    { s: "Windows ME", r: /(Win 9x 4.90|Windows ME)/ },
    { s: "Windows 98", r: /(Windows 98|Win98)/ },
    { s: "Windows 95", r: /(Windows 95|Win95|Windows_95)/ },
    { s: "Windows NT 4.0", r: /(Windows NT 4.0|WinNT4.0|WinNT|Windows NT)/ },
    { s: "Windows CE", r: /Windows CE/ },
    { s: "Windows 3.11", r: /Win16/ },
    { s: "Android", r: /Android/ },
    { s: "Open BSD", r: /OpenBSD/ },
    { s: "Sun OS", r: /SunOS/ },
    { s: "Chrome OS", r: /CrOS/ },
    { s: "Linux", r: /(Linux|X11(?!.*CrOS))/ },
    { s: "iOS", r: /(iPhone|iPad|iPod)/ },
    { s: "Mac OS X", r: /Mac OS X/ },
    { s: "Mac OS", r: /(Mac OS|MacPPC|MacIntel|Mac_PowerPC|Macintosh)/ },
    { s: "QNX", r: /QNX/ },
    { s: "UNIX", r: /UNIX/ },
    { s: "BeOS", r: /BeOS/ },
    { s: "OS/2", r: /OS\/2/ },
    {
      s: "Search Bot",
      r: /(nuhk|Googlebot|Yammybot|Openbot|Slurp|MSNBot|Ask Jeeves\/Teoma|ia_archiver)/,
    },
  ];
  for (const id in clientStrings) {
    const cs = clientStrings[id];
    if (cs.r.test(navigator.userAgent)) {
      os = cs.s;
      break;
    }
  }

  let osVersion: string | undefined = "unknown";

  if (/Windows/.test(os)) {
    osVersion;
    const matches = /Windows (.*)/.exec(os);
    if (matches) {
      osVersion = matches[1];
    }
    os = "Windows";
  }

  switch (os) {
    case "Mac OS":
    case "Mac OS X":
    case "Android": {
      const matches =
        /(?:Android|Mac OS|Mac OS X|MacPPC|MacIntel|Mac_PowerPC|Macintosh) ([._\d]+)/.exec(
          navigator.userAgent
        );
      if (matches) {
        osVersion = matches[1];
      }
      break;
    }

    case "iOS": {
      const matches = /OS (\d+)_(\d+)_?(\d+)?/.exec(navigator.appVersion);
      if (matches) {
        osVersion = matches[1] + "." + matches[2] + "." + (matches[3] ?? 0);
      }
      break;
    }
  }
  return [os, osVersion].join("-");
};

const crossGlobal =
  typeof window !== "undefined"
    ? window
    : typeof globalThis !== "undefined"
    ? globalThis
    : typeof global !== "undefined"
    ? global
    : self;

/**
 * Get node environment details
 */
const getNodeRuntimeEnv = (): string => {
  // return early if process variables are not available
  if (
    !(
      typeof process !== "undefined" &&
      process &&
      process.env &&
      typeof process.env === "object"
    )
  ) {
    return "unknown";
  }

  const runtimeEnvs = [
    {
      name: "Netlify",
      check: function (): boolean {
        return !!process.env["NETLIFY_IMAGES_CDN_DOMAIN"];
      },
    },
    {
      name: "Vercel",
      check: function (): boolean {
        return !!process.env["VERCEL"];
      },
    },
    {
      name: "Heroku",
      check: function (): boolean {
        return (
          !!process.env["PATH"] && process.env.PATH.indexOf(".heroku") !== -1
        );
      },
    },
    {
      name: "AWS Lambda",
      check: function (): boolean {
        return !!process.env["AWS_LAMBDA_FUNCTION_VERSION"];
      },
    },
    {
      name: "GCP Cloud Functions",
      check: function (): boolean {
        return !!process.env["_"] && process.env._.indexOf("google") !== -1;
      },
    },
    {
      name: "GCP Compute Instances",
      check: function (): boolean {
        return !!process.env["GOOGLE_CLOUD_PROJECT"];
      },
    },
    {
      name: "Azure Cloud Functions",
      check: function (): boolean {
        return !!process.env["WEBSITE_FUNCTIONS_AZUREMONITOR_CATEGORIES"];
      },
    },
    {
      name: "Azure Compute",
      check: function (): boolean {
        return (
          !!process.env["ORYX_ENV_TYPE"] &&
          !!process.env["WEBSITE_INSTANCE_ID"] &&
          process.env.ORYX_ENV_TYPE === "AppService"
        );
      },
    },
    {
      name: "Mongo Stitch",
      check: function (): boolean {
        // @ts-expect-error Element implicitly has an 'any' type because type 'typeof globalThis' has no index signature.ts(7017)
        return typeof crossGlobal?.StitchError === "function";
      },
    },
    {
      name: "Render",
      check: function (): boolean {
        return !!process.env["RENDER_SERVICE_ID"];
      },
    },
    {
      name: "Begin",
      check: function (): boolean {
        return !!process.env["BEGIN_DATA_SCOPE_ID"];
      },
    },
  ];
  const detectedEnv = runtimeEnvs.find((env) => env.check());

  return detectedEnv ? detectedEnv.name : "unknown";
};
