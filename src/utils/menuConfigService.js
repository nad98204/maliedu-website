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

const normalizeConfigSnapshot = (snapshot) =>
  snapshot?.exists()
    ? { ...DEFAULT_MENU_CONFIG, ...snapshot.data() }
    : null;

const selectLatestConfig = (...configs) => {
  const availableConfigs = configs.filter(Boolean);

  if (availableConfigs.length === 0) return null;

  return availableConfigs.reduce((latest, candidate) =>
    Number(candidate.updatedAt || 0) > Number(latest.updatedAt || 0)
      ? candidate
      : latest
  );
};

export const getMenuConfig = async () => {
  try {
    const [primaryResult, legacyResult] = await Promise.allSettled([
      getDoc(doc(db, PRIMARY_COLLECTION, MENU_CONFIG_DOC)),
      getDoc(doc(db, LEGACY_COLLECTION, MENU_CONFIG_DOC)),
    ]);
    const primaryConfig = primaryResult.status === "fulfilled"
      ? normalizeConfigSnapshot(primaryResult.value)
      : null;
    const legacyConfig = legacyResult.status === "fulfilled"
      ? normalizeConfigSnapshot(legacyResult.value)
      : null;
    const latestConfig = selectLatestConfig(primaryConfig, legacyConfig);

    if (latestConfig) {
      setCachedConfig(latestConfig);
      return latestConfig;
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

  // Ghi nguồn cũ trước để các tab Admin chưa tải lại vẫn tương thích.
  const legacyRef = doc(db, LEGACY_COLLECTION, MENU_CONFIG_DOC);
  await setDoc(legacyRef, payload, { merge: true });

  try {
    const primaryRef = doc(db, PRIMARY_COLLECTION, MENU_CONFIG_DOC);
    await setDoc(primaryRef, payload, { merge: true });
  } catch (error) {
    console.warn("Không thể ghi cấu hình menu công khai dự phòng:", error);
  }
};

export const subscribeMenuConfig = (callback) => {
  callback(getCachedConfig());

  const primaryRef = doc(db, PRIMARY_COLLECTION, MENU_CONFIG_DOC);
  const legacyRef = doc(db, LEGACY_COLLECTION, MENU_CONFIG_DOC);
  let primaryConfig = null;
  let legacyConfig = null;
  let primaryReady = false;
  let legacyReady = false;

  const emitLatestConfig = () => {
    if (!primaryReady || !legacyReady) return;

    const latestConfig = selectLatestConfig(primaryConfig, legacyConfig);
    if (!latestConfig) return;

    setCachedConfig(latestConfig);
    callback(latestConfig);
  };

  const unsubscribePrimary = onSnapshot(
    primaryRef,
    (snap) => {
      primaryConfig = normalizeConfigSnapshot(snap);
      primaryReady = true;
      emitLatestConfig();
    },
    (error) => {
      console.warn("Không thể lắng nghe cấu hình menu công khai:", error);
      primaryReady = true;
      emitLatestConfig();
    },
  );

  const unsubscribeLegacy = onSnapshot(
    legacyRef,
    (snap) => {
      legacyConfig = normalizeConfigSnapshot(snap);
      legacyReady = true;
      emitLatestConfig();
    },
    (error) => {
      console.warn("Không thể lắng nghe cấu hình menu tương thích:", error);
      legacyReady = true;
      emitLatestConfig();
    },
  );

  return () => {
    unsubscribePrimary();
    unsubscribeLegacy();
  };
};
