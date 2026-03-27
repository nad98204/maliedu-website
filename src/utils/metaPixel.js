const FB_PIXEL_SCRIPT_SRC = "https://connect.facebook.net/en_US/fbevents.js";
const DEFAULT_META_CURRENCY = "VND";

const getWindow = () => (typeof window !== "undefined" ? window : null);
const getDocument = () => (typeof document !== "undefined" ? document : null);

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

  if (value <= 0) {
    return {};
  }

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

export const setMetaUserData = (userData) => {
  const win = getWindow();
  if (!win?.fbq || !userData) return;
  win.fbq("set", "user_data", userData);
};

export const initMetaPixel = (pixelId) => {
  if (!pixelId) return null;

  const win = getWindow();
  const fbq = ensureMetaPixel();
  if (!win || !fbq) return null;

  if (!win.__maliMetaPixelInitialized) {
    win.__maliMetaPixelInitialized = new Set();
  }

  if (!win.__maliMetaPixelInitialized.has(pixelId)) {
    fbq("init", pixelId);
    win.__maliMetaPixelInitialized.add(pixelId);
  }

  return fbq;
};

export const trackMetaEvent = (eventName, params, options) => {
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
  return match ? decodeURIComponent(match[1]) : "";
};

export const getMetaBrowserData = (search = "") => {
  const win = getWindow();
  const searchParams = new URLSearchParams(search || win?.location?.search || "");
  const fbp = getCookieValue("_fbp");
  const fbclid = searchParams.get("fbclid");
  const existingFbc = getCookieValue("_fbc");
  const fbc = existingFbc || (fbclid ? `fb.1.${Date.now()}.${fbclid}` : "");

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
