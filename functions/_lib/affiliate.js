import { createHash } from "node:crypto";

export const AFFILIATE_COLLECTIONS = Object.freeze({
  affiliates: "affiliates",
  codes: "affiliate_codes",
  commissions: "affiliate_commissions",
  couponCodes: "affiliate_coupon_codes",
  clickEvents: "affiliate_click_events",
  payouts: "affiliate_payouts",
  settings: "affiliate_settings",
});

export const DEFAULT_AFFILIATE_SETTINGS = Object.freeze({
  defaultCommissionPercent: 30,
  cookieDurationDays: 30,
  minPayoutAmount: 200000,
  autoApproveAffiliate: true,
  payoutTerms: "Hoa hồng được đối soát và thanh toán linh hoạt khi đạt số dư tối thiểu.",
});

const SETTINGS_DOC_ID = "general";
const MAX_PAGE_SIZE = 100;

const httpError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const asFiniteNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const normalizeAffiliateCode = (value) => {
  const normalized = String(value || "").trim().toUpperCase();
  return /^[A-Z0-9_-]{3,20}$/.test(normalized) ? normalized : "";
};

export const normalizeCouponCode = (value) => {
  const normalized = String(value || "").trim().toUpperCase();
  return /^[A-Z0-9_-]{2,40}$/.test(normalized) ? normalized : "";
};

export const normalizeAffiliateSettings = (value = {}) => ({
  defaultCommissionPercent: clamp(
    asFiniteNumber(value.defaultCommissionPercent, DEFAULT_AFFILIATE_SETTINGS.defaultCommissionPercent),
    0,
    100,
  ),
  cookieDurationDays: clamp(
    Math.round(asFiniteNumber(value.cookieDurationDays, DEFAULT_AFFILIATE_SETTINGS.cookieDurationDays)),
    0,
    3650,
  ),
  minPayoutAmount: Math.max(
    50000,
    Math.round(asFiniteNumber(value.minPayoutAmount, DEFAULT_AFFILIATE_SETTINGS.minPayoutAmount)),
  ),
  autoApproveAffiliate: value.autoApproveAffiliate !== false,
  payoutTerms: String(
    value.payoutTerms || DEFAULT_AFFILIATE_SETTINGS.payoutTerms,
  ).trim().slice(0, 1000),
});

const normalizePercent = (value, fallback = 0) => clamp(
  asFiniteNumber(value, fallback),
  0,
  100,
);

const serialize = (value) => {
  if (value == null) return value;
  if (typeof value?.toDate === "function") return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(serialize);
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, serialize(child)]),
    );
  }
  return value;
};

const snapshotData = (snapshot) => ({
  ...serialize(snapshot.data() || {}),
  id: snapshot.id,
});

const affiliateCouponDocumentId = (affiliateId) => `affiliate_${affiliateId}`;

const buildAffiliateCoupon = ({ affiliate, affiliateId, fieldValue }) => ({
  affiliateCode: affiliate.affiliateCode,
  affiliateId,
  code: affiliate.couponCode,
  createdAt: affiliate.createdAt || fieldValue.serverTimestamp(),
  discountPercent: normalizePercent(affiliate.couponDiscountPercent, 10),
  // Mã Affiliate không hết hạn; ngày xa giúp tương thích giao diện coupon cũ.
  expiryDate: "2099-12-31T23:59:59.000Z",
  isActive: affiliate.status === "active",
  source: "affiliate",
  updatedAt: fieldValue.serverTimestamp(),
});

const getSettings = async (db) => {
  const snapshot = await db
    .collection(AFFILIATE_COLLECTIONS.settings)
    .doc(SETTINGS_DOC_ID)
    .get();
  return normalizeAffiliateSettings({
    ...DEFAULT_AFFILIATE_SETTINGS,
    ...(snapshot.exists ? snapshot.data() : {}),
  });
};

const findAffiliateByField = async (db, field, value) => {
  const snapshot = await db
    .collection(AFFILIATE_COLLECTIONS.affiliates)
    .where(field, "==", value)
    .limit(2)
    .get();
  if (snapshot.size > 1) throw httpError(409, "Mã Affiliate bị trùng. Vui lòng liên hệ quản trị viên.");
  if (snapshot.empty) return null;
  return snapshotData(snapshot.docs[0]);
};

