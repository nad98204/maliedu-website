import { collection, getDocs, query, where, orderBy, limit, getCountFromServer } from "firebase/firestore";
import { db } from "../firebase";

export const getDashboardStats = async () => {
    try {
        const stats = {
            revenue: 0,
            users: 0,
            pendingOrders: 0,
            totalCourses: 0,
            recentOrders: []
        };

        // 1. Calculate Revenue (Completed Orders Only)
        const ordersRef = collection(db, "orders");
        const completedOrdersQuery = query(ordersRef, where("status", "==", "completed"));
        const completedSnapshot = await getDocs(completedOrdersQuery);

        completedSnapshot.forEach(doc => {
            const data = doc.data();
            stats.revenue += Number(data.amount) || 0;
        });

        // 2. Count Users
        // Note: Counting all users might be expensive if scaling, but fine for now.
        // Using getCountFromServer is better for cost/performance if available, 
        // but simple collection get is easier if count is low.
        // Let's us getCountFromServer for efficiency.
        const usersRef = collection(db, "users");
        // const userSnapshot = await getCountFromServer(usersRef); 
        // Note: getCountFromServer requires specific firebase version/index. 
        // Fallback to getDocs just to be safe and simple for this scale.
        const userSnapshot = await getDocs(usersRef);
        stats.users = userSnapshot.size;

        // 3. Count Pending Orders
        const pendingQuery = query(ordersRef, where("status", "==", "pending"));
        const pendingSnapshot = await getDocs(pendingQuery);
        stats.pendingOrders = pendingSnapshot.size;

        // 4. Count Courses
        const coursesRef = collection(db, "courses");
        const coursesSnapshot = await getDocs(coursesRef);
        stats.totalCourses = coursesSnapshot.size;

        // 5. Get Recent Orders
        const recentQuery = query(ordersRef, orderBy("createdAt", "desc"), limit(5));
        const recentSnapshot = await getDocs(recentQuery);

        stats.recentOrders = recentSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return stats;

    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        throw error;
    }
};
