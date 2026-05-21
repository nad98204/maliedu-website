const FB_PIXEL_SCRIPT_SRC = "https://connect.facebook.net/en_US/fbevents.js";
const DEFAULT_META_CURRENCY = "VND";

const getWindow = () => (typeof window !== "undefined" ? window : null);
const getDocument = () => (typeof document !== "undefined" ? document : null);
const META_COOKIE_MAX_AGE_SECONDS = 90 * 24 * 60 * 60;
const META_BROWSER_USER_DATA_KEYS = new Set([
  "em",
  "ph",
  "fn",
  "ln",
  "ge",
  "db",
  "ct",
  "st",
  "zp",
  "country",
  "external_id",
]);

const normalizeMetaValue = (value, fallback = 0) => {
  if (typeof value === "number") {
    return Number.isFinite(value) && value >= 0 ? value : fallback;
  }

  if (typeof value !== "string") return fallback;

  let normalized = value.trim().replace(/\s+/g, "");
  if (!normalized) return fallback;

  if (/^-?\d{1,3}(\.\d{3})*,\d+$/.test(normalized)) {
    normalized = normalized.replace(/\./g, "").replace(",", ".");
  } else if (/^-?\d{1,3}(,\d{3})*\.\d+$/.test(normalized)) {
    normalized = normalized.replace(/,/g, "");
  } else if (/^-?\d+,\d+$/.test(normalized)) {
    normalized = normalized.replace(",", ".");
  } else {
    normalized = normalized.replace(/,/g, "");
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

export const normalizeMetaCurrency = (currency, fallback = DEFAULT_META_CURRENCY) => {
  const normalized = String(currency ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z]/g, "");

  return /^[A-Z]{3}$/.test(normalized) ? normalized : fallback;
};

export const resolveMetaEventData = (config = {}) => {
  const value = normalizeMetaValue(config?.fbEventValue ?? config?.eventValue ?? 0);

  return {
    value,
    currency: normalizeMetaCurrency(config?.fbCurrency ?? config?.currency, DEFAULT_META_CURRENCY),
  };
};

const FB_API_VERSION = "v19.0";
const GLOBAL_PIXEL_ID = "1526874981588150";
const GLOBAL_CAPI_TOKEN = "EAAOUx21ZARaYBQ6jZAiffdq7ZCsCj7Xko24I8De60ufxpJ0ZBNGE1dbbJBI8MDDeZB8n37IhzpUPZAahSZA69WFnDiTAB9wwfriQIoeKQUjVj6pzIumRzDCXHLGATDxJOAlZAiz3wIdYhwo0aTwoZAEFNTBZCRVKDZC7OvjtZBfQ1TUHXAdWFAii06GZBGRRe5I8ZBSsm51QZDZD";

export const hashData = async (input) => {
  if (!input) return "";
  const utf8 = new TextEncoder().encode(input.trim().toLowerCase());
  const hashBuffer = await crypto.subtle.digest("SHA-256", utf8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((item) => item.toString(16).padStart(2, "0")).join("");
};

export const normalizeNameForHash = (value) =>
  value
    ? value
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "")
    : "";

export const ensureMetaPixel = () => {
  const win = getWindow();
  const doc = getDocument();

  if (!win || !doc) return null;
  if (win.fbq) return win.fbq;

  let n = function () {
    n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
  };

  win.fbq = n;
  if (!win._fbq) win._fbq = n;
  n.push = n;
  n.loaded = true;
  n.version = "2.0";
  n.queue = [];

  const existingScript = doc.querySelector(`script[src="${FB_PIXEL_SCRIPT_SRC}"]`);
  if (!existingScript) {
    const script = doc.createElement("script");
    script.async = true;
    script.src = FB_PIXEL_SCRIPT_SRC;
    doc.head.appendChild(script);
  }

  return win.fbq;
};

const sanitizeMetaUserData = (userData) => {
  if (!userData || typeof userData !== "object") return {};

  const sanitizedData = {};
  Object.keys(userData).forEach((key) => {
    if (!META_BROWSER_USER_DATA_KEYS.has(key)) return;
    const val = userData[key];
    const normalizedValue = Array.isArray(val) ? val[0] : val;
    if (normalizedValue == null || normalizedValue === "") return;
    sanitizedData[key] = String(normalizedValue);
  });

  return sanitizedData;
};

const createStableFingerprint = (data) =>
  JSON.stringify(
    Object.keys(data || {})
      .sort()
      .reduce((acc, key) => {
        acc[key] = data[key];
        return acc;
      }, {})
  );

const mergeMetaUserData = (win, userData) => {
  const sanitizedData = sanitizeMetaUserData(userData);
  if (!win || Object.keys(sanitizedData).length === 0) return {};

  win.__maliMetaUserData = {
    ...(win.__maliMetaUserData || {}),
    ...sanitizedData,
  };

  return win.__maliMetaUserData;
};

export const setMetaUserData = (userData, pixelId) => {
  const win = getWindow();
  const mergedData = mergeMetaUserData(win, userData);
  if (!win || Object.keys(mergedData).length === 0) return;

  if (!import.meta.env.PROD) {
    console.log("[MetaPixel:dev] userData", { pixelId, userData: mergedData });
    return;
  }

  const targetPixelId = pixelId || win.__maliCurrentPixelId;
  if (targetPixelId) {
    initMetaPixel(targetPixelId, mergedData);
  }
};

export const initMetaPixel = (pixelId, userData) => {
  if (!pixelId) return null;
  if (!import.meta.env.PROD) {
    console.log("[MetaPixel:dev] init", { pixelId, userData });
    return null;
  }

  const win = getWindow();
  const fbq = ensureMetaPixel();
  if (!win || !fbq) return null;

  if (!win.__maliMetaPixelInitialized) {
    win.__maliMetaPixelInitialized = new Set();
  }
  if (!win.__maliMetaPixelUserDataFingerprint) {
    win.__maliMetaPixelUserDataFingerprint = {};
  }

  const mergedUserData = mergeMetaUserData(win, userData);
  const hasUserData = Object.keys(mergedUserData).length > 0;
  const userDataFingerprint = hasUserData ? createStableFingerprint(mergedUserData) : "";

  if (!win.__maliMetaPixelInitialized.has(pixelId)) {
    if (hasUserData) {
      fbq("init", pixelId, mergedUserData);
      win.__maliMetaPixelUserDataFingerprint[pixelId] = userDataFingerprint;
    } else {
      fbq("init", pixelId);
    }
    win.__maliMetaPixelInitialized.add(pixelId);
  } else if (
    hasUserData &&
    win.__maliMetaPixelUserDataFingerprint[pixelId] !== userDataFingerprint
  ) {
    fbq("init", pixelId, mergedUserData);
    win.__maliMetaPixelUserDataFingerprint[pixelId] = userDataFingerprint;
  }

  return fbq;
};

export const trackMetaEvent = (eventName, params, options) => {
  if (!import.meta.env.PROD) {
    console.log("[MetaPixel:dev] track", eventName, params, options);
    return true;
  }

  const win = getWindow();
  if (!win?.fbq || !eventName) return false;

  if (params && options) {
    win.fbq("track", eventName, params, options);
    return true;
  }

  if (params) {
    win.fbq("track", eventName, params);
    return true;
  }

  win.fbq("track", eventName);
  return true;
};

export const trackMetaEventForPixel = (pixelId, eventName, params, options) => {
  if (!pixelId) return trackMetaEvent(eventName, params, options);
  if (!import.meta.env.PROD) {
    console.log("[MetaPixel:dev] trackSingle", pixelId, eventName, params, options);
    return true;
  }

  const win = getWindow();
  if (!win?.fbq || !eventName) return false;

  if (params && options) {
    win.fbq("trackSingle", pixelId, eventName, params, options);
    return true;
  }

  if (params) {
    win.fbq("trackSingle", pixelId, eventName, params);
    return true;
  }

  win.fbq("trackSingle", pixelId, eventName);
  return true;
};

export const trackMetaEventOnce = ({ storageKey, eventName, params, options }) => {
  if (!storageKey) {
    return trackMetaEvent(eventName, params, options);
  }

  try {
    if (sessionStorage.getItem(storageKey)) return false;

    const tracked = trackMetaEvent(eventName, params, options);
    if (tracked) {
      sessionStorage.setItem(storageKey, "1");
    }
    return tracked;
  } catch {
    return trackMetaEvent(eventName, params, options);
  }
};

export const createMetaEventId = (prefix = "meta") => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
};