export const findAffiliateByCode = async (db, code) => {
  const normalizedCode = normalizeAffiliateCode(code);
  if (!normalizedCode) return null;

  const codeSnapshot = await db
    .collection(AFFILIATE_COLLECTIONS.codes)
    .doc(normalizedCode)
    .get();
  if (codeSnapshot.exists && codeSnapshot.data()?.affiliateId) {
    const affiliateSnapshot = await db
      .collection(AFFILIATE_COLLECTIONS.affiliates)
      .doc(String(codeSnapshot.data().affiliateId))
      .get();
    if (affiliateSnapshot.exists && affiliateSnapshot.data()?.affiliateCode === normalizedCode) {
      return snapshotData(affiliateSnapshot);
    }
  }

  // Tương thích hồ sơ được tạo trước khi có registry mã duy nhất.
  return findAffiliateByField(db, "affiliateCode", normalizedCode);
};

const findAffiliateByCoupon = async (db, code) => {
  const normalizedCode = normalizeCouponCode(code);
  if (!normalizedCode) return null;

  const codeSnapshot = await db
    .collection(AFFILIATE_COLLECTIONS.couponCodes)
    .doc(normalizedCode)
    .get();
  if (codeSnapshot.exists && codeSnapshot.data()?.affiliateId) {
    const affiliateSnapshot = await db
      .collection(AFFILIATE_COLLECTIONS.affiliates)
      .doc(String(codeSnapshot.data().affiliateId))
      .get();
    if (affiliateSnapshot.exists && affiliateSnapshot.data()?.couponCode === normalizedCode) {
      return snapshotData(affiliateSnapshot);
    }
  }

  return findAffiliateByField(db, "couponCode", normalizedCode);
};

export const resolveCoupon = async (db, rawCode) => {
  const code = normalizeCouponCode(rawCode);
  if (!code) return null;

  const couponSnapshot = await db
    .collection("coupons")
    .where("code", "==", code)
    .limit(2)
    .get();
  if (couponSnapshot.size > 1) return null;
  let coupon = couponSnapshot.empty ? null : couponSnapshot.docs[0].data() || {};

  if (!coupon) {
    const affiliate = await findAffiliateByCoupon(db, code);
    if (affiliate?.status === "active") {
      coupon = {
        affiliateCode: affiliate.affiliateCode,
        affiliateId: affiliate.userId || affiliate.id,
        code,
        discountPercent: affiliate.couponDiscountPercent,
        isActive: true,
        source: "affiliate",
      };
    }
  }

  if (!coupon || coupon.isActive !== true) return null;
  if (coupon.affiliateId || coupon.source === "affiliate") {
    const affiliate = await findAffiliateByCoupon(db, code);
    if (!affiliate || affiliate.status !== "active"
      || (coupon.affiliateId && coupon.affiliateId !== (affiliate.userId || affiliate.id))) return null;
    coupon = { ...coupon, affiliateId: affiliate.userId || affiliate.id, affiliateCode: affiliate.affiliateCode };
  }
  const expiry = coupon.expiryDate?.toDate?.()
    || (coupon.expiryDate ? new Date(coupon.expiryDate) : null);
  if (expiry && (!Number.isFinite(expiry.getTime()) || expiry < new Date())) return null;

  const discountPercent = Number(coupon.discountPercent);
  if (!Number.isFinite(discountPercent) || discountPercent < 0 || discountPercent > 100) {
    return null;
  }

  return {
    affiliateCode: normalizeAffiliateCode(coupon.affiliateCode),
    affiliateId: String(coupon.affiliateId || "").trim() || null,
    code,
    discountPercent,
    source: coupon.source || "standard",
  };
};

export const resolveOrderAffiliate = async ({
  affiliateCode,
  coupon,
  db,
  userEmail,
  userId,
}) => {
  let affiliate = null;
  let attributionType = "ref_link";

  if (coupon?.affiliateId) {
    const snapshot = await db
      .collection(AFFILIATE_COLLECTIONS.affiliates)
      .doc(coupon.affiliateId)
      .get();
    if (snapshot.exists) affiliate = snapshotData(snapshot);
    attributionType = "coupon";
  }
  if (!affiliate && coupon?.affiliateCode) {
    affiliate = await findAffiliateByCode(db, coupon.affiliateCode);
    attributionType = "coupon";
  }
  if (!affiliate && affiliateCode) {
    affiliate = await findAffiliateByCode(db, affiliateCode);
    attributionType = "ref_link";
  }

  if (!affiliate || affiliate.status !== "active") return null;
  const affiliateId = String(affiliate.userId || affiliate.id);
  const normalizedEmail = String(userEmail || "").trim().toLowerCase();
  if (
    affiliateId === String(userId || "")
    || (normalizedEmail && String(affiliate.email || "").trim().toLowerCase() === normalizedEmail)
  ) {
    return null;
  }

  return {
    affiliateCode: affiliate.affiliateCode,
    affiliateId,
    attributionType,
  };
};

