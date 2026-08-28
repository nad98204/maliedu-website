import { useEffect } from "react";
import { useLocation } from "react-router";
import { recordAffiliateClick, storeAffiliateRef } from "../utils/affiliateService";

/**
 * Hook tự động bắt tham số ?ref=... hoặc ?aff=... trên mọi trang
 * và lưu trữ vào LocalStorage để ghi nhận hoa hồng cho CTV.
 */
export const useAffiliateTracker = () => {
    const location = useLocation();

    useEffect(() => {
        try {
            const searchParams = new URLSearchParams(location.search);
            const refCode = searchParams.get("ref") || searchParams.get("aff") || searchParams.get("affiliate");

            if (refCode && typeof refCode === "string" && refCode.trim()) {
                const cleanCode = refCode.trim().toUpperCase();
                // Lưu vào LocalStorage
                storeAffiliateRef(cleanCode);
                // Ghi nhận tăng lượt click cho CTV
                recordAffiliateClick(cleanCode);
            }
        } catch (error) {
            console.warn("Affiliate tracker error:", error);
        }
    }, [location.search]);
};

export default useAffiliateTracker;
