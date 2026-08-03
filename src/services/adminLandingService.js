import {
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  serverTimestamp,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { get as getRealtimeValue, ref } from "firebase/database";
import { auth } from "../firebase";

const MAX_BULK_UPDATES = 100;
const FUNNEL_TYPES = new Set(["ads", "leader", "brand", "organic"]);
const ADMIN_LANDING_API_BASE = "/api/admin/landings";
const isAdminLandingApiAvailable = !import.meta.env.DEV;
const ADMIN_LANDING_API_FALLBACK = Symbol("admin-landing-api-fallback");

export class LandingServiceError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = "LandingServiceError";
    this.code = code;
    this.details = details;
  }
}

const requestAdminLandingApi = async (
  path = "",
  { method = "GET", payload, retryAfterRefresh = true } = {},
) => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new LandingServiceError("auth/required", "Vui lòng đăng nhập tài khoản quản trị.");
  }

  const idToken = await currentUser.getIdToken(!retryAfterRefresh);
  const response = await fetch(`${ADMIN_LANDING_API_BASE}${path}`, {
    method,
    credentials: "same-origin",
    headers: {
      authorization: `Bearer ${idToken}`,
      ...(payload !== undefined ? { "content-type": "application/json" } : {}),
    },
    ...(payload !== undefined ? { body: JSON.stringify(payload) } : {}),
  });

  if (response.status === 401 && retryAfterRefresh) {
    return requestAdminLandingApi(path, { method, payload, retryAfterRefresh: false });
  }

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new LandingServiceError(
      result.code || `api/${response.status}`,
      result.error || `Không thể kết nối API Landing (${response.status}).`,
      result.details || {},
    );
  }
  return result;
};

const requestAdminLandingApiIfAvailable = async (
  path,
  options,
) => {
  if (!isAdminLandingApiAvailable) return ADMIN_LANDING_API_FALLBACK;
  return requestAdminLandingApi(path, options);
};

const requiredText = (value, label, maxLength = 160) => {
  const normalized = String(value || "").trim();
  if (!normalized) {
    throw new LandingServiceError("validation/required", `${label} không được để trống.`);
  }
  if (normalized.length > maxLength) {
    throw new LandingServiceError(
      "validation/too-long",
      `${label} không được vượt quá ${maxLength} ký tự.`,
    );
  }
  return normalized;
};

const normalizeDocumentId = (value, label = "ID") => {
  const documentId = requiredText(value, label, 160);
  if (documentId.includes("/")) {
    throw new LandingServiceError("validation/invalid-document-id", `${label} không được chứa dấu '/'.`);
  }
  return documentId;
};

export const normalizeLandingFunnelType = (value = "ads") => {
  const text = String(value || "ads").trim().toLowerCase();
  if (text.includes("leader")) return "leader";
  if (text.includes("brand") || text.includes("thuong_hieu") || text.includes("thương_hiệu")) return "brand";
  if (text.includes("organic") || text.includes("web")) return "organic";
  return "ads";
};

const normalizeValidatedFunnelType = (value = "ads") => {
  const text = String(value || "ads").trim().toLowerCase();
  const isRecognized = [
    "ads",
    "leader",
    "brand",
    "thuong_hieu",
    "thương_hiệu",
    "organic",
    "web",
  ].some((keyword) => text.includes(keyword));

  if (!isRecognized) {
    throw new LandingServiceError("validation/invalid-funnel", "Phễu Landing không hợp lệ.");
  }

  return normalizeLandingFunnelType(text);
};

export const getLandingTargetFunnel = (funnelType = "ads") => {
  const normalized = normalizeLandingFunnelType(funnelType);
  return normalized === "leader" ? "LEADER" : normalized === "brand" ? "BRAND" : "ADS";
};

export const normalizeLandingSlug = (value) => {
  let slug = requiredText(value, "Đường dẫn Landing", 240);
  if (!slug.startsWith("/")) slug = `/${slug}`;
  slug = slug.replace(/\/{2,}/g, "/");

  if (slug.includes("..") || slug.includes("?") || slug.includes("#")) {
    throw new LandingServiceError(
      "validation/invalid-slug",
      "Đường dẫn Landing không được chứa '..', query hoặc hash.",
    );
  }

  if (!/^\/[\p{L}\p{N}/_-]+$/u.test(slug)) {
    throw new LandingServiceError(
      "validation/invalid-slug",
      "Đường dẫn Landing chỉ được chứa chữ, số, dấu gạch ngang, gạch dưới và dấu '/'.",
    );
  }

  return slug;
};

