import { createContext, useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { isFunnelLandingPath } from "../utils/funnelLandingPaths";

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const location = useLocation();

    const [cartItems, setCartItems] = useState(() => {
        try {
            const storedCart = localStorage.getItem("mali_cart");
            const parsed = storedCart ? JSON.parse(storedCart) : [];
            if (!Array.isArray(parsed)) return [];
            return parsed.filter(item => item && typeof item === 'object' && item.id);
        } catch (error) {
            console.error("Failed to load cart from localStorage", error);
            return [];
        }
    });

    const [pendingOrders, setPendingOrders] = useState([]);
    const [currentUserId, setCurrentUserId] = useState(null);

    // Trên landing phễu: không import/không đăng ký Firebase (auth + orders)
    useEffect(() => {
        if (isFunnelLandingPath(location.pathname)) {
            setCurrentUserId(null);
            setPendingOrders([]);
            return;
        }

        let unsubscribeAuth;
        let cancelled = false;

        (async () => {
            const [{ auth }, { onAuthStateChanged }] = await Promise.all([
                import("../firebase"),
                import("firebase/auth"),
            ]);
            if (cancelled) return;
            unsubscribeAuth = onAuthStateChanged(auth, (user) => {
                setCurrentUserId(user ? user.uid : null);
                if (!user) setPendingOrders([]);
            });
        })();

        return () => {
            cancelled = true;
            unsubscribeAuth?.();
        };
    }, [location.pathname]);

    useEffect(() => {
        if (isFunnelLandingPath(location.pathname) || !currentUserId) {
            if (isFunnelLandingPath(location.pathname)) setPendingOrders([]);
            return;
        }

        let unsubscribeSnap;
        let cancelled = false;

        (async () => {
            const { db } = await import("../firebase");
            const { collection, query, where, onSnapshot } = await import("firebase/firestore");
            if (cancelled) return;

            const q = query(
                collection(db, "orders"),
                where("userId", "==", currentUserId),
                where("status", "==", "pending")
            );

            unsubscribeSnap = onSnapshot(
                q,
                (snap) => {
                    const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
                    setPendingOrders(orders);
                },
                (err) => {
                    console.error("Error watching pending orders:", err);
                }
            );
        })();

        return () => {
            cancelled = true;
            unsubscribeSnap?.();
        };
    }, [currentUserId, location.pathname]);

    // Sync cart to localStorage
    useEffect(() => {
        try {
            localStorage.setItem("mali_cart", JSON.stringify(cartItems));
        } catch (error) {
            console.error("Failed to save cart to localStorage", error);
        }
    }, [cartItems]);

    const addToCart = (product) => {
        setCartItems((prevItems) => {
            const exists = prevItems.find((item) => item.id === product.id);
            if (exists) {
                toast.error("Khóa học đã có trong giỏ hàng!");
                return prevItems;
            }
            toast.success("Đã thêm vào giỏ hàng!");
            return [...prevItems, product];
        });
    };

    const removeFromCart = (productId) => {
        setCartItems((prevItems) => prevItems.filter((item) => item.id !== productId));
        toast.success("Đã xóa khỏi giỏ hàng");
    };

    const clearCart = () => {
        setCartItems([]);
        localStorage.removeItem("mali_cart");
    };

    const cartCount = Array.isArray(cartItems) ? cartItems.length : 0;
    const pendingCount = pendingOrders.length;
    // Badge tổng = giỏ hàng + đơn chưa thanh toán
    const totalBadgeCount = cartCount + pendingCount;

    const totalAmount = Array.isArray(cartItems) ? cartItems.reduce((total, item) => {
        if (!item) return total;
        const price = Number(item.salePrice) || Number(item.price) || 0;
        return total + price;
    }, 0) : 0;

    return (
        <CartContext.Provider
            value={{
                cartItems,
                addToCart,
                removeFromCart,
                clearCart,
                cartCount,
                totalAmount,
                pendingOrders,
                pendingCount,
                totalBadgeCount,
            }}
        >
            {children}
        </CartContext.Provider>
    );
};
