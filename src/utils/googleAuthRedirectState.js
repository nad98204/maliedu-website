const GOOGLE_REDIRECT_INTENT_KEY = "mali_google_redirect_intent_v1";
const INTENTS = new Set(["modal", "register", "admin"]);

export const getPendingGoogleRedirectIntent = () => {
  if (typeof window === "undefined") return null;
  try {
    const intent = window.sessionStorage.getItem(GOOGLE_REDIRECT_INTENT_KEY);
    return INTENTS.has(intent) ? intent : null;
  } catch {
    return null;
  }
};

export const setPendingGoogleRedirectIntent = (intent) => {
  if (!INTENTS.has(intent)) throw new Error("Invalid Google sign-in destination");
  window.sessionStorage.setItem(GOOGLE_REDIRECT_INTENT_KEY, intent);
};

export const clearPendingGoogleRedirectIntent = () => {
  try {
    window.sessionStorage.removeItem(GOOGLE_REDIRECT_INTENT_KEY);
  } catch {
    // Storage may be unavailable after navigation; no user data is stored here.
  }
};