export const calculateCommissionBreakdown = ({
  affiliate,
  courseRates = {},
  defaultCommissionPercent,
  items = [],
  orderAmount,
}) => {
  const normalizedItems = items.map((item) => ({
    ...item,
    id: String(item.id || item.courseId || ""),
    price: Math.max(0, Math.round(asFiniteNumber(item.price, 0))),
  }));
  const grossTotal = normalizedItems.reduce((total, item) => total + item.price, 0);
  const paidTotal = Math.max(0, Math.round(asFiniteNumber(orderAmount, 0)));
  if (!grossTotal || !paidTotal) return { commissionAmount: 0, items: [] };

  // Largest-remainder allocation preserves the exact paid total, including tiny
  // discounted orders; rounding every item independently can over-credit.
  const allocations = normalizedItems.map((item, index) => {
    const exact = (paidTotal * item.price) / grossTotal;
    return { index, amount: Math.floor(exact), remainder: exact - Math.floor(exact) };
  });
  const remaining = paidTotal - allocations.reduce((total, item) => total + item.amount, 0);
  const ranked = [...allocations].sort((a, b) => b.remainder - a.remainder || a.index - b.index);
  for (let index = 0; index < remaining; index += 1) ranked[index].amount += 1;
  const breakdown = normalizedItems.map((item, index) => {
    const netAmount = allocations[index].amount;

    const courseRate = courseRates[item.id];
    const rawRate = affiliate.customCommissionPercent != null
      ? affiliate.customCommissionPercent
      : (courseRate != null ? courseRate : defaultCommissionPercent);
    const commissionPercent = normalizePercent(rawRate, defaultCommissionPercent);

    return {
      courseId: item.id,
      courseName: String(item.name || item.courseName || "Khóa học").slice(0, 300),
      grossAmount: item.price,
      netAmount,
      commissionPercent,
      commissionAmount: Math.round((netAmount * commissionPercent) / 100),
    };
  });

  return {
    commissionAmount: breakdown.reduce((total, item) => total + item.commissionAmount, 0),
    items: breakdown,
  };
};