export const normalizeLandingSourceKey = (value) => {
  const sourceKey = requiredText(value, "Mã nguồn", 160)
    .toLowerCase()
    .replace(/\s+/g, "_");

  if (!/^[a-z0-9_-]+$/.test(sourceKey)) {
    throw new LandingServiceError(
      "validation/invalid-source-key",
      "Mã nguồn chỉ được chứa chữ thường không dấu, số, gạch ngang và gạch dưới.",
    );
  }

  return sourceKey;
};

export const normalizeLandingCourseK = (value) => {
  const courseK = requiredText(value, "Khóa K", 16).toUpperCase().replace(/\s+/g, "");
  if (!/^K\d+$/.test(courseK)) {
    throw new LandingServiceError("validation/invalid-course-k", "Khóa K phải có định dạng như K51.");
  }
  return courseK;
};

const optionalHttpUrl = (value, label) => {
  const normalized = String(value || "").trim();
  if (!normalized) return "";

  let parsed;
  try {
    parsed = new URL(normalized);
  } catch {
    throw new LandingServiceError("validation/invalid-url", `${label} không đúng định dạng URL.`);
  }

  if (!new Set(["http:", "https:"]).has(parsed.protocol)) {
    throw new LandingServiceError("validation/invalid-url", `${label} phải bắt đầu bằng http:// hoặc https://.`);
  }

  return parsed.toString();
};

const normalizeCurrency = (value) => {
  const currency = String(value || "VND").trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) {
    throw new LandingServiceError("validation/invalid-currency", "Mã tiền tệ phải gồm đúng 3 chữ cái.");
  }
  return currency;
};

const normalizeEventValue = (value) => {
  const parsed = Number(String(value ?? "0").replace(",", "."));
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new LandingServiceError("validation/invalid-event-value", "Giá trị event phải là số lớn hơn hoặc bằng 0.");
  }
  return parsed;
};

const assertSourceOwnership = ({ sourceSnapshot, landingId, currentSourceKey, nextSourceKey }) => {
  if (!sourceSnapshot.exists()) return;

  const sourceData = sourceSnapshot.data() || {};
  const ownerId = String(sourceData.landingPageId || "").trim();
  const isCurrentLegacySource = !ownerId && currentSourceKey === nextSourceKey;

  if (ownerId !== landingId && !isCurrentLegacySource) {
    throw new LandingServiceError(
      "conflict/source-key",
      `Mã nguồn “${nextSourceKey}” đã được Landing khác sử dụng.`,
      { landingId, ownerId, sourceKey: nextSourceKey },
    );
  }
};

const canDeleteSource = (sourceSnapshot, landingId) => {
  if (!sourceSnapshot?.exists()) return false;
  const ownerId = String(sourceSnapshot.data()?.landingPageId || "").trim();
  return ownerId === landingId;
};

const normalizeFullLandingInput = (input = {}) => {
  const funnelType = normalizeValidatedFunnelType(input.funnelType || input.targetFunnel);
  if (!FUNNEL_TYPES.has(funnelType)) {
    throw new LandingServiceError("validation/invalid-funnel", "Phễu Landing không hợp lệ.");
  }

  const targetCourseId = requiredText(input.targetCourseId, "Khóa học", 160);
  const courseK = normalizeLandingCourseK(input.courseK || input.targetK);
  const zaloLink = optionalHttpUrl(input.zaloLink, "Link Zalo Group");
  const thankYouZaloLink = optionalHttpUrl(input.thankYouZaloLink || zaloLink, "Link Zalo trang cảm ơn");
  const fbPixel = String(input.fbPixel || "").trim();

  if (fbPixel && !/^\d{5,30}$/.test(fbPixel)) {
    throw new LandingServiceError("validation/invalid-pixel", "Facebook Pixel ID chỉ được chứa từ 5 đến 30 chữ số.");
  }

  return {
    landingId: normalizeDocumentId(input.landingId, "ID Landing"),
    name: requiredText(input.name, "Tên Landing", 160),
    slug: normalizeLandingSlug(input.slug),
    sourceKey: normalizeLandingSourceKey(input.sourceKey),
    isMaintenance: Boolean(input.isMaintenance),
    funnelType,
    targetFunnel: getLandingTargetFunnel(funnelType),
    targetCourseId,
    courseK,
    targetK: normalizeLandingCourseK(input.targetK || courseK),
    zaloLink,
    thankYouZaloLink,
    fbPixel,
    fbCurrency: normalizeCurrency(input.fbCurrency),
    fbEventValue: normalizeEventValue(input.fbEventValue),
  };
};

