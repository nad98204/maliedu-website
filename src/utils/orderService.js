import {
    collection,
    doc,
    getDoc,
    getDocs,
    increment,
    orderBy,
    query,
    serverTimestamp,
    Timestamp,
    updateDoc,
    where,
    writeBatch
} from "firebase/firestore";
import { auth, db } from "../firebase";
import {
    COURSE_ACCESS_COLLECTION,
    getCourseAccessId,
} from "./courseDataPrivacy";
import {
    ACCESS_PLAN_TYPES,
    calculateAccessExpiryDate,
    toDateValue,
} from "./coursePricing";
import { processAffiliateCommission } from "./affiliateService";

const COLLECTION_NAME = "orders";
const ORDER_API_PATH = "/api/orders";
const ORDER_ACCESS_TOKEN_PREFIX = "mali_order_access:";

const getOrderAccessToken = (orderId) => {
    try {
        return sessionStorage.getItem(`${ORDER_ACCESS_TOKEN_PREFIX}${orderId}`) || "";
    } catch {
        return "";
    }
};

const getAuthHeader = async () => {
    const currentUser = auth.currentUser;
    return currentUser
        ? { authorization: `Bearer ${await currentUser.getIdToken()}` }
        : {};
};

export const createOrder = async (orderData) => {
    try {
        const response = await fetch(ORDER_API_PATH, {
            method: "POST",
            credentials: "same-origin",
            headers: {
                "content-type": "application/json",
                ...await getAuthHeader(),
            },
            body: JSON.stringify(orderData),
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.id || !result.orderCode) {
            throw new Error(result.error || `Order API error (${response.status})`);
        }

        if (result.accessToken) {
            sessionStorage.setItem(
                `${ORDER_ACCESS_TOKEN_PREFIX}${result.id}`,
                result.accessToken,
            );
        }
        return { id: result.id, orderCode: result.orderCode };
    } catch (error) {
        console.error("Error creating order:", error);
        throw error;
    }
};

export const getOrderById = async (orderId) => {
    try {
        const response = await fetch(`${ORDER_API_PATH}/${encodeURIComponent(orderId)}`, {
            credentials: "same-origin",
            headers: {
                ...await getAuthHeader(),
                "x-order-access-token": getOrderAccessToken(orderId),
            },
        });
        if (response.status === 404) {
            return null;
        }

        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(result.error || `Order API error (${response.status})`);
        }
        return result;
    } catch (error) {
        console.error("Error fetching order:", error);
        throw error;
    }
};

export const trackOrderPurchase = async (orderId, browserData = {}) => {
    const response = await fetch(
        `${ORDER_API_PATH}/${encodeURIComponent(orderId)}/meta-purchase`,
        {
            method: "POST",
            credentials: "same-origin",
            headers: {
                "content-type": "application/json",
                ...await getAuthHeader(),
                "x-order-access-token": getOrderAccessToken(orderId),
            },
            body: JSON.stringify({
                fbc: browserData.fbc || "",
                fbp: browserData.fbp || "",
                sourceUrl: browserData.sourceUrl || "",
            }),
        },
    );
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(result.error || `Purchase tracking error (${response.status})`);
    }
    return result;
};

export const getAllOrders = async () => {
    try {
        const q = query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error fetching all orders:", error);
        throw error;
    }
};

/**
 * approveOrder — tối ưu tốc độ:
 * 1. Nhận order object trực tiếp (không gọi getOrderById nếu đã có)
 * 2. Dùng Promise.all để check enrollment song song
 * 3. Dùng writeBatch để write tất cả enrollment trong 1 lần commit
 */
