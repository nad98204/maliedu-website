// src/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { CRM_FIREBASE_PUBLIC_CONFIG } from "./constants/crmFirebasePublicConfig";
import { FIREBASE_PUBLIC_CONFIG } from "./constants/firebasePublicConfig";

// --- 1. APP CHÍNH (Web MaliEdu) ---
// Enable the same-origin OAuth helper only after /__/auth/* is served on the
// custom domain and its callback is allowed in the Google OAuth client.
const configuredAuthDomain = String(import.meta.env.VITE_GOOGLE_AUTH_DOMAIN || "").trim().toLowerCase();
const currentHost = typeof window === "undefined" ? "" : window.location.hostname.toLowerCase();
export const firebaseConfig = {
  ...FIREBASE_PUBLIC_CONFIG,
  authDomain: configuredAuthDomain && configuredAuthDomain === currentHost
    ? configuredAuthDomain
    : FIREBASE_PUBLIC_CONFIG.authDomain,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app); // Database của Web
export const auth = getAuth(app);

const EMAIL_HINT_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const createGoogleProvider = ({ emailHint = "" } = {}) => {
  const provider = new GoogleAuthProvider();
  const normalizedEmailHint = emailHint.trim();

  const customParams = {
    prompt: "select_account"
  };

  if (EMAIL_HINT_PATTERN.test(normalizedEmailHint)) {
    customParams.login_hint = normalizedEmailHint;
  }

  provider.setCustomParameters(customParams);

  return provider;
};

// --- 2. APP CRM (Antigravity) ---
const crmConfig = CRM_FIREBASE_PUBLIC_CONFIG;

let crmApp;
try {
  crmApp = getApp("crmApp");
} catch {
  crmApp = initializeApp(crmConfig, "crmApp");
}

export const crmRealtimeDB = getDatabase(crmApp); // Để gửi Lead
export const crmFirestore = getFirestore(crmApp); // <--- MỚI: Để lấy Cấu Hình Remote