const buildSourceRecord = ({ landing, existingSource = {} }) => ({
  ...existingSource,
  id: landing.sourceKey,
  sourceKey: landing.sourceKey,
  source_name: landing.name,
  name: landing.name,
  landingPageId: landing.landingId,
  landingSlug: landing.slug,
  isActive: true,
  managedBy: "maliedu-admin",
  schemaVersion: 2,
  targetCourseId: landing.targetCourseId,
  targetK: landing.targetK,
  targetFunnel: landing.targetFunnel,
  funnel_type: landing.funnelType,
  assignedSale: landing.funnelType === "leader" ? "" : "Round Robin",
  assignmentMode: landing.funnelType === "leader" ? "leader_referrer" : "sales",
  targetZalo: landing.zaloLink,
  createdAt: existingSource.createdAt || serverTimestamp(),
  updatedAt: serverTimestamp(),
});

export const getLandingSourceConfig = async (firestore, sourceKey) => {
  const normalizedSourceKey = String(sourceKey || "").trim();
  if (!normalizedSourceKey) return {};
  const snapshot = await getDoc(doc(firestore, "source_configs", normalizedSourceKey));
  return snapshot.exists() ? snapshot.data() : {};
};

export const getLandingCourseConfigs = async (firestore) => {
  const snapshot = await getDocs(collection(firestore, "courses_config"));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
};

export const getSharedLandingSchedule = async ({ firestore, documentId }) => {
  const scheduleSnapshot = await getDoc(doc(firestore, "public_settings", documentId));
  if (scheduleSnapshot.exists()) return scheduleSnapshot.data();

  const landingSnapshot = await getDocs(collection(firestore, "landing_pages"));
  return landingSnapshot.docs
    .map((item) => item.data())
    .find((item) => item.eventStart || item.ctaScheduleLabel || item.thankYouCountdownSeconds) || null;
};

export const getAdminLandingWorkspace = async ({
  firestore,
  realtimeDatabase,
  scheduleDocumentId,
}) => {
  if (isAdminLandingApiAvailable) {
    const apiWorkspace = await requestAdminLandingApiIfAvailable("", undefined);
    if (apiWorkspace !== ADMIN_LANDING_API_FALLBACK) return apiWorkspace;
  }

  const [landingSnapshot, courses, schedule, userSnapshot] = await Promise.all([
    getDocs(collection(firestore, "landing_pages")),
    getLandingCourseConfigs(firestore),
    getSharedLandingSchedule({ firestore, documentId: scheduleDocumentId }),
    getRealtimeValue(ref(realtimeDatabase, "system_settings/users")).catch(() => null),
  ]);
  const landings = landingSnapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
  const sourceEntries = await Promise.all(landings.map(async (landing) => [
    landing.active_source_key,
    await getLandingSourceConfig(firestore, landing.active_source_key),
  ]));

  return {
    courses,
    crmUsers: Object.values(userSnapshot?.val?.() || {}).filter((user) => user?.isActive !== false),
    landings,
    schedule,
    sourceConfigs: Object.fromEntries(sourceEntries.filter(([sourceKey]) => sourceKey)),
  };
};

export const saveSharedLandingSchedule = async ({ firestore, documentId, schedule }) => {
  const eventStart = requiredText(schedule?.eventStart, "Thời gian bắt đầu", 40);
  const eventStartDate = new Date(eventStart);
  if (!Number.isFinite(eventStartDate.getTime())) {
    throw new LandingServiceError("validation/invalid-date", "Thời gian bắt đầu không hợp lệ.");
  }

  const parsedCountdown = Number.parseInt(schedule?.thankYouCountdownSeconds, 10);
  if (!Number.isInteger(parsedCountdown) || parsedCountdown < 1 || parsedCountdown > 86400) {
    throw new LandingServiceError(
      "validation/invalid-countdown",
      "Thời gian đếm ngược phải từ 1 đến 86.400 giây.",
    );
  }

  const payload = {
    eventStart,
    ctaScheduleLabel: requiredText(schedule?.ctaScheduleLabel, "Dòng thời gian CTA", 120),
    thankYouCountdownSeconds: parsedCountdown,
    thankYouZaloLink: optionalHttpUrl(schedule?.thankYouZaloLink, "Link Zalo trang cảm ơn"),
    updatedAt: serverTimestamp(),
  };

  if (isAdminLandingApiAvailable) {
    const result = await requestAdminLandingApiIfAvailable("/schedule", {
      method: "POST",
      payload: {
        eventStart: payload.eventStart,
        ctaScheduleLabel: payload.ctaScheduleLabel,
        thankYouCountdownSeconds: payload.thankYouCountdownSeconds,
        thankYouZaloLink: payload.thankYouZaloLink,
      },
    });
    if (result !== ADMIN_LANDING_API_FALLBACK) return result.schedule;
  }

  await setDoc(doc(firestore, "public_settings", documentId), payload, { merge: true });
  return payload;
};