export const processAffiliateCommission = async ({ db, fieldValue, orderId, orderData }) => {
  if (!orderId || !orderData || orderData.status !== "completed") return null;
  // Events may arrive late or be delivered again. Always use the current order.
  const orderRef = db.collection("orders").doc(orderId);
  const sourceOrder = await orderRef.get();
  if (!sourceOrder.exists || sourceOrder.data()?.status !== "completed") return null;
  orderData = sourceOrder.data();
  if (orderData.affiliateCommissionId) return { duplicate: true, id: orderData.affiliateCommissionId };

  let affiliateId = String(orderData.affiliateId || "").trim();
  let affiliate = null;
  let attributionType = orderData.affiliateAttributionType || "ref_link";
  if (affiliateId) {
    const snapshot = await db
      .collection(AFFILIATE_COLLECTIONS.affiliates)
      .doc(affiliateId)
      .get();
    if (snapshot.exists) affiliate = snapshotData(snapshot);
  }
  if (!orderData.affiliateAttributionVersion && !affiliateId && !affiliate && orderData.couponCode) {
    affiliate = await findAffiliateByCoupon(db, orderData.couponCode);
    if (affiliate) attributionType = "coupon";
  }
  if (!orderData.affiliateAttributionVersion && !affiliateId && !affiliate && orderData.affiliateCode) {
    affiliate = await findAffiliateByCode(db, orderData.affiliateCode);
    if (affiliate) attributionType = "ref_link";
  }
  if (!affiliate || affiliate.status !== "active") return null;

  affiliateId = String(affiliate.userId || affiliate.id);
  const affiliateEmail = String(affiliate.email || "").trim().toLowerCase();
  const customerEmails = [orderData.userEmail, orderData.customerEmail]
    .map((value) => String(value || "").trim().toLowerCase())
    .filter(Boolean);
  if (affiliateId === String(orderData.userId || "") || customerEmails.includes(affiliateEmail)) {
    return null;
  }

  const items = Array.isArray(orderData.items) && orderData.items.length
    ? orderData.items
    : [{
      id: orderData.courseId,
      name: orderData.courseName,
      price: orderData.originalAmount || orderData.amount,
    }];
  const courseIds = [...new Set(items
    .map((item) => String(item.id || item.courseId || ""))
    .filter((id) => /^[A-Za-z0-9_-]{1,128}$/.test(id)))];
  const courseSnapshots = courseIds.length
    ? await db.getAll(...courseIds.map((id) => db.collection("courses").doc(id)))
    : [];
  const courseRates = Object.fromEntries(courseSnapshots.map((snapshot) => [
    snapshot.id,
    snapshot.exists && snapshot.data()?.affiliateCommissionPercent != null
      ? normalizePercent(snapshot.data().affiliateCommissionPercent)
      : null,
  ]));
  const settings = await getSettings(db);
  const calculation = calculateCommissionBreakdown({
    affiliate,
    courseRates,
    defaultCommissionPercent: settings.defaultCommissionPercent,
    items,
    orderAmount: orderData.amount,
  });
  if (calculation.commissionAmount <= 0) return null;

  const commissionRef = db
    .collection(AFFILIATE_COLLECTIONS.commissions)
    .doc(orderId);
  const affiliateRef = db.collection(AFFILIATE_COLLECTIONS.affiliates).doc(affiliateId);
  const result = await db.runTransaction(async (transaction) => {
    const [currentOrder, existingCommissions, affiliateSnapshot] = await Promise.all([
      transaction.get(orderRef),
      // Includes legacy records whose IDs were orderId_affiliateId or auto IDs.
      transaction.get(db.collection(AFFILIATE_COLLECTIONS.commissions).where("orderId", "==", orderId).limit(1)),
      transaction.get(affiliateRef),
    ]);
    if (!currentOrder.exists || currentOrder.data()?.status !== "completed") return null;
    if (currentOrder.data()?.affiliateCommissionId) {
      return { duplicate: true, id: currentOrder.data().affiliateCommissionId };
    }
    if (!existingCommissions.empty) {
      const existingCommission = existingCommissions.docs[0];
      transaction.update(orderRef, { affiliateCommissionId: existingCommission.id });
      return { duplicate: true, ...snapshotData(existingCommission) };
    }
    if (!currentOrder.updateTime.isEqual(sourceOrder.updateTime)) {
      throw new Error("Order changed during commission calculation; retry with current data.");
    }
    if (!affiliateSnapshot.exists || affiliateSnapshot.data()?.status !== "active") return null;

    const record = {
      affiliateCode: affiliate.affiliateCode,
      affiliateId,
      affiliateName: affiliate.name || "Cộng tác viên",
      attributionType,
      commissionAmount: calculation.commissionAmount,
      commissionItems: calculation.items,
      commissionPercent: calculation.items.every((item) => item.commissionPercent === calculation.items[0].commissionPercent)
        ? calculation.items[0].commissionPercent : null,
      courseId: orderData.courseId || calculation.items[0]?.courseId || "",
      courseName: orderData.courseName || calculation.items.map((item) => item.courseName).join(", "),
      createdAt: fieldValue.serverTimestamp(),
      customerEmail: orderData.customerEmail || orderData.userEmail || "",
      customerName: orderData.customerName || "Học viên",
      orderAmount: Math.max(0, Math.round(asFiniteNumber(orderData.amount, 0))),
      orderCode: orderData.orderCode || orderId,
      orderId,
      status: "approved",
    };
    transaction.create(commissionRef, record);
    transaction.update(orderRef, { affiliateCommissionId: commissionRef.id });
    transaction.update(affiliateRef, {
      "stats.balance": fieldValue.increment(calculation.commissionAmount),
      "stats.totalCommission": fieldValue.increment(calculation.commissionAmount),
      "stats.totalOrders": fieldValue.increment(1),
      "stats.totalRevenue": fieldValue.increment(record.orderAmount),
      updatedAt: fieldValue.serverTimestamp(),
    });
    return { duplicate: false, ...record };
  });

  return serialize(result);
};

const validateBankInfo = (bankInfo = {}) => {
  const bankName = String(bankInfo.bankName || "").trim().slice(0, 100);
  const accountNumber = String(bankInfo.accountNumber || "").replace(/\s+/g, "").slice(0, 40);
  const accountHolder = String(bankInfo.accountHolder || "").trim().toUpperCase().slice(0, 120);
  if (!bankName || !/^[A-Za-z0-9-]{5,40}$/.test(accountNumber) || accountHolder.length < 2) {
    throw httpError(400, "Thông tin ngân hàng chưa hợp lệ.");
  }
  return { bankName, accountNumber, accountHolder };
};

const ensureCouponAvailable = async ({ db, affiliateId, couponCode }) => {
  const [couponLock, couponMatches, legacyMatches] = await Promise.all([
    db.collection(AFFILIATE_COLLECTIONS.couponCodes).doc(couponCode).get(),
    db.collection("coupons").where("code", "==", couponCode).limit(3).get(),
    db.collection(AFFILIATE_COLLECTIONS.affiliates).where("couponCode", "==", couponCode).limit(2).get(),
  ]);
  if (couponLock.exists && couponLock.data()?.affiliateId !== affiliateId) {
    throw httpError(409, `Mã giảm giá "${couponCode}" đã được sử dụng.`);
  }
  const conflictingCoupon = couponMatches.docs.find((item) => {
    const data = item.data() || {};
    return data.affiliateId !== affiliateId;
  });
  if (conflictingCoupon || legacyMatches.docs.some((item) => item.id !== affiliateId)) {
    throw httpError(409, `Mã giảm giá "${couponCode}" đã được sử dụng.`);
  }
};

