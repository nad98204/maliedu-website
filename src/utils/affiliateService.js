import {
    collection,
    doc,
    getDoc,
    getDocs,
    increment,
    limit,
    orderBy,
    query,
    runTransaction,
    serverTimestamp,
    setDoc,
    updateDoc,
    where
} from "firebase/firestore";
import { db } from "../firebase";

export const AFFILIATE_REF_KEY = "mali_aff_ref";
export const AFFILIATE_TIME_KEY = "mali_aff_time";

const SETTINGS_COLLECTION = "affiliate_settings";
const SETTINGS_DOC_ID = "general";
const AFFILIATES_COLLECTION = "affiliates";
const COMMISSIONS_COLLECTION = "affiliate_commissions";
const PAYOUTS_COLLECTION = "affiliate_payouts";

// Cài đặt mặc định
export const DEFAULT_AFFILIATE_SETTINGS = {
    defaultCommissionPercent: 30, // 30% mặc định
    cookieDurationDays: 30, // 0 = vĩnh viễn, hoặc 30, 60, 90 ngày
    minPayoutAmount: 200000, // Tối thiểu 200.000 VNĐ
    autoApproveAffiliate: true,
    payoutTerms: "Hoa hồng được đối soát và thanh toán linh hoạt khi đạt số dư tối thiểu.",
};

/**
 * Lưu mã giới thiệu vào LocalStorage khi khách truy cập qua link ?ref=... hoặc ?aff=...
 */
export const storeAffiliateRef = (code) => {
    if (!code || typeof code !== "string") return;
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return;

    try {
        localStorage.setItem(AFFILIATE_REF_KEY, cleanCode);
        localStorage.setItem(AFFILIATE_TIME_KEY, Date.now().toString());
    } catch (e) {
        console.warn("Could not save affiliate ref to localStorage:", e);
    }
};

/**
 * Lấy mã giới thiệu hợp lệ hiện tại (có kiểm tra thời hạn lưu nhớ)
 */
export const getActiveAffiliateRef = async () => {
    try {
        const storedCode = localStorage.getItem(AFFILIATE_REF_KEY);
        const storedTime = localStorage.getItem(AFFILIATE_TIME_KEY);
        if (!storedCode) return null;

        const settings = await getAffiliateSettings();
        const durationDays = Number(settings.cookieDurationDays || 0);

        // 0 nghĩa là Vĩnh viễn (Forever)
        if (durationDays === 0) {
            return storedCode;
        }

        const elapsedMs = Date.now() - (Number(storedTime) || 0);
        const maxMs = durationDays * 24 * 60 * 60 * 1000;

        if (elapsedMs > maxMs) {
            // Đã hết hạn lưu nhớ
            localStorage.removeItem(AFFILIATE_REF_KEY);
            localStorage.removeItem(AFFILIATE_TIME_KEY);
            return null;
        }

        return storedCode;
    } catch {
        return null;
    }
};

/**
 * Đọc cài đặt Affiliate toàn hệ thống
 */
export const getAffiliateSettings = async () => {
    try {
        const settingsRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
        const snapshot = await getDoc(settingsRef);
        if (snapshot.exists()) {
            return { ...DEFAULT_AFFILIATE_SETTINGS, ...snapshot.data() };
        }
        return DEFAULT_AFFILIATE_SETTINGS;
    } catch (error) {
        console.error("Error reading affiliate settings:", error);
        return DEFAULT_AFFILIATE_SETTINGS;
    }
};

/**
 * Lưu cài đặt Affiliate toàn hệ thống (Admin)
 */
export const saveAffiliateSettings = async (newSettings) => {
    const settingsRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
    await setDoc(settingsRef, {
        ...newSettings,
        updatedAt: serverTimestamp(),
    }, { merge: true });
};

/**
 * Lấy hồ sơ CTV theo userId
 */
export const getAffiliateByUserId = async (userId) => {
    if (!userId) return null;
    try {
        const affiliateRef = doc(db, AFFILIATES_COLLECTION, userId);
        const snapshot = await getDoc(affiliateRef);
        if (snapshot.exists()) {
            return { id: snapshot.id, ...snapshot.data() };
        }
        return null;
    } catch (error) {
        console.error("Error fetching affiliate profile:", error);
        return null;
    }
};

/**
 * Tìm CTV theo mã tiếp thị (affiliateCode)
 */
export const getAffiliateByCode = async (code) => {
    if (!code) return null;
    const cleanCode = code.trim().toUpperCase();
    try {
        const q = query(
            collection(db, AFFILIATES_COLLECTION),
            where("affiliateCode", "==", cleanCode),
            limit(1)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            const docSnap = snapshot.docs[0];
            return { id: docSnap.id, ...docSnap.data() };
        }
        return null;
    } catch (error) {
        console.error("Error searching affiliate by code:", error);
        return null;
    }
};