export const getCookieValue = (name) => {
  const cookieSource = getDocument()?.cookie;
  if (!cookieSource) return "";

  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = cookieSource.match(new RegExp(`(?:^|; )${escapedName}=([^;]*)`));
  if (!match) return "";

  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
};

const decodeQueryValue = (value) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const getRawQueryParam = (search = "", name) => {
  const query = String(search || getWindow()?.location?.search || "").replace(/^\?/, "");
  if (!query) return "";

  for (const pair of query.split("&")) {
    const separatorIndex = pair.indexOf("=");
    const rawKey = separatorIndex >= 0 ? pair.slice(0, separatorIndex) : pair;
    if (decodeQueryValue(rawKey.replace(/\+/g, " ")) !== name) continue;

    const rawValue = separatorIndex >= 0 ? pair.slice(separatorIndex + 1) : "";
    return decodeQueryValue(rawValue);
  }

  return "";
};

const isValidFbc = (value = "") => /^fb\.\d+\.\d{10,13}\..+/.test(value);

const getFbclidFromFbc = (fbc = "") => {
  if (!isValidFbc(fbc)) return "";
  const lastDotIndex = fbc.lastIndexOf(".");
  return lastDotIndex >= 0 ? fbc.slice(lastDotIndex + 1) : "";
};