const registerAffiliate = async ({ db, fieldValue, user, payload }) => {
  const affiliateCode = normalizeAffiliateCode(payload.affiliateCode);
  if (!affiliateCode) throw httpError(400, "Mã giới thiệu phải từ 3 đến 20 ký tự.");
  const couponCode = normalizeCouponCode(`${affiliateCode}10`);
  const bankInfo = validateBankInfo(payload.bankInfo);
  const affiliateRef = db.collection(AFFILIATE_COLLECTIONS.affiliates).doc(user.uid);
  const codeRef = db.collection(AFFILIATE_COLLECTIONS.codes).doc(affiliateCode);
  const couponCodeRef = db.collection(AFFILIATE_COLLECTIONS.couponCodes).doc(couponCode);
  const couponRef = db.collection("coupons").doc(affiliateCouponDocumentId(user.uid));

  const [existingByCode, settings, affiliateSnapshot] = await Promise.all([
    findAffiliateByField(db, "affiliateCode", affiliateCode),
    getSettings(db),
    affiliateRef.get(),
    ensureCouponAvailable({ db, affiliateId: user.uid, couponCode }),
  ]);
  if (affiliateSnapshot.exists) throw httpError(409, "Bạn đã có tài khoản cộng tác viên.");
  if (existingByCode && String(existingByCode.userId || existingByCode.id) !== user.uid) {
    throw httpError(409, `Mã tiếp thị "${affiliateCode}" đã có người sử dụng.`);
  }

  const affiliate = {
    affiliateCode,
    bankInfo,
    couponCode,
    couponDiscountPercent: 10,
    createdAt: fieldValue.serverTimestamp(),
    customCommissionPercent: null,
    email: String(user.email || "").trim().toLowerCase(),
    name: String(user.name || user.email?.split("@")[0] || "Cộng tác viên").slice(0, 120),
    phone: String(payload.phone || "").trim().slice(0, 30),
    stats: {
      balance: 0,
      paidAmount: 0,
      totalClicks: 0,
      totalCommission: 0,
      totalOrders: 0,
      totalRevenue: 0,
    },
    status: settings.autoApproveAffiliate ? "active" : "pending",
    updatedAt: fieldValue.serverTimestamp(),
    userId: user.uid,
  };

  await db.runTransaction(async (transaction) => {
    const [affiliateNow, codeNow, couponCodeNow] = await Promise.all([
      transaction.get(affiliateRef),
      transaction.get(codeRef),
      transaction.get(couponCodeRef),
    ]);
    if (affiliateNow.exists) throw httpError(409, "Bạn đã có tài khoản cộng tác viên.");
    if (codeNow.exists && codeNow.data()?.affiliateId !== user.uid) {
      throw httpError(409, `Mã tiếp thị "${affiliateCode}" đã có người sử dụng.`);
    }
    if (couponCodeNow.exists && couponCodeNow.data()?.affiliateId !== user.uid) {
      throw httpError(409, `Mã giảm giá "${couponCode}" đã được sử dụng.`);
    }
    transaction.create(affiliateRef, affiliate);
    transaction.set(codeRef, { affiliateId: user.uid, createdAt: fieldValue.serverTimestamp() });
    transaction.set(couponCodeRef, { affiliateId: user.uid, createdAt: fieldValue.serverTimestamp() });
    transaction.set(couponRef, buildAffiliateCoupon({ affiliate, affiliateId: user.uid, fieldValue }));
  });
  const created = await affiliateRef.get();
  return snapshotData(created);
};