export const approveOrder = async (orderId, orderData = null) => {
    try {
        // Nếu caller chưa truyền orderData → mới đọc Firestore (1 lần duy nhất)
        const order = orderData || await getOrderById(orderId);
        if (!order) throw new Error("Order not found");
        if (order.status === 'completed') {
            await processAffiliateCommission(orderId);
            return { success: true, enrolledCount: 0 };
        }

        const itemsToProcess = order.items || [{
            id: order.courseId,
            name: order.courseName,
            productType: order.productType
        }];

        const courseItems = [];
        const hypnosisItems = [];

        itemsToProcess.forEach(item => {
            if (item.productType === 'hypnosis' || order.productType === 'hypnosis') {
                hypnosisItems.push(item);
            } else {
                courseItems.push(item);
            }
        });

        const enrollmentsRef = collection(db, "enrollments");

        // ── Bước 1: Check tất cả enrollment SONG SONG (Promise.all) cho khóa học ──────────
        const checkResults = await Promise.all(
            courseItems.map(async item => {
                const cId = item.id || item.courseId;
                const q = query(
                    enrollmentsRef,
                    where("userId", "==", order.userId),
                    where("courseId", "==", cId)
                );
                const accessRef = order.userId
                    ? doc(db, COURSE_ACCESS_COLLECTION, getCourseAccessId(order.userId, cId))
                    : null;
                const [snap, accessSnapshot] = await Promise.all([
                    getDocs(q),
                    accessRef ? getDoc(accessRef) : Promise.resolve(null),
                ]);
                return {
                    item,
                    cId,
                    cName: item.name || item.courseName,
                    alreadyEnrolled: !snap.empty,
                    enrollmentId: snap.docs[0]?.id || null,
                    accessRef,
                    existingAccess: accessSnapshot?.exists() ? accessSnapshot.data() : null,
                };
            })
        );

        // ── Bước 2: Batch write tất cả trong 1 lần ───────────────────────────
        const batch = writeBatch(db);
        const now = serverTimestamp();
        const nowDate = new Date();

        // Cập nhật trạng thái đơn hàng
        const orderRef = doc(db, COLLECTION_NAME, orderId);
        batch.update(orderRef, {
            status: 'completed',
            updatedAt: now,
            approvedAt: now
        });

        // Tạo enrollment cho những khóa chưa được enroll
        let enrolledCount = 0;
        checkResults.forEach(({ item, cId, cName, alreadyEnrolled, enrollmentId, accessRef, existingAccess }) => {
            let activeEnrollmentId = enrollmentId;
            const accessPlan = {
                id: item.accessPlanId || "legacy-lifetime",
                name: item.accessPlanName || "Truy cập vĩnh viễn",
                accessType: item.accessType === ACCESS_PLAN_TYPES.DURATION
                    ? ACCESS_PLAN_TYPES.DURATION
                    : ACCESS_PLAN_TYPES.LIFETIME,
                durationValue: item.durationValue,
                durationUnit: item.durationUnit,
            };
            const currentExpiry = toDateValue(existingAccess?.expiresAt);
            const extensionStart = currentExpiry && currentExpiry > nowDate ? currentExpiry : nowDate;
            const expiryDate = calculateAccessExpiryDate(accessPlan, extensionStart);
            const accessMetadata = {
                accessPlanId: accessPlan.id,
                accessPlanName: accessPlan.name,
                accessType: accessPlan.accessType,
                durationValue: accessPlan.accessType === ACCESS_PLAN_TYPES.DURATION
                    ? Number(accessPlan.durationValue)
                    : null,
                durationUnit: accessPlan.accessType === ACCESS_PLAN_TYPES.DURATION
                    ? accessPlan.durationUnit
                    : null,
                expiresAt: expiryDate ? Timestamp.fromDate(expiryDate) : null,
            };
            if (!alreadyEnrolled) {
                const newEnrollRef = doc(enrollmentsRef); // auto ID
                activeEnrollmentId = newEnrollRef.id;
                batch.set(newEnrollRef, {
                    userId: order.userId,
                    userEmail: order.userEmail,
                    courseId: cId,
                    courseName: cName,
                    enrolledAt: now,
                    orderId: orderId,
                    status: 'active',
                    ...accessMetadata,
                });
                batch.update(doc(db, "courses", cId), {
                    enrollmentCount: increment(1),
                });
                enrolledCount++;
            } else if (activeEnrollmentId) {
                batch.set(doc(db, "enrollments", activeEnrollmentId), {
                    orderId,
                    status: "active",
                    renewedAt: now,
                    ...accessMetadata,
                }, { merge: true });
            }

            if (accessRef) {
                batch.set(
                    accessRef,
                    {
                        userId: order.userId,
                        userEmail: order.userEmail || "",
                        courseId: cId,
                        enrollmentId: activeEnrollmentId,
                        orderId,
                        status: "active",
                        grantedAt: now,
                        renewedAt: existingAccess ? now : null,
                        ...accessMetadata,
                    },
                    { merge: true },
                );
            }
        });

        // Cấp quyền nghe bản thôi miên vào user_audios
        if (order.userId && hypnosisItems.length > 0) {
            hypnosisItems.forEach(item => {
                const trackId = item.id || item.courseId || order.trackId;
                if (!trackId) return;
                const userAudioRef = doc(db, "user_audios", `${order.userId}_${trackId}`);
                batch.set(userAudioRef, {
                    userId: order.userId,
                    userEmail: order.userEmail || "",
                    trackId: trackId,
                    trackTitle: item.name || item.courseName || order.trackTitle || order.courseName || "Bản thôi miên",
                    price: item.price || order.amount || 0,
                    isFree: false,
                    orderId: orderId,
                    status: "active",
                    createdAt: now,
                }, { merge: true });
                enrolledCount++;
            });
        }

        // 1 commit duy nhất — toàn bộ thay đổi ghi song song
        await batch.commit();

        // Gọi máy chủ để ghi nhận ngay; trigger Firestore vẫn là lớp dự phòng tự động.
        await processAffiliateCommission(orderId);

        return { success: true, enrolledCount };
    } catch (error) {
        console.error("Error approving order:", error);
        throw error;
    }
};

export const cancelOrder = async (orderId, reason = 'Khách hàng hủy') => {
    try {
        const orderRef = doc(db, COLLECTION_NAME, orderId);
        const snap = await getDoc(orderRef);
        if (!snap.exists()) throw new Error('Không tìm thấy đơn hàng');

        const order = snap.data();
        if (order.status !== 'pending') {
            throw new Error('Chỉ có thể hủy đơn hàng đang chờ thanh toán');
        }

        await updateDoc(orderRef, {
            status: 'cancelled',
            cancelReason: reason,
            cancelledAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        return true;
    } catch (error) {
        console.error('Error cancelling order:', error);
        throw error;
    }
};

export const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};
