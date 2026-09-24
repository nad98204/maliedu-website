import { doc, getDoc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../firebase";

// homepage_content được đọc công khai, còn quyền ghi vẫn chỉ dành cho Admin.
const PRIMARY_COLLECTION = "homepage_content";
const LEGACY_COLLECTION = "system_settings";
const MENU_CONFIG_DOC = "menu_config";
const LOCAL_STORAGE_KEY = "mali_menu_config_cache";

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

const getCachedConfig = () => {
  try {
    if (typeof window !== "undefined") {
      const cached = window.localStorage.getItem(LOCAL_STORAGE_KEY);

      if (cached) {
        return { ...DEFAULT_MENU_CONFIG, ...JSON.parse(cached) };
      }
    }
  } catch {
    // Bỏ qua cache lỗi hoặc localStorage bị trình duyệt chặn.
  }

  return DEFAULT_MENU_CONFIG;
};

const setCachedConfig = (config) => {
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(config));
    }
  } catch {
    // Không để lỗi localStorage làm gián đoạn cấu hình menu.
  }
};

export const getMenuConfig = async () => {
  try {
    const primarySnap = await getDoc(doc(db, PRIMARY_COLLECTION, MENU_CONFIG_DOC));

    if (primarySnap.exists()) {
      const data = { ...DEFAULT_MENU_CONFIG, ...primarySnap.data() };
      setCachedConfig(data);
      return data;
    }

    const legacySnap = await getDoc(doc(db, LEGACY_COLLECTION, MENU_CONFIG_DOC));

    if (legacySnap.exists()) {
      const data = { ...DEFAULT_MENU_CONFIG, ...legacySnap.data() };
      setCachedConfig(data);

      // Admin đầu tiên đọc cấu hình cũ sẽ tự động chuyển dữ liệu sang nơi công khai.
      saveMenuConfig(data).catch(() => {});
      return data;
    }
  } catch (error) {
    console.warn("Lỗi khi tải cấu hình menu từ Firestore:", error);
  }

  return getCachedConfig();
};

export const saveMenuConfig = async (config) => {
  const payload = {
    ...DEFAULT_MENU_CONFIG,
    ...config,
    updatedAt: Date.now(),
  };

  setCachedConfig(payload);

  const primaryRef = doc(db, PRIMARY_COLLECTION, MENU_CONFIG_DOC);
  await setDoc(primaryRef, payload, { merge: true });

  try {
    const legacyRef = doc(db, LEGACY_COLLECTION, MENU_CONFIG_DOC);
    await setDoc(legacyRef, payload, { merge: true });
  } catch (error) {
    console.warn("Không thể ghi cấu hình menu dự phòng:", error);
  }
};

export const subscribeMenuConfig = (callback) => {
  callback(getCachedConfig());

  const primaryRef = doc(db, PRIMARY_COLLECTION, MENU_CONFIG_DOC);
  return onSnapshot(
    primaryRef,
    (snap) => {
      if (snap.exists()) {
        const data = { ...DEFAULT_MENU_CONFIG, ...snap.data() };
        setCachedConfig(data);
        callback(data);
        return;
      }

      getMenuConfig().then(callback);
    },
    (error) => {
      console.warn("Lỗi realtime menu, dùng cấu hình dự phòng:", error);
      getMenuConfig().then(callback);
    },
  );
};