const updateAffiliateCoupon = async ({ db, fieldValue, affiliateId, payload }) => {
  const affiliateRef = db.collection(AFFILIATE_COLLECTIONS.affiliates).doc(affiliateId);
  const affiliateSnapshot = await affiliateRef.get();
  if (!affiliateSnapshot.exists) throw httpError(404, "Không tìm thấy cộng tác viên.");
  const couponCode = normalizeCouponCode(payload.couponCode);
  if (!couponCode) throw httpError(400, "Mã giảm giá không hợp lệ.");
  await ensureCouponAvailable({ db, affiliateId, couponCode });

  const nextCouponLock = db.collection(AFFILIATE_COLLECTIONS.couponCodes).doc(couponCode);
  const couponRef = db.collection("coupons").doc(affiliateCouponDocumentId(affiliateId));

  await db.runTransaction(async (transaction) => {
    const current = await transaction.get(affiliateRef);
    if (!current.exists) throw httpError(404, "Không tìm thấy cộng tác viên.");
    const existing = current.data();
    const previousCouponCode = normalizeCouponCode(existing.couponCode);
    const previousCouponLock = previousCouponCode
      ? db.collection(AFFILIATE_COLLECTIONS.couponCodes).doc(previousCouponCode)
      : null;
    const next = {
      ...existing,
      couponCode,
      couponDiscountPercent: normalizePercent(payload.couponDiscountPercent, 10),
      customCommissionPercent: payload.customCommissionPercent == null || payload.customCommissionPercent === ""
        ? null : normalizePercent(payload.customCommissionPercent),
      status: ["active", "pending", "paused", "suspended"].includes(payload.status) ? payload.status : existing.status,
    };
    const lockSnapshots = await Promise.all([
      transaction.get(nextCouponLock),
      ...(previousCouponLock && previousCouponCode !== couponCode
        ? [transaction.get(previousCouponLock)]
        : []),
    ]);
    if (lockSnapshots[0].exists && lockSnapshots[0].data()?.affiliateId !== affiliateId) {
      throw httpError(409, `Mã giảm giá "${couponCode}" đã được sử dụng.`);
    }
    transaction.update(affiliateRef, {
      couponCode: next.couponCode,
      couponDiscountPercent: next.couponDiscountPercent,
      customCommissionPercent: next.customCommissionPercent,
      status: next.status,
      updatedAt: fieldValue.serverTimestamp(),
    });
    transaction.set(nextCouponLock, { affiliateId, updatedAt: fieldValue.serverTimestamp() });
    if (
      previousCouponLock
      && previousCouponCode !== couponCode
      && lockSnapshots[1]?.data()?.affiliateId === affiliateId
    ) {
      transaction.delete(previousCouponLock);
    }
    transaction.set(couponRef, buildAffiliateCoupon({ affiliate: next, affiliateId, fieldValue }), { merge: true });
  });
};

const recordClick = async ({ clientFingerprint, code, db, fieldValue }) => {
  const affiliate = await findAffiliateByCode(db, code);
  if (!affiliate || affiliate.status !== "active") return { recorded: false };
  const affiliateId = String(affiliate.userId || affiliate.id);
  const day = new Date().toISOString().slice(0, 10);
  const eventId = createHash("sha256")
    .update(`${affiliateId}|${clientFingerprint}|${day}`)
    .digest("hex");
  const eventRef = db.collection(AFFILIATE_COLLECTIONS.clickEvents).doc(eventId);
  const affiliateRef = db.collection(AFFILIATE_COLLECTIONS.affiliates).doc(affiliateId);
  return db.runTransaction(async (transaction) => {
    const [eventSnapshot, affiliateSnapshot] = await Promise.all([
      transaction.get(eventRef),
      transaction.get(affiliateRef),
    ]);
    if (eventSnapshot.exists) return { recorded: false, duplicate: true };
    if (!affiliateSnapshot.exists || affiliateSnapshot.data()?.status !== "active") {
      return { recorded: false };
    }
    transaction.create(eventRef, {
      affiliateId,
      createdAt: fieldValue.serverTimestamp(),
      day,
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    });
    transaction.update(affiliateRef, {
      "stats.totalClicks": fieldValue.increment(1),
      updatedAt: fieldValue.serverTimestamp(),
    });
    return { recorded: true };
  });
};

const updateBank = async ({ db, fieldValue, payload, user }) => {
  const bankInfo = validateBankInfo(payload.bankInfo);
  const affiliateRef = db.collection(AFFILIATE_COLLECTIONS.affiliates).doc(user.uid);
  const snapshot = await affiliateRef.get();
  if (!snapshot.exists) throw httpError(404, "Không tìm thấy tài khoản cộng tác viên.");
  await affiliateRef.update({ bankInfo, updatedAt: fieldValue.serverTimestamp() });
  return bankInfo;
};

