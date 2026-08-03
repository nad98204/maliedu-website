import { FieldValue } from "firebase-admin/firestore";

const MAX_BULK_UPDATES = 100;
const MAX_REPAIR_OPERATIONS = 400;
const FUNNEL_KEYWORDS = [
  "ads",
  "leader",
  "brand",
  "thuong_hieu",
  "thương_hiệu",
  "organic",
  "web",
];

class AdminLandingError extends Error {
  constructor(status, code, message, details = {}) {
    super(message);
    this.name = "AdminLandingError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const requiredText = (value, label, maxLength = 160) => {
  const normalized = String(value || "").trim();
  if (!normalized) {
    throw new AdminLandingError(400, "validation/required", `${label} không được để trống.`);
  }
  if (normalized.length > maxLength) {
    throw new AdminLandingError(
      400,
      "validation/too-long",
      `${label} không được vượt quá ${maxLength} ký tự.`,
    );
  }
  return normalized;
};

const normalizeDocumentId = (value, label = "ID") => {
  const documentId = requiredText(value, label, 160);
  if (documentId.includes("/")) {
    throw new AdminLandingError(
      400,
      "validation/invalid-document-id",
      `${label} không được chứa dấu '/'.`,
    );
  }
  return documentId;
};

const normalizeFunnelType = (value = "ads") => {
  const text = String(value || "ads").trim().toLowerCase();
  if (!FUNNEL_KEYWORDS.some((keyword) => text.includes(keyword))) {
    throw new AdminLandingError(400, "validation/invalid-funnel", "Phễu Landing không hợp lệ.");
  }
  if (text.includes("leader")) return "leader";
  if (text.includes("brand") || text.includes("thuong_hieu") || text.includes("thương_hiệu")) {
    return "brand";
  }
  if (text.includes("organic") || text.includes("web")) return "organic";
  return "ads";
};

const getTargetFunnel = (funnelType) => {
  if (funnelType === "leader") return "LEADER";
  if (funnelType === "brand") return "BRAND";
  return "ADS";
};

const normalizeSlug = (value) => {
  let slug = requiredText(value, "Đường dẫn Landing", 240);
  if (!slug.startsWith("/")) slug = `/${slug}`;
  slug = slug.replace(/\/{2,}/g, "/");

  if (
    slug.includes("..")
    || slug.includes("?")
    || slug.includes("#")
    || !/^\/[\p{L}\p{N}/_-]+$/u.test(slug)
  ) {
    throw new AdminLandingError(
      400,
      "validation/invalid-slug",
      "Đường dẫn Landing chỉ được chứa chữ, số, gạch ngang, gạch dưới và dấu '/'.",
    );
  }
  return slug;
};

const normalizeSourceKey = (value) => {
  const sourceKey = requiredText(value, "Mã nguồn", 160)
    .toLowerCase()
    .replace(/\s+/g, "_");
  if (!/^[a-z0-9_-]+$/.test(sourceKey)) {
    throw new AdminLandingError(
      400,
      "validation/invalid-source-key",
      "Mã nguồn chỉ được chứa chữ thường không dấu, số, gạch ngang và gạch dưới.",
    );
  }
  return sourceKey;
};

const normalizeCourseK = (value) => {
  const courseK = requiredText(value, "Khóa K", 16).toUpperCase().replace(/\s+/g, "");
  if (!/^K\d+$/.test(courseK)) {
    throw new AdminLandingError(400, "validation/invalid-course-k", "Khóa K phải có định dạng như K51.");
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
    throw new AdminLandingError(400, "validation/invalid-url", `${label} không đúng định dạng URL.`);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new AdminLandingError(
      400,
      "validation/invalid-url",
      `${label} phải bắt đầu bằng http:// hoặc https://.`,
    );
  }
  return parsed.toString();
};

const normalizeCurrency = (value) => {
  const currency = String(value || "VND").trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) {
    throw new AdminLandingError(400, "validation/invalid-currency", "Mã tiền tệ phải gồm đúng 3 chữ cái.");
  }
  return currency;
};

