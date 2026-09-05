export const AFFILIATE_REF_KEY = "mali_aff_ref";
export const AFFILIATE_TIME_KEY = "mali_aff_time";

export const DEFAULT_AFFILIATE_SETTINGS = {
    defaultCommissionPercent: 30,
    cookieDurationDays: 30,
    minPayoutAmount: 200000,
    autoApproveAffiliate: true,
    payoutTerms: "Hoa hồng được đối soát và thanh toán linh hoạt khi đạt số dư tối thiểu.",
};

const AFFILIATE_API = "/api/affiliate";
const ADMIN_AFFILIATE_API = "/api/admin/affiliate";

const getAuthHeaders = async (required = true) => {
    const { auth } = await import("../firebase");
    const currentUser = auth.currentUser;
    if (!currentUser) {
        if (required) throw new Error("Vui lòng đăng nhập để tiếp tục.");
        return {};
    }
    return { authorization: `Bearer ${await currentUser.getIdToken()}` };
};

const requestJson = async (url, {
    authenticated = false,
    body,
    method = "GET",
} = {}) => {
    const response = await fetch(url, {
        method,
        credentials: "same-origin",
        headers: {
            ...(body ? { "content-type": "application/json" } : {}),
            ...(authenticated ? await getAuthHeaders(true) : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(result.error || `Affiliate API error (${response.status})`);
    }
    return result;
};

export const storeAffiliateRef = (code) => {
    if (!code || typeof code !== "string") return;
    const cleanCode = code.trim().toUpperCase();
    if (!/^[A-Z0-9_-]{3,20}$/.test(cleanCode)) return;
    try {
        localStorage.setItem(AFFILIATE_REF_KEY, cleanCode);
        localStorage.setItem(AFFILIATE_TIME_KEY, Date.now().toString());
    } catch (error) {
        console.warn("Could not save affiliate ref:", error);
    }
};

export const getActiveAffiliateRef = async () => {
    try {
        const storedCode = localStorage.getItem(AFFILIATE_REF_KEY);
        const storedTime = localStorage.getItem(AFFILIATE_TIME_KEY);
        if (!storedCode) return null;
        const settings = await getAffiliateSettings();
        const durationDays = Number(settings.cookieDurationDays ?? 0);
        if (durationDays === 0) return storedCode;
        const elapsedMs = Date.now() - (Number(storedTime) || 0);
        if (elapsedMs > durationDays * 24 * 60 * 60 * 1000) {
            localStorage.removeItem(AFFILIATE_REF_KEY);
            localStorage.removeItem(AFFILIATE_TIME_KEY);
            return null;
        }
        return storedCode;
    } catch {
        return null;
    }
};

export const getAffiliateSettings = async () => {
    try {
        const settings = await requestJson(`${AFFILIATE_API}?view=settings`);
        return { ...DEFAULT_AFFILIATE_SETTINGS, ...settings };
    } catch (error) {
        console.error("Error reading affiliate settings:", error);
        return DEFAULT_AFFILIATE_SETTINGS;
    }
};

export const saveAffiliateSettings = async (settings) => requestJson(ADMIN_AFFILIATE_API, {
    authenticated: true,
    body: { action: "save-settings", settings },
    method: "POST",
});

// Admin must see a load failure, not silently edit fallback financial settings.
export const getAdminAffiliateSettings = () => requestJson(
    `${ADMIN_AFFILIATE_API}?view=settings`, { authenticated: true },
);

export const getAffiliateByUserId = async (userId) => {
    const { auth } = await import("../firebase");
    if (!userId || auth.currentUser?.uid !== userId) return null;
    return requestJson(`${AFFILIATE_API}?view=profile`, { authenticated: true });
};

export const registerAffiliate = async (user, { affiliateCode, phone = "", bankInfo = {} }) => {
    const { auth } = await import("../firebase");
    if (!user?.uid || auth.currentUser?.uid !== user.uid) {
        throw new Error("Vui lòng đăng nhập trước khi đăng ký.");
    }
    return requestJson(AFFILIATE_API, {
        authenticated: true,
        body: { action: "register", affiliateCode, bankInfo, phone },
        method: "POST",
    });
};

export const updateAffiliateBankInfo = async (userId, bankInfo) => {
    const { auth } = await import("../firebase");
    if (!userId || auth.currentUser?.uid !== userId) throw new Error("Tài khoản không hợp lệ.");
    return requestJson(AFFILIATE_API, {
        authenticated: true,
        body: { action: "update-bank", bankInfo },
        method: "POST",
    });
};

export const recordAffiliateClick = async (affiliateCode) => {
    if (!affiliateCode) return null;
    try {
        return await requestJson(AFFILIATE_API, {
            body: { action: "click", affiliateCode },
            method: "POST",
        });
    } catch (error) {
        console.warn("Could not record affiliate click:", error);
        return null;
    }
};

export const validateCouponCode = async (couponCode) => requestJson("/api/coupons/validate", {
    body: { couponCode },
    method: "POST",
});

export const processAffiliateCommission = async (orderId) => requestJson(ADMIN_AFFILIATE_API, {
    authenticated: true,
    body: { action: "process-order", orderId },
    method: "POST",
});

export const createPayoutRequest = async (userId, amount, _bankInfo, note = "") => {
    const { auth } = await import("../firebase");
    if (!userId || auth.currentUser?.uid !== userId) throw new Error("Tài khoản không hợp lệ.");
    return requestJson(AFFILIATE_API, {
        authenticated: true,
        body: { action: "request-payout", amount, note },
        method: "POST",
    });
};

export const getAffiliateCommissions = async (userId) => {
    const { auth } = await import("../firebase");
    if (!userId || auth.currentUser?.uid !== userId) return [];
    return requestJson(`${AFFILIATE_API}?view=commissions`, { authenticated: true });
};

export const getAffiliatePayouts = async (userId) => {
    const { auth } = await import("../firebase");
    if (!userId || auth.currentUser?.uid !== userId) return [];
    return requestJson(`${AFFILIATE_API}?view=payouts`, { authenticated: true });
};

const getAllAdminPages = async (view) => {
    const items = [];
    let cursor = null;
    do {
        const params = new URLSearchParams({ view, paginated: "1" });
        if (cursor) params.set("cursor", cursor);
        const page = await requestJson(`${ADMIN_AFFILIATE_API}?${params}`, { authenticated: true });
        // Also accepts the previous API shape during a rolling deployment.
        if (Array.isArray(page)) return [...items, ...page];
        items.push(...page.items);
        cursor = page.nextCursor;
    } while (cursor);
    return items;
};

export const getAllAffiliates = () => getAllAdminPages("affiliates");

export const updateAffiliateByAdmin = async (affiliateId, updateData) => requestJson(
    ADMIN_AFFILIATE_API,
    {
        authenticated: true,
        body: { action: "update-affiliate", affiliateId, updateData },
        method: "POST",
    },
);

export const getAllPayoutRequests = () => getAllAdminPages("payouts");

export const getAllCommissions = () => getAllAdminPages("commissions");

export const processPayoutStatus = async (
    payoutId,
    status,
    { adminNote = "", transactionRef = "" } = {},
) => requestJson(ADMIN_AFFILIATE_API, {
    authenticated: true,
    body: {
        action: "process-payout",
        adminNote,
        payoutId,
        status,
        transactionRef,
    },
    method: "POST",
});
