import { createContext, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState(() => {
        try {
            const storedCart = localStorage.getItem("mali_cart");
            const parsed = storedCart ? JSON.parse(storedCart) : [];
            if (!Array.isArray(parsed)) return [];
            // Validate items to prevent crashes
            return parsed.filter(item => item && typeof item === 'object' && item.id);
        } catch (error) {
            console.error("Failed to load cart from localStorage", error);
            return [];
        }
    });

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
            }}
        >
            {children}
        </CartContext.Provider>
    );
};
