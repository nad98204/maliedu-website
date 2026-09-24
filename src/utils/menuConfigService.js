import { doc, getDoc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../firebase";

const SETTINGS_COLLECTION = "system_settings";
const MENU_CONFIG_DOC = "menu_config";

export const DEFAULT_MENU_CONFIG = {
  // Tính năng & Nút Topbar
  showAffiliate: true,
  showRecruitment: true,

  // Thanh điều hướng chính (Main Navbar)
  showHome: true,
  showAbout: true,
  showTraining: true,
  showOnlineCourses: true,
  showHypnosis: true,
  showTestimonials: true,
};

export const getMenuConfig = async () => {
  try {
    const snap = await getDoc(doc(db, SETTINGS_COLLECTION, MENU_CONFIG_DOC));
    if (snap.exists()) {
      return { ...DEFAULT_MENU_CONFIG, ...snap.data() };
    }
  } catch (error) {
    console.error("Lỗi khi tải cấu hình menu:", error);
  }
  return DEFAULT_MENU_CONFIG;
};

export const saveMenuConfig = async (config) => {
  const docRef = doc(db, SETTINGS_COLLECTION, MENU_CONFIG_DOC);
  await setDoc(
    docRef,
    {
      ...DEFAULT_MENU_CONFIG,
      ...config,
      updatedAt: Date.now(),
    },
    { merge: true },
  );
};

export const subscribeMenuConfig = (callback) => {
  const docRef = doc(db, SETTINGS_COLLECTION, MENU_CONFIG_DOC);
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        callback({ ...DEFAULT_MENU_CONFIG, ...snap.data() });
      } else {
        callback(DEFAULT_MENU_CONFIG);
      }
    },
    (error) => {
      console.error("Lỗi lắng nghe cấu hình menu:", error);
      callback(DEFAULT_MENU_CONFIG);
    },
  );
};
