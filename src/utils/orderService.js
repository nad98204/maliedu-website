import {
    collection,
    doc,
    getDoc,
    getDocs,
    increment,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
    where,
    writeBatch
} from "firebase/firestore";
import { auth, db } from "../firebase";
import {
    COURSE_ACCESS_COLLECTION,
    getCourseAccessId,
} from "./courseDataPrivacy";

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
        if (order.status === 'completed') return true;

        const itemsToEnroll = order.items || [{
            id: order.courseId,
            name: order.courseName
        }];

        const enrollmentsRef = collection(db, "enrollments");

        // ── Bước 1: Check tất cả enrollment SONG SONG (Promise.all) ──────────
        const checkResults = await Promise.all(
            itemsToEnroll.map(item => {
                const cId = item.id || item.courseId;
                const q = query(
                    enrollmentsRef,
                    where("userId", "==", order.userId),
                    where("courseId", "==", cId)
                );
                return getDocs(q).then(snap => ({
                    item,
                    cId,
                    cName: item.name || item.courseName,
                    alreadyEnrolled: !snap.empty,
                    enrollmentId: snap.docs[0]?.id || null,
                }));
            })
        );

        // ── Bước 2: Batch write tất cả trong 1 lần ───────────────────────────
        const batch = writeBatch(db);
        const now = serverTimestamp();

        // Cập nhật trạng thái đơn hàng
        const orderRef = doc(db, COLLECTION_NAME, orderId);
        batch.update(orderRef, {
            status: 'completed',
            updatedAt: now,
            approvedAt: now
        });

        // Tạo enrollment cho những khóa chưa được enroll
        let enrolledCount = 0;
        checkResults.forEach(({ cId, cName, alreadyEnrolled, enrollmentId }) => {
            let activeEnrollmentId = enrollmentId;
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
                    status: 'active'
                });
                batch.update(doc(db, "courses", cId), {
                    enrollmentCount: increment(1),
                });
                enrolledCount++;
            }

            if (order.userId) {
                batch.set(
                    doc(
                        db,
                        COURSE_ACCESS_COLLECTION,
                        getCourseAccessId(order.userId, cId),
                    ),
                    {
                        userId: order.userId,
                        userEmail: order.userEmail || "",
                        courseId: cId,
                        enrollmentId: activeEnrollmentId,
                        orderId,
                        status: "active",
                        grantedAt: now,
                    },
                );
            }
        });

        // 1 commit duy nhất — toàn bộ thay đổi ghi song song
        await batch.commit();

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
