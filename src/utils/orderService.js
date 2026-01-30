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
    where
} from "firebase/firestore";
import { db } from "../firebase";

const COLLECTION_NAME = "orders";

export const createOrder = async (orderData) => {
    try {
        // Generate a simple Order Code (e.g., MALI-123456)
        const orderCode = `MALI-${Math.floor(100000 + Math.random() * 900000)}`;

        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
            ...orderData,
            orderCode,
            // If items are present, use them. If not (legacy single course), make an array of 1
            items: orderData.items || [{
                id: orderData.courseId,
                name: orderData.courseName,
                price: orderData.coursePrice
            }],
            status: 'pending', // pending, completed, cancelled
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
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error fetching order:", error);
        throw error;
    }
};

export const getAllOrders = async () => {
    try {
        const q = query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const orders = [];
        querySnapshot.forEach((doc) => {
            orders.push({ id: doc.id, ...doc.data() });
        });
        return orders;
    } catch (error) {
        console.error("Error fetching all orders:", error);
        throw error;
    }
};

export const approveOrder = async (orderId) => {
    try {
        const order = await getOrderById(orderId);
        if (!order) throw new Error("Order not found");

        if (order.status === 'completed') return;

        // 1. Update Order Status
        const orderRef = doc(db, COLLECTION_NAME, orderId);
        await updateDoc(orderRef, {
            status: 'completed',
            updatedAt: serverTimestamp(),
            approvedAt: serverTimestamp()
        });

        // 2. Auto-Enroll User
        const itemsToEnroll = order.items || [{
            courseId: order.courseId,
            courseName: order.courseName
        }];

        for (const item of itemsToEnroll) {
            // Check if already enrolled to avoid duplicates
            const enrollmentsRef = collection(db, "enrollments");
            // Handle differences in structure between legacy/new items
            const cId = item.id || item.courseId;
            const cName = item.name || item.courseName;

            const q = query(
                enrollmentsRef,
                where("userId", "==", order.userId),
                where("courseId", "==", cId)
            );
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                await addDoc(enrollmentsRef, {
                    userId: order.userId,
                    userEmail: order.userEmail,
                    courseId: cId,
                    courseName: cName,
                    enrolledAt: serverTimestamp(),
                    orderId: orderId,
                    status: 'active'
                });
            }
        }

        return true;
    } catch (error) {
        console.error("Error approving order:", error);
        throw error;
    }
};

export const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};