const requestPayout = async ({ db, fieldValue, payload, user }) => {
  const amount = asFiniteNumber(payload.amount, 0);
  if (!Number.isSafeInteger(amount) || amount <= 0) throw httpError(400, "Số tiền rút không hợp lệ.");
  const settings = await getSettings(db);
  if (amount < settings.minPayoutAmount) {
    throw httpError(400, `Số tiền rút tối thiểu là ${settings.minPayoutAmount.toLocaleString("vi-VN")} VNĐ.`);
  }
  const affiliateRef = db.collection(AFFILIATE_COLLECTIONS.affiliates).doc(user.uid);
  const payoutRef = db.collection(AFFILIATE_COLLECTIONS.payouts).doc();
  await db.runTransaction(async (transaction) => {
    const affiliateSnapshot = await transaction.get(affiliateRef);
    if (!affiliateSnapshot.exists) throw httpError(404, "Không tìm thấy tài khoản cộng tác viên.");
    const affiliate = affiliateSnapshot.data() || {};
    const balance = Math.round(asFiniteNumber(affiliate.stats?.balance, 0));
    if (amount > balance) throw httpError(400, "Số dư khả dụng không đủ.");
    const bankInfo = validateBankInfo(affiliate.bankInfo);
    transaction.create(payoutRef, {
      affiliateCode: affiliate.affiliateCode,
      affiliateEmail: affiliate.email,
      affiliateId: user.uid,
      affiliateName: affiliate.name,
      amount,
      bankInfo,
      createdAt: fieldValue.serverTimestamp(),
      note: String(payload.note || "").trim().slice(0, 500),
      status: "pending",
      updatedAt: fieldValue.serverTimestamp(),
    });
    transaction.update(affiliateRef, {
      "stats.balance": fieldValue.increment(-amount),
      updatedAt: fieldValue.serverTimestamp(),
    });
  });
  return { id: payoutRef.id };
};

const processPayout = async ({ adminUser, db, fieldValue, payload }) => {
  const payoutId = String(payload.payoutId || "").trim();
  const status = String(payload.status || "").trim();
  if (!/^[A-Za-z0-9]{20}$/.test(payoutId) || !["completed", "rejected"].includes(status)) {
    throw httpError(400, "Yêu cầu thanh toán không hợp lệ.");
  }
  const payoutRef = db.collection(AFFILIATE_COLLECTIONS.payouts).doc(payoutId);
  await db.runTransaction(async (transaction) => {
    const payoutSnapshot = await transaction.get(payoutRef);
    if (!payoutSnapshot.exists) throw httpError(404, "Không tìm thấy yêu cầu rút tiền.");
    const payout = payoutSnapshot.data() || {};
    if (payout.status !== "pending") throw httpError(409, "Yêu cầu này đã được xử lý.");
    const affiliateRef = db.collection(AFFILIATE_COLLECTIONS.affiliates).doc(payout.affiliateId);
    const affiliateSnapshot = await transaction.get(affiliateRef);
    if (!affiliateSnapshot.exists) throw httpError(404, "Không tìm thấy cộng tác viên.");
    if (status === "completed") {
      transaction.update(affiliateRef, {
        "stats.paidAmount": fieldValue.increment(payout.amount),
        updatedAt: fieldValue.serverTimestamp(),
      });
    } else {
      transaction.update(affiliateRef, {
        "stats.balance": fieldValue.increment(payout.amount),
        updatedAt: fieldValue.serverTimestamp(),
      });
    }
    transaction.update(payoutRef, {
      adminId: adminUser.uid,
      adminNote: String(payload.adminNote || "").trim().slice(0, 500),
      processedAt: fieldValue.serverTimestamp(),
      status,
      transactionRef: String(payload.transactionRef || "").trim().slice(0, 160),
      updatedAt: fieldValue.serverTimestamp(),
    });
  });
};

const listForAffiliate = async ({ collectionName, db, userId, limit = 50 }) => {
  const snapshot = await db
    .collection(collectionName)
    .where("affiliateId", "==", userId)
    .orderBy("createdAt", "desc")
    .limit(Math.min(MAX_PAGE_SIZE, limit))
    .get();
  return snapshot.docs.map(snapshotData);
};

const listAll = async ({ collectionName, db, cursor }) => {
  let query = db
    .collection(collectionName)
    .orderBy("createdAt", "desc")
    .limit(MAX_PAGE_SIZE + 1);
  if (cursor) {
    if (!/^[A-Za-z0-9_-]{1,256}$/.test(cursor)) throw httpError(400, "Mốc phân trang không hợp lệ.");
    const previous = await db.collection(collectionName).doc(cursor).get();
    if (!previous.exists) throw httpError(409, "Danh sách đã thay đổi. Vui lòng tải lại.");
    query = query.startAfter(previous);
  }
  const snapshot = await query.get();
  const page = snapshot.docs.slice(0, MAX_PAGE_SIZE);
  return {
    items: page.map(snapshotData),
    nextCursor: snapshot.size > MAX_PAGE_SIZE ? page.at(-1).id : null,
  };
};

