const GOOGLE_AUTH_ORIGINS = [
  "https://accounts.google.com",
  "https://apis.google.com",
  "https://www.gstatic.com",
  "https://www.googleapis.com",
];

// The Google Identity iframe that Firebase Auth loads — preloading this JS file
// establishes the TLS connection and parses the script before the user clicks.
const GOOGLE_IDP_SCRIPT = "https://apis.google.com/js/api.js";

const ensureHeadLink = (rel, href, extra = {}) => {
  if (typeof document === "undefined") return;

  const marker = `${rel}:${href}`;
  if (document.head.querySelector(`link[data-google-auth="${marker}"]`)) return;

  const link = document.createElement("link");
  link.rel = rel;
  link.href = href;
  link.dataset.googleAuth = marker;

  if (rel === "preconnect" || rel === "preload") {
    link.crossOrigin = "anonymous";
  }
  Object.assign(link, extra);

  document.head.appendChild(link);
};

let warmedUp = false;

export const warmUpGoogleSignIn = () => {
  if (warmedUp) return;
  warmedUp = true;

  // Step 1: DNS + TCP/TLS preconnect to all Google auth origins
  GOOGLE_AUTH_ORIGINS.forEach((origin) => {
    ensureHeadLink("dns-prefetch", origin);
    ensureHeadLink("preconnect", origin);
  });

  // Step 2: Preload the Google API JS so it's cached when signInWithPopup runs
  ensureHeadLink("preload", GOOGLE_IDP_SCRIPT, { as: "script" });
};
