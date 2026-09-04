import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase";

// Pending orders remain accessible independently of the removed shopping cart.
export default function usePendingOrderCount(userId) {
    const [result, setResult] = useState({ userId: null, count: 0 });

    useEffect(() => {
        if (!userId) return;
        let active = true;
        const unsubscribe = onSnapshot(query(
            collection(db, "orders"),
            where("userId", "==", userId),
            where("status", "==", "pending"),
        ), (snapshot) => {
            if (active) setResult({ userId, count: snapshot.size });
        }, (error) => {
            console.error("Error watching pending orders:", error);
            if (active) setResult({ userId, count: 0 });
        });
        return () => {
            active = false;
            unsubscribe();
        };
    }, [userId]);

    return userId && result.userId === userId ? result.count : 0;
}
