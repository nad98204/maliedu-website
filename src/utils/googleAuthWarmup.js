const GOOGLE_AUTH_ORIGINS = [
  "https://accounts.google.com",
  "https://apis.google.com",
  "https://www.gstatic.com",
  "https://www.googleapis.com",
];

const ensureHeadLink = (rel, href) => {
  if (typeof document === "undefined") {
    return;
  }

  const marker = `${rel}:${href}`;

  if (document.head.querySelector(`link[data-google-auth="${marker}"]`)) {
    return;
  }

  const link = document.createElement("link");
  link.rel = rel;
  link.href = href;
  link.dataset.googleAuth = marker;

  if (rel === "preconnect") {
    link.crossOrigin = "anonymous";
  }

  document.head.appendChild(link);
};

export const warmUpGoogleSignIn = () => {
  GOOGLE_AUTH_ORIGINS.forEach((origin) => {
    ensureHeadLink("dns-prefetch", origin);
    ensureHeadLink("preconnect", origin);
  });
};
