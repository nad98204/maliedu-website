const FB_PIXEL_SCRIPT_SRC = "https://connect.facebook.net/en_US/fbevents.js";

const getWindow = () => (typeof window !== "undefined" ? window : null);
const getDocument = () => (typeof document !== "undefined" ? document : null);

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
