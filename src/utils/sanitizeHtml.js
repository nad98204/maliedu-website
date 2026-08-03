import DOMPurify from "dompurify";

const RICH_TEXT_CONFIG = Object.freeze({
  ALLOW_DATA_ATTR: false,
  ALLOW_UNKNOWN_PROTOCOLS: false,
  FORBID_ATTR: ["srcdoc", "style"],
  FORBID_TAGS: [
    "base",
    "button",
    "embed",
    "form",
    "iframe",
    "input",
    "link",
    "meta",
    "object",
    "option",
    "script",
    "select",
    "style",
    "textarea",
  ],
  USE_PROFILES: { html: true },
});

const INLINE_TEXT_CONFIG = Object.freeze({
  ALLOWED_ATTR: ["href", "rel", "title"],
  ALLOWED_TAGS: ["a", "b", "br", "code", "em", "i", "mark", "s", "strong", "u"],
  ALLOW_DATA_ATTR: false,
  ALLOW_UNKNOWN_PROTOCOLS: false,
});

const EMBED_HOSTS = new Set([
  "player.vimeo.com",
  "www.youtube.com",
  "www.youtube-nocookie.com",
  "youtube.com",
  "youtube-nocookie.com",
  "www.tiktok.com",
]);

const normalizeHtml = (value) =>
  typeof value === "string" ? value : String(value || "");

export const sanitizeRichHtml = (value = "") =>
  DOMPurify.sanitize(normalizeHtml(value), RICH_TEXT_CONFIG);

export const sanitizeInlineHtml = (value = "") =>
  DOMPurify.sanitize(normalizeHtml(value), INLINE_TEXT_CONFIG);

export const sanitizeEmbedUrl = (value = "") => {
  try {
    const url = new URL(String(value || "").trim());
    if (url.protocol !== "https:" || !EMBED_HOSTS.has(url.hostname.toLowerCase())) {
      return "";
    }

    return url.toString();
  } catch {
    return "";
  }
};