/**
 * Tìm CTV theo mã giảm giá (couponCode)
 */
export const getAffiliateByCoupon = async (couponCode) => {
    if (!couponCode) return null;
    const cleanCoupon = couponCode.trim().toUpperCase();
    try {
        const q = query(
            collection(db, AFFILIATES_COLLECTION),
            where("couponCode", "==", cleanCoupon),
            limit(1)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            const docSnap = snapshot.docs[0];
            return { id: docSnap.id, ...docSnap.data() };
        }
        return null;
    } catch (error) {
        console.error("Error searching affiliate by coupon:", error);
        return null;
    }
};

/**
 * Đăng ký tài khoản CTV mới
 */
export const registerAffiliate = async (user, { affiliateCode, phone = "", bankInfo = {} }) => {
    if (!user?.uid) throw new Error("Vui lòng đăng nhập trước khi đăng ký.");
    
    const cleanCode = (affiliateCode || "").trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
    if (cleanCode.length < 3 || cleanCode.length > 20) {
        throw new Error("Mã giới thiệu phải từ 3 đến 20 ký tự (chữ cái và số không dấu).");
    }

    // Kiểm tra xem mã này đã có ai dùng chưa
    const existing = await getAffiliateByCode(cleanCode);
    if (existing && existing.userId !== user.uid) {
        throw new Error(`Mã tiếp thị "${cleanCode}" đã có người sử dụng. Vui lòng chọn mã khác.`);
    }

    const settings = await getAffiliateSettings();
    const affiliateRef = doc(db, AFFILIATES_COLLECTION, user.uid);

    const affiliateData = {
        userId: user.uid,
        affiliateCode: cleanCode,
        name: user.displayName || user.email?.split("@")[0] || "Cộng tác viên",
        email: user.email || "",
        phone: phone || "",
        customCommissionPercent: null, // Dùng mặc định hệ thống
        couponCode: `${cleanCode}10`, // Tự sinh mã giảm 10% mặc định
        couponDiscountPercent: 10,
        bankInfo: {
            bankName: bankInfo.bankName || "",
            accountNumber: bankInfo.accountNumber || "",
            accountHolder: bankInfo.accountHolder || "",
        },
        stats: {
            totalClicks: 0,
            totalOrders: 0,
            totalRevenue: 0,
            totalCommission: 0,
            balance: 0,
            paidAmount: 0,
        },
        status: settings.autoApproveAffiliate ? "active" : "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    await setDoc(affiliateRef, affiliateData, { merge: true });
    return affiliateData;
};

/**
 * Cập nhật thông tin ngân hàng của CTV
 */
export const updateAffiliateBankInfo = async (userId, bankInfo) => {
    const affiliateRef = doc(db, AFFILIATES_COLLECTION, userId);
    await updateDoc(affiliateRef, {
        bankInfo: {
            bankName: bankInfo.bankName || "",
            accountNumber: bankInfo.accountNumber || "",
            accountHolder: bankInfo.accountHolder || "",
        },
        updatedAt: serverTimestamp(),
    });
};

/**
 * Ghi nhận lượt click link tiếp thị
 */
export const recordAffiliateClick = async (affiliateCode) => {
    if (!affiliateCode) return;
    try {
        const affiliate = await getAffiliateByCode(affiliateCode);
        if (affiliate?.id) {
            const affiliateRef = doc(db, AFFILIATES_COLLECTION, affiliate.id);
            await updateDoc(affiliateRef, {
                "stats.totalClicks": increment(1),
                updatedAt: serverTimestamp(),
            });
        }
    } catch (e) {
        console.warn("Could not record affiliate click:", e);
    }
};

/**
 * Xử lý tính toán và ghi nhận hoa hồng khi đơn hàng hoàn tất
 */
export const processAffiliateCommission = async (orderId, orderData) => {
    if (!orderId || !orderData) return null;
    if (orderData.status !== "completed") return null;

    try {
        // Tìm CTV theo 2 cơ chế: Ưu tiên mã Coupon trước, sau đó tới mã Link Ref
        let affiliate = null;
        let attributionType = "ref_link";

        if (orderData.couponCode) {
            affiliate = await getAffiliateByCoupon(orderData.couponCode);
            if (affiliate) attributionType = "coupon";
        }

        if (!affiliate && orderData.affiliateCode) {
            affiliate = await getAffiliateByCode(orderData.affiliateCode);
            if (affiliate) attributionType = "ref_link";
        }

        if (!affiliate) return null;

        // Chống tự mua (Self-referral fraud prevention)
        if (affiliate.userId === orderData.userId || affiliate.email === orderData.userEmail || affiliate.email === orderData.customerEmail) {
            console.warn("[Affiliate] Bỏ qua hoa hồng: Không được tự mua khóa học của chính mình.");
            return null;
        }

        if (affiliate.status !== "active") {
            console.warn(`[Affiliate] Tài khoản CTV ${affiliate.affiliateCode} đang bị khóa hoặc chưa duyệt.`);
            return null;
        }

        const settings = await getAffiliateSettings();

        // 1. Kiểm tra % hoa hồng riêng của từng khóa học nếu có
        let courseCommissionPercent = null;
        if (orderData.courseId && orderData.courseId !== 'cart-order') {
            try {
                const courseSnap = await getDoc(doc(db, "courses", orderData.courseId));
                if (courseSnap.exists() && courseSnap.data().affiliateCommissionPercent != null && courseSnap.data().affiliateCommissionPercent !== "") {
                    courseCommissionPercent = Number(courseSnap.data().affiliateCommissionPercent);
                }
            } catch (e) {
                console.warn("[Affiliate] Could not fetch course commission:", e);
            }
        }

        // Xác định % hoa hồng (Ưu tiên: CTV VIP riêng > Tỷ lệ riêng từng Khóa học > Mặc định hệ thống)
        const commissionPercent = Number(
            affiliate.customCommissionPercent != null
                ? affiliate.customCommissionPercent
                : (courseCommissionPercent != null ? courseCommissionPercent : (settings.defaultCommissionPercent || 30))
        );

        const orderTotal = Number(orderData.amount || orderData.totalAmount || 0);
        if (orderTotal <= 0) return null;

        const commissionAmount = Math.round((orderTotal * commissionPercent) / 100);

        const commissionDocId = `${orderId}_${affiliate.userId}`;
        const commissionRef = doc(db, COMMISSIONS_COLLECTION, commissionDocId);

        // Chạy Transaction an toàn để tránh ghi nhận 2 lần
        await runTransaction(db, async (transaction) => {
            const existingCommission = await transaction.get(commissionRef);
            if (existingCommission.exists()) {
                // Đã được ghi nhận trước đó
                return;
            }

            const commissionRecord = {
                orderId,
                orderCode: orderData.orderCode || orderId,
                affiliateId: affiliate.userId,
                affiliateCode: affiliate.affiliateCode,
                affiliateName: affiliate.name,
                customerName: orderData.customerName || "Học viên",
                customerEmail: orderData.customerEmail || orderData.userEmail || "",
                courseId: orderData.courseId || "multi-courses",
                courseName: orderData.courseName || "Đơn hàng khóa học",
                orderAmount: orderTotal,
                commissionPercent,
                commissionAmount,
                attributionType,
                status: "approved",
                createdAt: serverTimestamp(),
            };

            transaction.set(commissionRef, commissionRecord);

            const affiliateRef = doc(db, AFFILIATES_COLLECTION, affiliate.userId);
            transaction.update(affiliateRef, {
                "stats.totalOrders": increment(1),
                "stats.totalRevenue": increment(orderTotal),
                "stats.totalCommission": increment(commissionAmount),
                "stats.balance": increment(commissionAmount),
                updatedAt: serverTimestamp(),
            });
        });

        return {
            affiliateCode: affiliate.affiliateCode,
            commissionAmount,
            commissionPercent,
        };
    } catch (error) {
        console.error("[Affiliate] Error processing commission:", error);
        return null;
    }
};

/**
 * Gửi yêu cầu rút tiền
 */
export const createPayoutRequest = async (userId, amount, bankInfo, note = "") => {
    if (!userId || !amount || amount <= 0) {
        throw new Error("Số tiền rút không hợp lệ.");
    }

    const affiliateRef = doc(db, AFFILIATES_COLLECTION, userId);
    const settings = await getAffiliateSettings();
    const minPayout = Number(settings.minPayoutAmount || 200000);

    if (amount < minPayout) {
        throw new Error(`Số tiền rút tối thiểu là ${new Intl.NumberFormat("vi-VN").format(minPayout)} VNĐ.`);
    }

    return await runTransaction(db, async (transaction) => {
        const affiliateDoc = await transaction.get(affiliateRef);
        if (!affiliateDoc.exists()) {
            throw new Error("Không tìm thấy thông tin CTV.");
        }

        const affiliate = affiliateDoc.data();
        const currentBalance = Number(affiliate.stats?.balance || 0);

        if (amount > currentBalance) {
            throw new Error("Số dư khả dụng không đủ để thực hiện yêu cầu này.");
        }

        const payoutRef = doc(collection(db, PAYOUTS_COLLECTION));
        const payoutRecord = {
            id: payoutRef.id,
            affiliateId: userId,
            affiliateCode: affiliate.affiliateCode,
            affiliateName: affiliate.name,
            affiliateEmail: affiliate.email,
            amount: Number(amount),
            bankInfo: {
                bankName: bankInfo.bankName || affiliate.bankInfo?.bankName || "",
                accountNumber: bankInfo.accountNumber || affiliate.bankInfo?.accountNumber || "",
                accountHolder: bankInfo.accountHolder || affiliate.bankInfo?.accountHolder || "",
            },
            note: note || "",
            status: "pending", // pending | completed | rejected
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        transaction.set(payoutRef, payoutRecord);

        // Khấu trừ số dư ngay lập tức khi tạo lệnh rút
        transaction.update(affiliateRef, {
            "stats.balance": increment(-amount),
            updatedAt: serverTimestamp(),
        });

        return payoutRecord;
    });
};

/**
 * Lấy lịch sử hoa hồng của 1 CTV
 */
export const getAffiliateCommissions = async (userId) => {
    if (!userId) return [];
    try {
        const q = query(
            collection(db, COMMISSIONS_COLLECTION),
            where("affiliateId", "==", userId),
            orderBy("createdAt", "desc"),
            limit(50)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error loading commissions:", error);
        return [];
    }
};

/**
 * Lấy lịch sử yêu cầu rút tiền của 1 CTV
 */
export const getAffiliatePayouts = async (userId) => {
    if (!userId) return [];
    try {
        const q = query(
            collection(db, PAYOUTS_COLLECTION),
            where("affiliateId", "==", userId),
            orderBy("createdAt", "desc"),
            limit(30)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error loading payouts:", error);
        return [];
    }
};

// =================== ADMIN MANAGEMENT FUNCTIONS ===================

/**
 * Lấy danh sách tất cả CTV (Admin)
 */
export const getAllAffiliates = async () => {
    try {
        const q = query(collection(db, AFFILIATES_COLLECTION), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error getting all affiliates:", error);
        return [];
    }
};

/**
 * Cập nhật hồ sơ CTV (Admin: Chỉnh % riêng, coupon riêng, trạng thái)
 */
export const updateAffiliateByAdmin = async (userId, updateData) => {
    const affiliateRef = doc(db, AFFILIATES_COLLECTION, userId);
    await updateDoc(affiliateRef, {
        ...updateData,
        updatedAt: serverTimestamp(),
    });
};

/**
 * Lấy tất cả yêu cầu rút tiền (Admin)
 */
export const getAllPayoutRequests = async () => {
    try {
        const q = query(collection(db, PAYOUTS_COLLECTION), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error getting all payouts:", error);
        return [];
    }
};

/**
 * Lấy tất cả lịch sử hoa hồng (Admin)
 */
export const getAllCommissions = async () => {
    try {
        const q = query(collection(db, COMMISSIONS_COLLECTION), orderBy("createdAt", "desc"), limit(100));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error getting all commissions:", error);
        return [];
    }
};

/**
 * Xử lý duyệt hoặc từ chối yêu cầu rút tiền (Admin)
 */
export const processPayoutStatus = async (payoutId, newStatus, { adminNote = "", transactionRef = "" } = {}) => {
    if (!payoutId || !["completed", "rejected"].includes(newStatus)) {
        throw new Error("Trạng thái duyệt không hợp lệ.");
    }

    const payoutRef = doc(db, PAYOUTS_COLLECTION, payoutId);

    return await runTransaction(db, async (transaction) => {
        const payoutDoc = await transaction.get(payoutRef);
        if (!payoutDoc.exists()) {
            throw new Error("Không tìm thấy yêu cầu rút tiền.");
        }

        const payout = payoutDoc.data();
        if (payout.status !== "pending") {
            throw new Error("Yêu cầu này đã được xử lý trước đó.");
        }

        const affiliateRef = doc(db, AFFILIATES_COLLECTION, payout.affiliateId);

        if (newStatus === "completed") {
            // Duyệt thành công -> Tăng số tiền đã thanh toán (paidAmount)
            transaction.update(affiliateRef, {
                "stats.paidAmount": increment(payout.amount),
                updatedAt: serverTimestamp(),
            });
        } else if (newStatus === "rejected") {
            // Từ chối -> Hoàn trả lại số dư cho CTV
            transaction.update(affiliateRef, {
                "stats.balance": increment(payout.amount),
                updatedAt: serverTimestamp(),
            });
        }

        transaction.update(payoutRef, {
            status: newStatus,
            adminNote: adminNote || "",
            transactionRef: transactionRef || "",
            processedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
    });
};