const setMetaCookie = (name, value) => {
  const doc = getDocument();
  if (!doc || !value) return;

  doc.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${META_COOKIE_MAX_AGE_SECONDS}; Path=/; SameSite=Lax`;
};

export const formatFbcFromFbclid = (fbclid, creationTime = Date.now(), subdomainIndex = 1) =>
  fbclid ? `fb.${subdomainIndex}.${creationTime}.${fbclid}` : "";

export const getMetaBrowserData = (search = "") => {
  const fbp = getCookieValue("_fbp");
  const fbclid = getRawQueryParam(search, "fbclid");
  const existingFbc = getCookieValue("_fbc");
  const existingFbclid = getFbclidFromFbc(existingFbc);

  if (fbclid && fbclid !== existingFbclid) {
    const fbc = formatFbcFromFbclid(fbclid);
    setMetaCookie("_fbc", fbc);
    return { fbp, fbc };
  }

  const fbc = isValidFbc(existingFbc) ? existingFbc : "";

  return { fbp, fbc };
};

export const sendCapiEvent = async (eventName, eventId, userData, customData) => {
  try {
    const eventTime = Math.floor(Date.now() / 1000);
    const payload = {
      data: [
        {
          event_name: eventName,
          event_time: eventTime,
          action_source: "website",
          event_id: eventId,
          event_source_url: window.location.href,
          user_data: userData,
          custom_data: customData,
        },
      ],
    };

    const fbCapiUrl = `https://graph.facebook.com/${FB_API_VERSION}/${GLOBAL_PIXEL_ID}/events?access_token=${GLOBAL_CAPI_TOKEN}`;
    return fetch(fbCapiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("CAPI Sending Error:", error);
    return null;
  }
};