export const saveLandingWithSource = async ({ firestore, input }) => {
  const landing = normalizeFullLandingInput(input);

  if (isAdminLandingApiAvailable) {
    const result = await requestAdminLandingApiIfAvailable("/save", {
      method: "POST",
      payload: landing,
    });
    if (result !== ADMIN_LANDING_API_FALLBACK) return result.landing;
  }

  const landingRef = doc(firestore, "landing_pages", landing.landingId);
  const nextSourceRef = doc(firestore, "source_configs", landing.sourceKey);

  await runTransaction(firestore, async (transaction) => {
    const landingSnapshot = await transaction.get(landingRef);
    const existingLanding = landingSnapshot.exists() ? landingSnapshot.data() : {};
    const currentSourceKey = String(existingLanding.active_source_key || "").trim();
    const currentSourceRef = currentSourceKey
      ? doc(firestore, "source_configs", currentSourceKey)
      : null;

    const nextSourceSnapshot = await transaction.get(nextSourceRef);
    const currentSourceSnapshot = currentSourceRef && currentSourceKey !== landing.sourceKey
      ? await transaction.get(currentSourceRef)
      : nextSourceSnapshot;

    assertSourceOwnership({
      sourceSnapshot: nextSourceSnapshot,
      landingId: landing.landingId,
      currentSourceKey,
      nextSourceKey: landing.sourceKey,
    });

    transaction.set(landingRef, {
      name: landing.name,
      slug: landing.slug,
      active_source_key: landing.sourceKey,
      is_maintenance: landing.isMaintenance,
      zaloLink: landing.zaloLink,
      thankYouZaloLink: landing.thankYouZaloLink,
      fbPixel: landing.fbPixel,
      fbCapiToken: deleteField(),
      fbCurrency: landing.fbCurrency,
      fbEventValue: landing.fbEventValue,
      course_k: landing.courseK,
      targetFunnel: landing.targetFunnel,
      funnel_type: landing.funnelType,
      assignmentMode: landing.funnelType === "leader" ? "leader_referrer" : "sales",
      ...(!landingSnapshot.exists() ? { createdAt: serverTimestamp() } : {}),
      updatedAt: serverTimestamp(),
    }, { merge: true });

    transaction.set(
      nextSourceRef,
      buildSourceRecord({ landing, existingSource: nextSourceSnapshot.exists() ? nextSourceSnapshot.data() : {} }),
      { merge: true },
    );

    if (
      currentSourceRef
      && currentSourceKey !== landing.sourceKey
      && canDeleteSource(currentSourceSnapshot, landing.landingId)
    ) {
      transaction.delete(currentSourceRef);
    }
  });

  return landing;
};

export const deleteLandingWithSource = async ({ firestore, landingId }) => {
  const normalizedLandingId = normalizeDocumentId(landingId, "ID Landing");

  if (isAdminLandingApiAvailable) {
    const result = await requestAdminLandingApiIfAvailable("/delete", {
      method: "POST",
      payload: { landingId: normalizedLandingId },
    });
    if (result !== ADMIN_LANDING_API_FALLBACK) return result;
  }

  const landingRef = doc(firestore, "landing_pages", normalizedLandingId);

  return runTransaction(firestore, async (transaction) => {
    const landingSnapshot = await transaction.get(landingRef);
    if (!landingSnapshot.exists()) {
      throw new LandingServiceError("not-found/landing", "Landing Page không còn tồn tại.");
    }

    const sourceKey = String(landingSnapshot.data()?.active_source_key || "").trim();
    const sourceRef = sourceKey ? doc(firestore, "source_configs", sourceKey) : null;
    const sourceSnapshot = sourceRef ? await transaction.get(sourceRef) : null;

    transaction.delete(landingRef);
    if (sourceRef && canDeleteSource(sourceSnapshot, normalizedLandingId)) {
      transaction.delete(sourceRef);
    }

    return { landingId: normalizedLandingId, sourceKey };
  });
};

