// src/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// --- 1. APP CHÍNH (Web MaliEdu) ---
export const firebaseConfig = {
  apiKey: "AIzaSyCv_IliVnri6Iv6WEO3D4pwTGn_QFEEEnw",
  authDomain: "maliedu-web.firebaseapp.com",
  projectId: "maliedu-web",
  storageBucket: "maliedu-web.firebasestorage.app",
  messagingSenderId: "996301842926",
  appId: "1:996301842926:web:46c694a592b17412e486ff",
  measurementId: "G-YP9W6Y2EFJ"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app); // Database của Web
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

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
} catch (e) {
  crmApp = initializeApp(crmConfig, "crmApp");
}

export const crmRealtimeDB = getDatabase(crmApp); // Để gửi Lead
export const crmFirestore = getFirestore(crmApp); // <--- MỚI: Để lấy Cấu Hình Remote