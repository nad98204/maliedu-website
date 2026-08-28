import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { Buffer } from "node:buffer";

import { FieldValue } from "firebase-admin/firestore";

const SEPAY_SIGNATURE_TOLERANCE_SECONDS = 5 * 60;
const ORDER_CODE_PATTERN = /\bMALI[\s-]*([A-Z0-9]{8,32})\b/i;

const getHeader = (headers, name) => {
  if (!headers) return "";
  if (typeof headers.get === "function") return String(headers.get(name) || "");
  const value = headers[name.toLowerCase()] ?? headers[name];
  return Array.isArray(value) ? String(value[0] || "") : String(value || "");
};

const normalizeAccountNumber = (value) => String(value || "").replace(/\D/g, "");

const normalizeGateway = (value) => String(value || "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-z0-9]/gi, "")
  .toLowerCase();

const safeEqualText = (left, right) => {
  const leftBuffer = Buffer.from(String(left || ""), "utf8");
  const rightBuffer = Buffer.from(String(right || ""), "utf8");
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
};

export const verifySePaySignature = ({ headers, rawBody, secret, now = Date.now() }) => {
  const signature = getHeader(headers, "x-sepay-signature").trim().toLowerCase();
  const timestampText = getHeader(headers, "x-sepay-timestamp").trim();
  const timestamp = Number(timestampText);
  if (!/^sha256=[a-f0-9]{64}$/.test(signature) || !/^\d{10,13}$/.test(timestampText)) {
    return false;
  }

  const timestampMs = timestampText.length === 13 ? timestamp : timestamp * 1000;
  if (!Number.isFinite(timestampMs) || Math.abs(now - timestampMs) > SEPAY_SIGNATURE_TOLERANCE_SECONDS * 1000) {
    return false;
  }

  const expected = `sha256=${createHmac("sha256", secret)
    .update(`${timestampText}.${rawBody}`, "utf8")
    .digest("hex")}`;
  return safeEqualText(signature, expected);
};

export const extractOrderCode = (payload = {}) => {
  const haystack = [payload.code, payload.content, payload.description]
    .map((value) => String(value || "").toUpperCase())
    .join(" ");
  const match = ORDER_CODE_PATTERN.exec(haystack);
  return match ? `MALI-${match[1]}` : "";
};

const calculateExpiryDate = (item, fromDate) => {
  if (item?.accessType !== "duration") return null;
  const result = new Date(fromDate);
  const value = Math.max(1, Math.round(Number(item.durationValue) || 1));
  if (item.durationUnit === "days") {
    result.setUTCDate(result.getUTCDate() + value);
  } else if (item.durationUnit === "years") {
    const originalMonth = result.getUTCMonth();
    const originalDay = result.getUTCDate();
    result.setUTCDate(1);
    result.setUTCFullYear(result.getUTCFullYear() + value);
    const lastDay = new Date(Date.UTC(result.getUTCFullYear(), originalMonth + 1, 0)).getUTCDate();
    result.setUTCMonth(originalMonth, Math.min(originalDay, lastDay));
  } else {
    const originalDay = result.getUTCDate();
    result.setUTCDate(1);
    result.setUTCMonth(result.getUTCMonth() + value);
    const lastDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
    result.setUTCDate(Math.min(originalDay, lastDay));
  }
  return result;
};

const toDate = (value) => {
  if (!value) return null;
  const date = value?.toDate?.() || (value?.seconds ? new Date(value.seconds * 1000) : new Date(value));
  return date instanceof Date && Number.isFinite(date.getTime()) ? date : null;
};

const hasLifetimeAccess = (access, enrollment) => {
  const isLifetime = (candidate) => {
    if (!candidate || candidate.status !== "active") return false;
    if (candidate.accessType === "lifetime") return true;
    return !candidate.accessType && !candidate.expiresAt;
  };
  return isLifetime(access) || isLifetime(enrollment);
};

const buildAccessMetadata = ({ item, existingAccess, existingEnrollment, now }) => {
  if (hasLifetimeAccess(existingAccess, existingEnrollment) || item?.accessType !== "duration") {
    return {
      accessPlanId: hasLifetimeAccess(existingAccess, existingEnrollment)
        ? existingAccess?.accessPlanId || existingEnrollment?.accessPlanId || "legacy-lifetime"
        : item?.accessPlanId || "legacy-lifetime",
      accessPlanName: hasLifetimeAccess(existingAccess, existingEnrollment)
        ? existingAccess?.accessPlanName || existingEnrollment?.accessPlanName || "Truy cập vĩnh viễn"
        : item?.accessPlanName || "Truy cập vĩnh viễn",
      accessType: "lifetime",
      durationValue: null,
      durationUnit: null,
      expiresAt: null,
    };
  }

  const currentExpiry = toDate(existingAccess?.expiresAt || existingEnrollment?.expiresAt);
  const extensionStart = currentExpiry && currentExpiry > now ? currentExpiry : now;
  return {
    accessPlanId: item.accessPlanId || "duration",
    accessPlanName: item.accessPlanName || "Gói thời hạn",
    accessType: "duration",
    durationValue: Math.max(1, Math.round(Number(item.durationValue) || 1)),
    durationUnit: ["days", "months", "years"].includes(item.durationUnit)
      ? item.durationUnit
      : "months",
    expiresAt: calculateExpiryDate(item, extensionStart),
  };
};

const sanitizeWebhookPayload = (payload) => ({
  accountNumber: String(payload.accountNumber || "").slice(0, 40),
  accumulated: Number(payload.accumulated) || null,
  code: String(payload.code || "").slice(0, 160),
  content: String(payload.content || "").slice(0, 500),
  description: String(payload.description || "").slice(0, 500),
  gateway: String(payload.gateway || "").slice(0, 80),
  id: String(payload.id || "").slice(0, 160),
  referenceCode: String(payload.referenceCode || "").slice(0, 160),
  transactionDate: String(payload.transactionDate || "").slice(0, 80),
  transferAmount: Number(payload.transferAmount) || 0,
  transferType: String(payload.transferType || "").slice(0, 20),
});

const getTransactionDocumentId = (payload) => {
  const key = [
    payload.id,
    payload.referenceCode,
    payload.accountNumber,
    payload.transferAmount,
    payload.transactionDate,
  ].map((value) => String(value || "")).join("|");
  return `sepay_${createHash("sha256").update(key).digest("hex").slice(0, 48)}`;
};

const resolveBuyer = async ({ auth, order }) => {
  if (order.userId) return { uid: String(order.userId), email: String(order.userEmail || "") };
  const email = String(order.userEmail || order.customerEmail || "").trim().toLowerCase();
  if (!email) return null;
  try {
    const user = await auth.getUserByEmail(email);
    return { uid: user.uid, email: user.email || email };
  } catch (error) {
    if (error?.code === "auth/user-not-found") return null;
    throw error;
  }
};

export const createSePayWebhookHandler = ({
  createJsonResponse,
  getAuth,
  getDb,
  getSecret,
}) => async ({ request }) => {
  const secret = String(getSecret() || "").trim();
  if (!secret || secret === "__DISABLED__") {
    return createJsonResponse({ success: false, error: "Webhook is not configured" }, 503);
  }

  const rawBody = await request.text();
  if (!verifySePaySignature({ headers: request.headers, rawBody, secret })) {
    return createJsonResponse({ success: false, error: "Invalid webhook signature" }, 401);
  }

  let payload;
  try {
    payload = JSON.parse(rawBody || "{}");
  } catch {
    return createJsonResponse({ success: false, error: "Invalid JSON payload" }, 400);
  }

  const db = getDb();
  const settingsSnapshot = await db.collection("system_settings").doc("bank_payment_settings").get();
  const settings = settingsSnapshot.exists ? settingsSnapshot.data() || {} : {};
  if (
    settings.isEnabled === false ||
    settings.autoApproveEnabled !== true ||
    settings.autoVerifyMethod !== "sepay"
  ) {
    return createJsonResponse({ success: true, ignored: true, reason: "automatic-payment-disabled" });
  }

  const transactionRef = db.collection("bank_transactions").doc(getTransactionDocumentId(payload));
  const auditPayload = sanitizeWebhookPayload(payload);
  const recordWithoutOrder = async (status, reason) => {
    await transactionRef.set({
      ...auditPayload,
      provider: "sepay",
      reason,
      receivedAt: FieldValue.serverTimestamp(),
      status,
    }, { merge: true });
    return createJsonResponse({ success: true, matched: false, reason });
  };

  if (String(payload.transferType || "").toLowerCase() !== "in") {
    return recordWithoutOrder("ignored", "not-incoming");
  }
  const configuredAccount = normalizeAccountNumber(settings.accountNo);
  if (!configuredAccount || normalizeAccountNumber(payload.accountNumber) !== configuredAccount) {
    return recordWithoutOrder("rejected", "account-mismatch");
  }
  if (String(settings.bankId || "").toUpperCase() === "MB") {
    const gateway = normalizeGateway(payload.gateway);
    if (gateway && gateway !== "mb" && gateway !== "mbbank" && gateway !== "militarybank") {
      return recordWithoutOrder("rejected", "bank-mismatch");
    }
  }

  const amount = Number(payload.transferAmount);
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    return recordWithoutOrder("rejected", "invalid-amount");
  }
  const orderCode = extractOrderCode(payload);
  if (!orderCode) return recordWithoutOrder("unmatched", "order-code-not-found");

  const orderQuery = await db.collection("orders").where("orderCode", "==", orderCode).limit(2).get();
  if (orderQuery.size !== 1) return recordWithoutOrder("unmatched", "order-not-found");

  const orderRef = orderQuery.docs[0].ref;
  const initialOrder = orderQuery.docs[0].data() || {};
  if (Number(initialOrder.amount) !== amount) {
    await transactionRef.set({
      ...auditPayload,
      expectedAmount: Number(initialOrder.amount) || 0,
      orderCode,
      orderId: orderRef.id,
      provider: "sepay",
      reason: "amount-mismatch",
      receivedAt: FieldValue.serverTimestamp(),
      status: "rejected",
    }, { merge: true });
    return createJsonResponse({ success: true, matched: false, reason: "amount-mismatch" });
  }

  const buyer = await resolveBuyer({ auth: getAuth(), order: initialOrder });
  if (!buyer) {
    await db.runTransaction(async (transaction) => {
      const [transactionSnapshot, orderSnapshot] = await Promise.all([
        transaction.get(transactionRef),
        transaction.get(orderRef),
      ]);
      if (transactionSnapshot.exists && transactionSnapshot.data()?.status === "fulfilled") return;
      const order = orderSnapshot.data() || {};
      transaction.set(transactionRef, {
        ...auditPayload,
        orderCode,
        orderId: orderRef.id,
        provider: "sepay",
        reason: "buyer-account-not-found",
        receivedAt: FieldValue.serverTimestamp(),
        status: "needs_account",
      }, { merge: true });
      if (order.status === "pending") {
        transaction.update(orderRef, {
          bankReferenceCode: String(payload.referenceCode || "").slice(0, 160),
          bankTransactionId: String(payload.id || "").slice(0, 160),
          paidAt: FieldValue.serverTimestamp(),
          paymentProvider: "sepay",
          status: "payment_received",
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    });
    return createJsonResponse({ success: true, matched: true, fulfilled: false, reason: "buyer-account-not-found" });
  }

  const rawItems = Array.isArray(initialOrder.items) && initialOrder.items.length > 0
    ? initialOrder.items
    : [{ id: initialOrder.courseId, name: initialOrder.courseName }];
  const items = rawItems.filter((item) => /^[A-Za-z0-9_-]{1,128}$/.test(String(item?.id || item?.courseId || "")));
  if (items.length === 0) return recordWithoutOrder("rejected", "invalid-order-items");

  const enrollmentLookups = await Promise.all(items.map(async (item) => {
    const courseId = String(item.id || item.courseId);
    const snapshot = await db.collection("enrollments")
      .where("userId", "==", buyer.uid)
      .where("courseId", "==", courseId)
      .limit(1)
      .get();
    return {
      courseId,
      enrollmentRef: snapshot.empty
        ? db.collection("enrollments").doc(`${buyer.uid}_${courseId}`)
        : snapshot.docs[0].ref,
      item,
    };
  }));

  const result = await db.runTransaction(async (transaction) => {
    const accessRefs = enrollmentLookups.map(({ courseId }) =>
      db.collection("course_access").doc(`${buyer.uid}_${courseId}`));
    const readSnapshots = await Promise.all([
      transaction.get(transactionRef),
      transaction.get(orderRef),
      ...accessRefs.map((ref) => transaction.get(ref)),
      ...enrollmentLookups.map(({ enrollmentRef }) => transaction.get(enrollmentRef)),
    ]);
    const transactionSnapshot = readSnapshots[0];
    const orderSnapshot = readSnapshots[1];
    const accessSnapshots = readSnapshots.slice(2, 2 + accessRefs.length);
    const enrollmentSnapshots = readSnapshots.slice(2 + accessRefs.length);

    if (transactionSnapshot.exists && transactionSnapshot.data()?.status === "fulfilled") {
      return { duplicate: true, fulfilled: true };
    }
    const order = orderSnapshot.data() || {};
    if (order.status === "completed") {
      transaction.set(transactionRef, {
        ...auditPayload,
        orderCode,
        orderId: orderRef.id,
        provider: "sepay",
        reason: "order-already-completed",
        receivedAt: FieldValue.serverTimestamp(),
        status: "duplicate",
      }, { merge: true });
      return { duplicate: true, fulfilled: true };
    }
    if (!orderSnapshot.exists || !["pending", "payment_received"].includes(order.status)) {
      transaction.set(transactionRef, {
        ...auditPayload,
        orderCode,
        orderId: orderRef.id,
        provider: "sepay",
        reason: "order-not-payable",
        receivedAt: FieldValue.serverTimestamp(),
        status: "rejected",
      }, { merge: true });
      return { fulfilled: false, reason: "order-not-payable" };
    }
    if (Number(order.amount) !== amount) {
      transaction.set(transactionRef, {
        ...auditPayload,
        expectedAmount: Number(order.amount) || 0,
        orderCode,
        orderId: orderRef.id,
        provider: "sepay",
        reason: "amount-mismatch",
        receivedAt: FieldValue.serverTimestamp(),
        status: "rejected",
      }, { merge: true });
      return { fulfilled: false, reason: "amount-mismatch" };
    }

    const now = new Date();
    enrollmentLookups.forEach(({ courseId, enrollmentRef, item }, index) => {
      const accessSnapshot = accessSnapshots[index];
      const enrollmentSnapshot = enrollmentSnapshots[index];
      const metadata = buildAccessMetadata({
        existingAccess: accessSnapshot.exists ? accessSnapshot.data() : null,
        existingEnrollment: enrollmentSnapshot.exists ? enrollmentSnapshot.data() : null,
        item,
        now,
      });
      if (!enrollmentSnapshot.exists) {
        transaction.set(enrollmentRef, {
          courseId,
          courseName: String(item.name || item.courseName || "Khóa học").slice(0, 300),
          enrolledAt: FieldValue.serverTimestamp(),
          orderId: orderRef.id,
          status: "active",
          userEmail: buyer.email,
          userId: buyer.uid,
          ...metadata,
        });
        transaction.update(db.collection("courses").doc(courseId), {
          enrollmentCount: FieldValue.increment(1),
        });
      } else {
        transaction.set(enrollmentRef, {
          orderId: orderRef.id,
          renewedAt: FieldValue.serverTimestamp(),
          status: "active",
          userEmail: buyer.email,
          userId: buyer.uid,
          ...metadata,
        }, { merge: true });
      }
      transaction.set(accessRefs[index], {
        courseId,
        enrollmentId: enrollmentRef.id,
        grantedAt: accessSnapshot.exists
          ? accessSnapshot.data()?.grantedAt || FieldValue.serverTimestamp()
          : FieldValue.serverTimestamp(),
        orderId: orderRef.id,
        renewedAt: accessSnapshot.exists ? FieldValue.serverTimestamp() : null,
        status: "active",
        userEmail: buyer.email,
        userId: buyer.uid,
        ...metadata,
      }, { merge: true });
    });

    transaction.update(orderRef, {
      approvedAt: FieldValue.serverTimestamp(),
      bankReferenceCode: String(payload.referenceCode || "").slice(0, 160),
      bankTransactionId: String(payload.id || "").slice(0, 160),
      paidAt: FieldValue.serverTimestamp(),
      paymentProvider: "sepay",
      status: "completed",
      updatedAt: FieldValue.serverTimestamp(),
      userEmail: buyer.email,
      userId: buyer.uid,
    });
    transaction.set(transactionRef, {
      ...auditPayload,
      fulfilledAt: FieldValue.serverTimestamp(),
      orderCode,
      orderId: orderRef.id,
      provider: "sepay",
      receivedAt: FieldValue.serverTimestamp(),
      status: "fulfilled",
      userId: buyer.uid,
    }, { merge: true });
    return { fulfilled: true };
  });

  return createJsonResponse({ success: true, matched: true, ...result });
};
