import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
    where,
    writeBatch
} from "firebase/firestore";
import { db } from "../firebase";

const COLLECTION_NAME = "orders";

export const createOrder = async (orderData) => {
    try {
        const orderCode = `MALI-${Math.floor(100000 + Math.random() * 900000)}`;
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
            ...orderData,
            orderCode,
            items: orderData.items || [{
                id: orderData.courseId,
                name: orderData.courseName,
                price: orderData.coursePrice
            }],
            status: 'pending',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return { id: docRef.id, orderCode };
    } catch (error) {
        console.error("Error creating order:", error);
        throw error;
    }
};

export const getOrderById = async (orderId) => {
    try {
        const docRef = doc(db, COLLECTION_NAME, orderId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        }
        return null;
    } catch (error) {
        console.error("Error fetching order:", error);
        throw error;
    }
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
                    alreadyEnrolled: !snap.empty
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
        checkResults.forEach(({ item, cId, cName, alreadyEnrolled }) => {
            if (!alreadyEnrolled) {
                const newEnrollRef = doc(enrollmentsRef); // auto ID
                batch.set(newEnrollRef, {
                    userId: order.userId,
                    userEmail: order.userEmail,
                    courseId: cId,
                    courseName: cName,
                    enrolledAt: now,
                    orderId: orderId,
                    status: 'active'
                });
                enrolledCount++;
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
