// src/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { FIREBASE_PUBLIC_CONFIG } from "./constants/firebasePublicConfig";

// --- 1. APP CHÍNH (Web MaliEdu) ---
export const firebaseConfig = FIREBASE_PUBLIC_CONFIG;

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
const crmConfig = {
  apiKey: "AIzaSyDr6pJNY5ThZz2NMox5lqXLR_gihyxrNFU",
  authDomain: "dangpkkzxy.firebaseapp.com",
  projectId: "dangpkkzxy",
  storageBucket: "dangpkkzxy.firebasestorage.app",
  messagingSenderId: "644778150594",
  appId: "1:644778150594:web:0c4dca15c424e86efc495b",
  databaseURL: "https://dangpkkzxy-default-rtdb.asia-southeast1.firebasedatabase.app"
};

let crmApp;
try {
  crmApp = getApp("crmApp");
} catch {
  crmApp = initializeApp(crmConfig, "crmApp");
}

export const crmRealtimeDB = getDatabase(crmApp); // Để gửi Lead
export const crmFirestore = getFirestore(crmApp); // <--- MỚI: Để lấy Cấu Hình Remote
