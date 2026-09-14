import { getRedirectResult, signInWithPopup, signInWithRedirect } from "firebase/auth";

import { auth, createGoogleProvider } from "../firebase";
import {
  clearPendingGoogleRedirectIntent,
  getPendingGoogleRedirectIntent,
  setPendingGoogleRedirectIntent,
} from "./googleAuthRedirectState";
import { shouldRedirectGoogleSignIn } from "./googleAuthPolicy";

export const shouldUseGoogleRedirect = () =>
  typeof window !== "undefined"
  && typeof navigator !== "undefined"
  && shouldRedirectGoogleSignIn({
    userAgent: navigator.userAgent || "",
    maxTouchPoints: navigator.maxTouchPoints || 0,
    hostname: window.location.hostname,
    authDomain: auth.app.options.authDomain,
  });

export const signInWithGoogle = async ({ intent, emailHint = "" }) => {
  const provider = createGoogleProvider({ emailHint });
  if (!shouldUseGoogleRedirect()) {
    return signInWithPopup(auth, provider);
  }

  setPendingGoogleRedirectIntent(intent);
  try {
    await signInWithRedirect(auth, provider);
    return null;
  } catch (error) {
    clearPendingGoogleRedirectIntent();
    throw error;
  }
};

let redirectResultPromise;
export const consumeGoogleRedirectResult = () => {
  if (!redirectResultPromise) {
    redirectResultPromise = (async () => {
      const intent = getPendingGoogleRedirectIntent();
      if (!intent) return null;
      try {
        const result = await getRedirectResult(auth);
        if (!result) {
          throw Object.assign(new Error("No Google redirect result"), { code: "auth/redirect-no-result" });
        }
        return { intent, user: result.user };
      } finally {
        clearPendingGoogleRedirectIntent();
      }
    })();
  }
  return redirectResultPromise;
};