const normalizeRoutingUpdate = (update = {}) => {
  const funnelType = normalizeValidatedFunnelType(update.funnelType);
  return {
    landingId: normalizeDocumentId(update.landingId, "ID Landing"),
    sourceKey: normalizeLandingSourceKey(update.sourceKey),
    funnelType,
    targetFunnel: getLandingTargetFunnel(funnelType),
    courseK: update.courseK ? normalizeLandingCourseK(update.courseK) : null,
  };
};

export const updateLandingRoutingBatch = async ({ firestore, updates }) => {
  if (!Array.isArray(updates) || updates.length === 0) {
    throw new LandingServiceError("validation/empty-batch", "Không có Landing nào để cập nhật.");
  }
  if (updates.length > MAX_BULK_UPDATES) {
    throw new LandingServiceError(
      "validation/batch-too-large",
      `Mỗi lần chỉ được cập nhật tối đa ${MAX_BULK_UPDATES} Landing.`,
    );
  }

  const normalizedUpdates = updates.map(normalizeRoutingUpdate);
  const landingIds = new Set();
  const sourceKeys = new Set();
  normalizedUpdates.forEach((update) => {
    if (landingIds.has(update.landingId)) {
      throw new LandingServiceError("validation/duplicate-landing", `Landing “${update.landingId}” bị lặp trong yêu cầu.`);
    }
    if (sourceKeys.has(update.sourceKey)) {
      throw new LandingServiceError("conflict/source-key", `Mã nguồn “${update.sourceKey}” bị trùng trong yêu cầu.`);
    }
    landingIds.add(update.landingId);
    sourceKeys.add(update.sourceKey);
  });

  if (isAdminLandingApiAvailable) {
    const result = await requestAdminLandingApiIfAvailable("/routing", {
      method: "POST",
      payload: { updates: normalizedUpdates },
    });
    if (result !== ADMIN_LANDING_API_FALLBACK) return result.updates;
  }

  return runTransaction(firestore, async (transaction) => {
    const landingEntries = await Promise.all(normalizedUpdates.map(async (update) => {
      const landingRef = doc(firestore, "landing_pages", update.landingId);
      const snapshot = await transaction.get(landingRef);
      if (!snapshot.exists()) {
        throw new LandingServiceError("not-found/landing", `Landing “${update.landingId}” không còn tồn tại.`);
      }
      return { update, landingRef, snapshot, data: snapshot.data() };
    }));

    const sourceRefsByPath = new Map();
    landingEntries.forEach(({ update, data }) => {
      const currentSourceKey = String(data.active_source_key || "").trim();
      const nextRef = doc(firestore, "source_configs", update.sourceKey);
      sourceRefsByPath.set(nextRef.path, nextRef);
      if (currentSourceKey) {
        const currentRef = doc(firestore, "source_configs", currentSourceKey);
        sourceRefsByPath.set(currentRef.path, currentRef);
      }
    });

    const sourceSnapshots = await Promise.all(
      [...sourceRefsByPath.values()].map(async (sourceRef) => [sourceRef.path, await transaction.get(sourceRef)]),
    );
    const sourceSnapshotsByPath = new Map(sourceSnapshots);

    landingEntries.forEach(({ update, landingRef, data }) => {
      const currentSourceKey = String(data.active_source_key || "").trim();
      const currentSourceRef = currentSourceKey
        ? doc(firestore, "source_configs", currentSourceKey)
        : null;
      const nextSourceRef = doc(firestore, "source_configs", update.sourceKey);
      const currentSourceSnapshot = currentSourceRef
        ? sourceSnapshotsByPath.get(currentSourceRef.path)
        : null;
      const nextSourceSnapshot = sourceSnapshotsByPath.get(nextSourceRef.path);

      assertSourceOwnership({
        sourceSnapshot: nextSourceSnapshot,
        landingId: update.landingId,
        currentSourceKey,
        nextSourceKey: update.sourceKey,
      });

      const sourceData = currentSourceSnapshot?.exists()
        ? currentSourceSnapshot.data()
        : nextSourceSnapshot?.exists()
          ? nextSourceSnapshot.data()
          : {};
      const courseK = update.courseK || normalizeLandingCourseK(data.course_k || sourceData.targetK || "K41");
      const landing = {
        landingId: update.landingId,
        name: requiredText(data.name, "Tên Landing", 160),
        slug: normalizeLandingSlug(data.slug),
        sourceKey: update.sourceKey,
        targetCourseId: String(sourceData.targetCourseId || data.targetCourseId || "").trim(),
        targetK: courseK,
        courseK,
        funnelType: update.funnelType,
        targetFunnel: update.targetFunnel,
        zaloLink: String(sourceData.targetZalo || data.zaloLink || "").trim(),
      };

      transaction.set(landingRef, {
        active_source_key: update.sourceKey,
        course_k: courseK,
        targetFunnel: update.targetFunnel,
        funnel_type: update.funnelType,
        assignmentMode: update.funnelType === "leader" ? "leader_referrer" : "sales",
        updatedAt: serverTimestamp(),
      }, { merge: true });

      transaction.set(nextSourceRef, buildSourceRecord({ landing, existingSource: sourceData }), { merge: true });

      if (
        currentSourceRef
        && currentSourceKey !== update.sourceKey
        && canDeleteSource(currentSourceSnapshot, update.landingId)
      ) {
        transaction.delete(currentSourceRef);
      }
    });

    return normalizedUpdates;
  });
};