const normalizeEventValue = (value) => {
  const parsed = Number(String(value ?? "0").replace(",", "."));
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1_000_000_000) {
    throw new AdminLandingError(
      400,
      "validation/invalid-event-value",
      "Giá trị event phải từ 0 đến 1.000.000.000.",
    );
  }
  return parsed;
};

const normalizeLandingInput = (input = {}) => {
  const funnelType = normalizeFunnelType(input.funnelType || input.targetFunnel);
  const courseK = normalizeCourseK(input.courseK || input.targetK);
  const zaloLink = optionalHttpUrl(input.zaloLink, "Link Zalo Group");
  const fbPixel = String(input.fbPixel || "").trim();
  if (fbPixel && !/^\d{5,30}$/.test(fbPixel)) {
    throw new AdminLandingError(
      400,
      "validation/invalid-pixel",
      "Facebook Pixel ID chỉ được chứa từ 5 đến 30 chữ số.",
    );
  }

  return {
    landingId: normalizeDocumentId(input.landingId, "ID Landing"),
    name: requiredText(input.name, "Tên Landing", 160),
    slug: normalizeSlug(input.slug),
    sourceKey: normalizeSourceKey(input.sourceKey),
    isMaintenance: Boolean(input.isMaintenance),
    funnelType,
    targetFunnel: getTargetFunnel(funnelType),
    targetCourseId: requiredText(input.targetCourseId, "Khóa học", 160),
    courseK,
    targetK: normalizeCourseK(input.targetK || courseK),
    zaloLink,
    thankYouZaloLink: optionalHttpUrl(
      input.thankYouZaloLink || zaloLink,
      "Link Zalo trang cảm ơn",
    ),
    fbPixel,
    fbCurrency: normalizeCurrency(input.fbCurrency),
    fbEventValue: normalizeEventValue(input.fbEventValue),
  };
};

const normalizeRoutingUpdate = (input = {}) => {
  const funnelType = normalizeFunnelType(input.funnelType);
  return {
    landingId: normalizeDocumentId(input.landingId, "ID Landing"),
    sourceKey: normalizeSourceKey(input.sourceKey),
    funnelType,
    targetFunnel: getTargetFunnel(funnelType),
    courseK: input.courseK ? normalizeCourseK(input.courseK) : null,
  };
};

const assertSourceOwnership = ({ snapshot, landingId, currentSourceKey, nextSourceKey }) => {
  if (!snapshot.exists) return;
  const ownerId = String(snapshot.data()?.landingPageId || "").trim();
  const isCurrentLegacySource = !ownerId && currentSourceKey === nextSourceKey;
  if (ownerId !== landingId && !isCurrentLegacySource) {
    throw new AdminLandingError(
      409,
      "conflict/source-key",
      `Mã nguồn “${nextSourceKey}” đã được Landing khác sử dụng.`,
      { landingId, ownerId, sourceKey: nextSourceKey },
    );
  }
};

const canDeleteSource = (snapshot, landingId) =>
  snapshot?.exists && String(snapshot.data()?.landingPageId || "").trim() === landingId;

const buildSourceRecord = ({ landing, existingSource = {} }) => ({
  ...existingSource,
  id: landing.sourceKey,
  sourceKey: landing.sourceKey,
  source_name: landing.name,
  name: landing.name,
  landingPageId: landing.landingId,
  landingSlug: landing.slug,
  targetCourseId: landing.targetCourseId,
  targetK: landing.targetK,
  targetFunnel: landing.targetFunnel,
  funnel_type: landing.funnelType,
  assignedSale: landing.funnelType === "leader" ? "" : "Round Robin",
  assignmentMode: landing.funnelType === "leader" ? "leader_referrer" : "sales",
  targetZalo: landing.zaloLink,
  updatedAt: FieldValue.serverTimestamp(),
});

const buildAuditRecord = ({ adminUser, action, landingId, details = {} }) => ({
  action,
  actorEmail: String(adminUser?.email || "").trim().toLowerCase(),
  actorUid: String(adminUser?.uid || ""),
  createdAt: FieldValue.serverTimestamp(),
  landingId,
  ...details,
});

const serializeValue = (value) => {
  if (value?.toDate) return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(serializeValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, serializeValue(child)]),
    );
  }
  return value;
};