export const createAffiliateHandlers = ({
  createJsonResponse,
  fieldValue,
  getClientFingerprint,
  getDb,
  requireAdmin,
  verifyUser,
}) => ({
  publicGet: async ({ request }) => {
    const db = getDb();
    const view = new URL(request.url).searchParams.get("view") || "settings";
    if (view === "settings") return createJsonResponse(await getSettings(db));
    const user = await verifyUser(request);
    const affiliateSnapshot = await db
      .collection(AFFILIATE_COLLECTIONS.affiliates)
      .doc(user.uid)
      .get();
    if (view === "profile") {
      return createJsonResponse(affiliateSnapshot.exists ? snapshotData(affiliateSnapshot) : null);
    }
    if (view === "commissions") {
      return createJsonResponse(await listForAffiliate({
        collectionName: AFFILIATE_COLLECTIONS.commissions,
        db,
        userId: user.uid,
      }));
    }
    if (view === "payouts") {
      return createJsonResponse(await listForAffiliate({
        collectionName: AFFILIATE_COLLECTIONS.payouts,
        db,
        limit: 30,
        userId: user.uid,
      }));
    }
    throw httpError(400, "Affiliate view không hợp lệ.");
  },

  publicPost: async ({ request }) => {
    const db = getDb();
    const payload = await request.json();
    const action = String(payload.action || "");
    if (action === "click") {
      const code = normalizeAffiliateCode(payload.affiliateCode);
      if (!code) throw httpError(400, "Mã giới thiệu không hợp lệ.");
      return createJsonResponse(await recordClick({
        clientFingerprint: getClientFingerprint(request),
        code,
        db,
        fieldValue,
      }));
    }
    const user = await verifyUser(request);
    if (action === "register") {
      return createJsonResponse(await registerAffiliate({ db, fieldValue, payload, user }), 201);
    }
    if (action === "update-bank") {
      return createJsonResponse({
        bankInfo: await updateBank({ db, fieldValue, payload, user }),
        success: true,
      });
    }
    if (action === "request-payout") {
      return createJsonResponse({
        ...(await requestPayout({ db, fieldValue, payload, user })),
        success: true,
      }, 201);
    }
    throw httpError(400, "Affiliate action không hợp lệ.");
  },

  validateCoupon: async ({ request }) => {
    const payload = await request.json();
    const coupon = await resolveCoupon(getDb(), payload.couponCode);
    if (!coupon) throw httpError(404, "Mã giảm giá không hợp lệ hoặc đã hết hạn.");
    return createJsonResponse({
      code: coupon.code,
      discountPercent: coupon.discountPercent,
      valid: true,
    });
  },

  adminGet: async ({ request }) => {
    await requireAdmin(request);
    const db = getDb();
    const params = new URL(request.url).searchParams;
    const view = params.get("view") || "all";
    const cursor = params.get("cursor");
    if (view === "settings") return createJsonResponse(await getSettings(db));
    if (["affiliates", "payouts", "commissions"].includes(view)) {
      const page = await listAll({ collectionName: AFFILIATE_COLLECTIONS[view], db, cursor });
      // Keep the previous array response for cached clients during rollout.
      return createJsonResponse(params.get("paginated") === "1" ? page : page.items);
    }
    throw httpError(400, "Admin Affiliate view không hợp lệ.");
  },

  adminPost: async ({ request }) => {
    const adminUser = await requireAdmin(request);
    const db = getDb();
    const payload = await request.json();
    const action = String(payload.action || "");
    if (action === "save-settings") {
      const settings = normalizeAffiliateSettings(payload.settings);
      await db.collection(AFFILIATE_COLLECTIONS.settings).doc(SETTINGS_DOC_ID).set({
        ...settings,
        updatedAt: fieldValue.serverTimestamp(),
      }, { merge: true });
      return createJsonResponse(settings);
    }
    if (action === "update-affiliate") {
      const affiliateId = String(payload.affiliateId || "").trim();
      if (!/^[A-Za-z0-9_-]{1,128}$/.test(affiliateId)) throw httpError(400, "CTV không hợp lệ.");
      await updateAffiliateCoupon({ db, fieldValue, affiliateId, payload: payload.updateData || {} });
      return createJsonResponse({ success: true });
    }
    if (action === "process-payout") {
      await processPayout({ adminUser, db, fieldValue, payload });
      return createJsonResponse({ success: true });
    }
    if (action === "process-order") {
      const orderId = String(payload.orderId || "").trim();
      if (!/^[A-Za-z0-9]{20}$/.test(orderId)) throw httpError(400, "Đơn hàng không hợp lệ.");
      const orderSnapshot = await db.collection("orders").doc(orderId).get();
      if (!orderSnapshot.exists) throw httpError(404, "Không tìm thấy đơn hàng.");
      const result = await processAffiliateCommission({
        db,
        fieldValue,
        orderData: orderSnapshot.data(),
        orderId,
      });
      return createJsonResponse({ result, success: true });
    }
    throw httpError(400, "Admin Affiliate action không hợp lệ.");
  },
});

export const affiliateTestables = {
  normalizePercent,
  serialize,
};