export const repairAdminLandingSources = async ({ firestore, apply = false }) => {
  if (isAdminLandingApiAvailable) {
    const result = await requestAdminLandingApiIfAvailable("/repair-sources", {
      method: "POST",
      payload: { apply: apply === true },
    });
    if (result !== ADMIN_LANDING_API_FALLBACK) return result;
  }

  const [landingSnapshot, sourceSnapshot] = await Promise.all([
    getDocs(collection(firestore, "landing_pages")),
    getDocs(collection(firestore, "source_configs")),
  ]);
  const activeBySource = new Map();
  landingSnapshot.docs.forEach((landing) => {
    const sourceKey = String(landing.data()?.active_source_key || "").trim();
    if (!sourceKey) return;
    const owners = activeBySource.get(sourceKey) || [];
    owners.push(landing.id);
    activeBySource.set(sourceKey, owners);
  });
  const sourceIds = new Set(sourceSnapshot.docs.map((source) => source.id));
  const claims = [];
  const conflicts = [];
  const orphans = [];
  const unownedLegacy = [];

  sourceSnapshot.docs.forEach((source) => {
    const owners = activeBySource.get(source.id) || [];
    const configuredOwner = String(source.data()?.landingPageId || "").trim();
    if (owners.length > 1) {
      conflicts.push({ sourceKey: source.id, landingIds: owners });
    } else if (owners.length === 1 && configuredOwner !== owners[0]) {
      claims.push({ sourceKey: source.id, landingId: owners[0], previousOwner: configuredOwner });
    } else if (owners.length === 0 && configuredOwner) {
      orphans.push({ sourceKey: source.id, previousOwner: configuredOwner });
    } else if (owners.length === 0) {
      unownedLegacy.push({ sourceKey: source.id });
    }
  });
  const missingSources = [...activeBySource.entries()]
    .filter(([sourceKey]) => !sourceIds.has(sourceKey))
    .map(([sourceKey, landingIds]) => ({ sourceKey, landingIds }));

  if (apply) {
    if (conflicts.length > 0) {
      throw new LandingServiceError(
        "repair/source-conflicts",
        "Có mã nguồn đang được nhiều Landing sử dụng; cần xử lý xung đột trước.",
        { conflicts },
      );
    }
    if (claims.length + orphans.length > 400) {
      throw new LandingServiceError(
        "repair/too-many-operations",
        "Có quá nhiều cấu hình cần sửa trong một lần.",
      );
    }
    const batch = writeBatch(firestore);
    claims.forEach((claim) => {
      batch.set(doc(firestore, "source_configs", claim.sourceKey), {
        landingPageId: claim.landingId,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    });
    orphans.forEach((orphan) => {
      batch.delete(doc(firestore, "source_configs", orphan.sourceKey));
    });
    await batch.commit();
  }

  return {
    applied: apply === true,
    claims,
    conflicts,
    missingSources,
    orphans,
    unownedLegacy,
    summary: {
      claimable: claims.length,
      conflicts: conflicts.length,
      missingSources: missingSources.length,
      orphans: orphans.length,
      unownedLegacy: unownedLegacy.length,
    },
  };
};