const sanitizeLanding = (snapshot) => {
  const data = snapshot.data() || {};
  return serializeValue({
    id: snapshot.id,
    name: data.name || "",
    slug: data.slug || "",
    active_source_key: data.active_source_key || "",
    is_maintenance: data.is_maintenance === true,
    zaloLink: data.zaloLink || "",
    thankYouZaloLink: data.thankYouZaloLink || "",
    fbPixel: data.fbPixel || "",
    fbCurrency: data.fbCurrency || "VND",
    fbEventValue: Number(data.fbEventValue) || 0,
    course_k: data.course_k || "",
    targetFunnel: data.targetFunnel || "",
    funnel_type: data.funnel_type || "",
    assignmentMode: data.assignmentMode || "",
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
  });
};

const sanitizeSource = (snapshot) => {
  const data = snapshot.data() || {};
  return serializeValue({
    id: snapshot.id,
    landingPageId: data.landingPageId || "",
    targetCourseId: data.targetCourseId || "",
    targetK: data.targetK || "",
    targetFunnel: data.targetFunnel || "",
    funnel_type: data.funnel_type || "",
    assignedSale: data.assignedSale || "",
    assignmentMode: data.assignmentMode || "",
    targetZalo: data.targetZalo || "",
  });
};

const parseSchedule = (input = {}) => {
  const eventStart = requiredText(input.eventStart, "Thời gian bắt đầu", 40);
  if (!Number.isFinite(new Date(eventStart).getTime())) {
    throw new AdminLandingError(400, "validation/invalid-date", "Thời gian bắt đầu không hợp lệ.");
  }
  const countdown = Number.parseInt(input.thankYouCountdownSeconds, 10);
  if (!Number.isInteger(countdown) || countdown < 1 || countdown > 86_400) {
    throw new AdminLandingError(
      400,
      "validation/invalid-countdown",
      "Thời gian đếm ngược phải từ 1 đến 86.400 giây.",
    );
  }
  return {
    eventStart,
    ctaScheduleLabel: requiredText(input.ctaScheduleLabel, "Dòng thời gian CTA", 120),
    thankYouCountdownSeconds: countdown,
    thankYouZaloLink: optionalHttpUrl(input.thankYouZaloLink, "Link Zalo trang cảm ơn"),
  };
};

const getWorkspace = async ({ crmFirestore, crmDatabase, scheduleDocumentId }) => {
  const [landingSnapshot, courseSnapshot, scheduleSnapshot, userSnapshot] = await Promise.all([
    crmFirestore.collection("landing_pages").get(),
    crmFirestore.collection("courses_config").get(),
    crmFirestore.collection("public_settings").doc(scheduleDocumentId).get(),
    crmDatabase.ref("system_settings/users").once("value").catch((error) => {
      console.warn("Unable to load CRM users; continuing without assignee options:", error?.message || error);
      return null;
    }),
  ]);

  const sourceRefs = landingSnapshot.docs
    .map((landing) => String(landing.data()?.active_source_key || "").trim())
    .filter(Boolean)
    .map((sourceKey) => crmFirestore.collection("source_configs").doc(sourceKey));
  const sourceSnapshots = sourceRefs.length > 0
    ? await crmFirestore.getAll(...sourceRefs)
    : [];

  const sourceConfigs = Object.fromEntries(
    sourceSnapshots.filter((snapshot) => snapshot.exists).map((snapshot) => [
      snapshot.id,
      sanitizeSource(snapshot),
    ]),
  );
  const courses = courseSnapshot.docs.map((course) => {
    const data = course.data() || {};
    return {
      id: course.id,
      name: String(data.name || course.id),
      batches: Array.isArray(data.batches)
        ? data.batches.map(String).slice(0, 200)
        : Array.isArray(data.k_list)
          ? data.k_list.map(String).slice(0, 200)
          : [],
    };
  });
  const crmUsers = Object.values(userSnapshot?.val?.() || {})
    .filter((user) => user?.isActive !== false)
    .slice(0, 2_000)
    .map((user) => ({
      email: String(user.email || ""),
      isActive: user.isActive !== false,
      name: String(user.name || ""),
      position: String(user.position || ""),
      role: String(user.role || ""),
      team: String(user.team || ""),
      title: String(user.title || ""),
    }));

  let schedule = scheduleSnapshot.exists ? scheduleSnapshot.data() : null;
  if (!schedule) {
    schedule = landingSnapshot.docs
      .map((item) => item.data() || {})
      .find((item) => item.eventStart || item.ctaScheduleLabel || item.thankYouCountdownSeconds) || null;
  }

  return {
    courses,
    crmUsers,
    landings: landingSnapshot.docs.map(sanitizeLanding),
    schedule: schedule ? serializeValue(schedule) : null,
    sourceConfigs,
  };
};

const saveLanding = async ({ crmFirestore, adminUser, rawInput }) => {
  const landing = normalizeLandingInput(rawInput);
  const landingRef = crmFirestore.collection("landing_pages").doc(landing.landingId);
  const nextSourceRef = crmFirestore.collection("source_configs").doc(landing.sourceKey);
  const auditRef = crmFirestore.collection("admin_landing_audit_logs").doc();

  await crmFirestore.runTransaction(async (transaction) => {
    const landingSnapshot = await transaction.get(landingRef);
    const currentLanding = landingSnapshot.exists ? landingSnapshot.data() || {} : {};
    const currentSourceKey = String(currentLanding.active_source_key || "").trim();
    const currentSourceRef = currentSourceKey
      ? crmFirestore.collection("source_configs").doc(currentSourceKey)
      : null;
    const nextSourceSnapshot = await transaction.get(nextSourceRef);
    const currentSourceSnapshot = currentSourceRef && currentSourceKey !== landing.sourceKey
      ? await transaction.get(currentSourceRef)
      : nextSourceSnapshot;

    assertSourceOwnership({
      snapshot: nextSourceSnapshot,
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
      fbCapiToken: FieldValue.delete(),
      fbCurrency: landing.fbCurrency,
      fbEventValue: landing.fbEventValue,
      course_k: landing.courseK,
      targetFunnel: landing.targetFunnel,
      funnel_type: landing.funnelType,
      assignmentMode: landing.funnelType === "leader" ? "leader_referrer" : "sales",
      ...(!landingSnapshot.exists ? { createdAt: FieldValue.serverTimestamp() } : {}),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    transaction.set(
      nextSourceRef,
      buildSourceRecord({
        landing,
        existingSource: nextSourceSnapshot.exists ? nextSourceSnapshot.data() || {} : {},
      }),
      { merge: true },
    );
    if (
      currentSourceRef
      && currentSourceKey !== landing.sourceKey
      && canDeleteSource(currentSourceSnapshot, landing.landingId)
    ) {
      transaction.delete(currentSourceRef);
    }
    transaction.set(auditRef, buildAuditRecord({
      adminUser,
      action: landingSnapshot.exists ? "landing.update" : "landing.create",
      landingId: landing.landingId,
      details: {
        previousSourceKey: currentSourceKey,
        sourceKey: landing.sourceKey,
      },
    }));
  });

  return landing;
};

const deleteLanding = async ({ crmFirestore, adminUser, landingId }) => {
  const normalizedLandingId = normalizeDocumentId(landingId, "ID Landing");
  const landingRef = crmFirestore.collection("landing_pages").doc(normalizedLandingId);
  const auditRef = crmFirestore.collection("admin_landing_audit_logs").doc();

  return crmFirestore.runTransaction(async (transaction) => {
    const landingSnapshot = await transaction.get(landingRef);
    if (!landingSnapshot.exists) {
      throw new AdminLandingError(404, "not-found/landing", "Landing Page không còn tồn tại.");
    }
    const sourceKey = String(landingSnapshot.data()?.active_source_key || "").trim();
    const sourceRef = sourceKey
      ? crmFirestore.collection("source_configs").doc(sourceKey)
      : null;
    const sourceSnapshot = sourceRef ? await transaction.get(sourceRef) : null;

    transaction.delete(landingRef);
    if (sourceRef && canDeleteSource(sourceSnapshot, normalizedLandingId)) {
      transaction.delete(sourceRef);
    }
    transaction.set(auditRef, buildAuditRecord({
      adminUser,
      action: "landing.delete",
      landingId: normalizedLandingId,
      details: { sourceKey },
    }));
    return { landingId: normalizedLandingId, sourceKey };
  });
};

const updateRouting = async ({ crmFirestore, adminUser, rawUpdates }) => {
  if (!Array.isArray(rawUpdates) || rawUpdates.length === 0) {
    throw new AdminLandingError(400, "validation/empty-batch", "Không có Landing nào để cập nhật.");
  }
  if (rawUpdates.length > MAX_BULK_UPDATES) {
    throw new AdminLandingError(
      400,
      "validation/batch-too-large",
      `Mỗi lần chỉ được cập nhật tối đa ${MAX_BULK_UPDATES} Landing.`,
    );
  }

  const updates = rawUpdates.map(normalizeRoutingUpdate);
  const landingIds = new Set();
  const sourceKeys = new Set();
  updates.forEach((update) => {
    if (landingIds.has(update.landingId)) {
      throw new AdminLandingError(400, "validation/duplicate-landing", `Landing “${update.landingId}” bị lặp.`);
    }
    if (sourceKeys.has(update.sourceKey)) {
      throw new AdminLandingError(409, "conflict/source-key", `Mã nguồn “${update.sourceKey}” bị trùng.`);
    }
    landingIds.add(update.landingId);
    sourceKeys.add(update.sourceKey);
  });

  await crmFirestore.runTransaction(async (transaction) => {
    const entries = await Promise.all(updates.map(async (update) => {
      const landingRef = crmFirestore.collection("landing_pages").doc(update.landingId);
      const snapshot = await transaction.get(landingRef);
      if (!snapshot.exists) {
        throw new AdminLandingError(404, "not-found/landing", `Landing “${update.landingId}” không còn tồn tại.`);
      }
      return { update, landingRef, snapshot, data: snapshot.data() || {} };
    }));

    const sourceRefs = new Map();
    entries.forEach(({ update, data }) => {
      const currentSourceKey = String(data.active_source_key || "").trim();
      const nextRef = crmFirestore.collection("source_configs").doc(update.sourceKey);
      sourceRefs.set(nextRef.path, nextRef);
      if (currentSourceKey) {
        const currentRef = crmFirestore.collection("source_configs").doc(currentSourceKey);
        sourceRefs.set(currentRef.path, currentRef);
      }
    });
    const sourceEntries = await Promise.all(
      [...sourceRefs.values()].map(async (reference) => [reference.path, await transaction.get(reference)]),
    );
    const snapshotsByPath = new Map(sourceEntries);

    entries.forEach(({ update, landingRef, data }) => {
      const currentSourceKey = String(data.active_source_key || "").trim();
      const currentSourceRef = currentSourceKey
        ? crmFirestore.collection("source_configs").doc(currentSourceKey)
        : null;
      const nextSourceRef = crmFirestore.collection("source_configs").doc(update.sourceKey);
      const currentSourceSnapshot = currentSourceRef
        ? snapshotsByPath.get(currentSourceRef.path)
        : null;
      const nextSourceSnapshot = snapshotsByPath.get(nextSourceRef.path);

      assertSourceOwnership({
        snapshot: nextSourceSnapshot,
        landingId: update.landingId,
        currentSourceKey,
        nextSourceKey: update.sourceKey,
      });
      const sourceData = currentSourceSnapshot?.exists
        ? currentSourceSnapshot.data() || {}
        : nextSourceSnapshot?.exists
          ? nextSourceSnapshot.data() || {}
          : {};
      const courseK = update.courseK || normalizeCourseK(data.course_k || sourceData.targetK || "K41");
      const landing = {
        landingId: update.landingId,
        name: requiredText(data.name, "Tên Landing", 160),
        slug: normalizeSlug(data.slug),
        sourceKey: update.sourceKey,
        targetCourseId: String(sourceData.targetCourseId || data.targetCourseId || "").trim(),
        targetK: courseK,
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
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      transaction.set(nextSourceRef, buildSourceRecord({ landing, existingSource: sourceData }), { merge: true });
      if (
        currentSourceRef
        && currentSourceKey !== update.sourceKey
        && canDeleteSource(currentSourceSnapshot, update.landingId)
      ) {
        transaction.delete(currentSourceRef);
      }
      transaction.set(
        crmFirestore.collection("admin_landing_audit_logs").doc(),
        buildAuditRecord({
          adminUser,
          action: "landing.routing.update",
          landingId: update.landingId,
          details: { previousSourceKey: currentSourceKey, sourceKey: update.sourceKey },
        }),
      );
    });
  });

  return updates;
};

const repairSources = async ({ crmFirestore, adminUser, apply }) => {
  const [landingSnapshot, sourceSnapshot] = await Promise.all([
    crmFirestore.collection("landing_pages").get(),
    crmFirestore.collection("source_configs").get(),
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
  const orphans = [];
  const conflicts = [];
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
  const operationCount = claims.length + orphans.length;

  if (apply) {
    if (conflicts.length > 0) {
      throw new AdminLandingError(
        409,
        "repair/source-conflicts",
        "Có mã nguồn đang được nhiều Landing sử dụng; cần xử lý xung đột trước.",
        { conflicts },
      );
    }
    if (operationCount > MAX_REPAIR_OPERATIONS) {
      throw new AdminLandingError(
        400,
        "repair/too-many-operations",
        `Mỗi lần chỉ sửa tối đa ${MAX_REPAIR_OPERATIONS} cấu hình nguồn.`,
      );
    }
    const batch = crmFirestore.batch();
    claims.forEach((claim) => {
      batch.set(crmFirestore.collection("source_configs").doc(claim.sourceKey), {
        landingPageId: claim.landingId,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    });
    orphans.forEach((orphan) => {
      batch.delete(crmFirestore.collection("source_configs").doc(orphan.sourceKey));
    });
    batch.set(
      crmFirestore.collection("admin_landing_audit_logs").doc(),
      buildAuditRecord({
        adminUser,
        action: "landing.sources.repair",
        landingId: "*",
        details: { claimed: claims.length, deleted: orphans.length },
      }),
    );
    await batch.commit();
  }

  return {
    applied: Boolean(apply),
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

export const createAdminLandingHandlers = ({
  createJsonResponse,
  getCrmDatabase,
  getCrmFirestore,
  scheduleDocumentId,
}) => ({
  getWorkspace: async () => {
    const workspace = await getWorkspace({
      crmFirestore: getCrmFirestore(),
      crmDatabase: getCrmDatabase(),
      scheduleDocumentId,
    });
    return createJsonResponse(workspace, 200, { "cache-control": "no-store" });
  },
  save: async ({ request, adminUser }) => {
    const result = await saveLanding({
      crmFirestore: getCrmFirestore(),
      adminUser,
      rawInput: await request.json(),
    });
    return createJsonResponse({ success: true, landing: result });
  },
  delete: async ({ request, adminUser }) => {
    const body = await request.json();
    const result = await deleteLanding({
      crmFirestore: getCrmFirestore(),
      adminUser,
      landingId: body?.landingId,
    });
    return createJsonResponse({ success: true, ...result });
  },
  updateRouting: async ({ request, adminUser }) => {
    const body = await request.json();
    const updates = await updateRouting({
      crmFirestore: getCrmFirestore(),
      adminUser,
      rawUpdates: body?.updates,
    });
    return createJsonResponse({ success: true, updates });
  },
  saveSchedule: async ({ request, adminUser }) => {
    const schedule = parseSchedule(await request.json());
    await getCrmFirestore().collection("public_settings").doc(scheduleDocumentId).set({
      ...schedule,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: String(adminUser?.uid || ""),
    }, { merge: true });
    return createJsonResponse({ success: true, schedule });
  },
  repairSources: async ({ request, adminUser }) => {
    const body = await request.json();
    const result = await repairSources({
      crmFirestore: getCrmFirestore(),
      adminUser,
      apply: body?.apply === true,
    });
    return createJsonResponse(result);
  },
});

export const adminLandingTestables = {
  normalizeCourseK,
  normalizeFunnelType,
  normalizeLandingInput,
  normalizeSlug,
  normalizeSourceKey,
  parseSchedule,
};
