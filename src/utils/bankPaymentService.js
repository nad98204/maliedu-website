/**
 * bankPaymentService.js
 * Quản lý cấu hình ngân hàng và xác minh thanh toán tự động
 * 
 * Hỗ trợ 2 phương thức:
 * 1. SePay Webhook (https://sepay.vn) - Miễn phí, realtime
 * 2. Casso API (https://casso.vn) - Có phí, realtime
 * 3. Thủ công - Admin duyệt tay
 */

import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp,
    collection,
    query,
    where,
    getDocs,
    addDoc,
    orderBy,
    limit
} from "firebase/firestore";
import { db } from "../firebase";
import { approveOrder } from "./orderService";

const BANK_SETTINGS_DOC = "bank_payment_settings";
const SETTINGS_COLLECTION = "system_settings";
const BANK_TRANSACTIONS_COLLECTION = "bank_transactions";

// ============================
// CẤU HÌNH MẶC ĐỊNH
// ============================
export const DEFAULT_BANK_SETTINGS = {
    // Thông tin ngân hàng
    bankId: "MB",           // Mã ngân hàng VietQR
    bankName: "MB Bank",    // Tên ngân hàng đầy đủ
    accountNo: "",          // Số tài khoản
    accountName: "",        // Tên chủ tài khoản (IN HOA)
    branch: "",             // Chi nhánh (tùy chọn)

    // Nội dung chuyển khoản
    transferPrefix: "MALI", // Prefix nội dung CK (VD: MALI → "MALI 123456")
    qrTemplate: "compact2", // Template VietQR: compact, compact2, qr_only, print

    // Phương thức xác minh tự động
    autoVerifyMethod: "manual", // "manual" | "sepay" | "casso" | "mbbank"

    // SePay settings (https://sepay.vn - Free)
    sepayApiKey: "",        // API Key của SePay
    sepayAccountId: "",     // ID tài khoản trên SePay

    // Casso settings (https://casso.vn - Paid)
    cassoApiKey: "",        // API Key của Casso

    // MBBank (Unofficial - qua scraping, không khuyến nghị)
    mbbankUsername: "",
    mbbankPassword: "",

    // Telegram thông báo
    telegramBotToken: "",   // Bot token để nhận thông báo
    telegramChatId: "",     // Chat ID để gửi thông báo

    // Các cài đặt khác
    isEnabled: true,        // Bật/tắt thanh toán ngân hàng
    autoApproveEnabled: false, // Tự động duyệt khi phát hiện giao dịch khớp
    matchWindowMinutes: 60, // Thời gian tìm giao dịch (phút)

    updatedAt: null
};

// Danh sách ngân hàng Việt Nam hỗ trợ VietQR
export const VIETNAM_BANKS = [
    { id: "VIETCOMBANK", name: "Vietcombank" },
    { id: "BIDV", name: "BIDV" },
    { id: "VIETINBANK", name: "VietinBank" },
    { id: "AGRIBANK", name: "Agribank" },
    { id: "MB", name: "MB Bank" },
    { id: "TECHCOMBANK", name: "Techcombank" },
    { id: "ACB", name: "ACB" },
    { id: "VPBANK", name: "VPBank" },
    { id: "TPBANK", name: "TPBank" },
    { id: "SACOMBANK", name: "Sacombank" },
    { id: "HDBank", name: "HDBank" },
    { id: "VIETBANK", name: "VietBank" },
    { id: "MSB", name: "MSB" },
    { id: "SEABANK", name: "SeABank" },
    { id: "OCEANBANK", name: "OceanBank" },
    { id: "SHB", name: "SHB" },
    { id: "VIB", name: "VIB" },
    { id: "OCB", name: "OCB" },
    { id: "NCB", name: "NCB" },
    { id: "NAMABANK", name: "Nam A Bank" },
    { id: "LPBANK", name: "LPBank" },
    { id: "BAC_A_BANK", name: "Bắc Á Bank" },
    { id: "BAOVIETBANK", name: "Bảo Việt Bank" },
    { id: "CAKE", name: "CAKE" },
    { id: "UBANK", name: "UBANK" },
    { id: "COOPBANK", name: "Co-opBank" },
    { id: "KIENLONGBANK", name: "Kiên Long Bank" },
    { id: "PVCOMBANK", name: "PVComBank" },
    { id: "ABBANK", name: "ABBANK" },
    { id: "EXIMBANK", name: "Eximbank" },
    { id: "PGBANK", name: "PGBank" },
    { id: "VIETABANK", name: "Viet A Bank" },
    { id: "GPBANK", name: "GPBank" },
    { id: "BANVIETBANK", name: "Bản Việt Bank" },
    { id: "CBBANK", name: "CBBank" },
];

// ============================
// LẤY/LƯU CẤU HÌNH
// ============================
export const getBankSettings = async () => {
    try {
        const docRef = doc(db, SETTINGS_COLLECTION, BANK_SETTINGS_DOC);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { ...DEFAULT_BANK_SETTINGS, ...docSnap.data() };
        }
        return DEFAULT_BANK_SETTINGS;
    } catch (error) {
        console.error("Error getting bank settings:", error);
        return DEFAULT_BANK_SETTINGS;
    }
};

export const saveBankSettings = async (settings) => {
    try {
        const docRef = doc(db, SETTINGS_COLLECTION, BANK_SETTINGS_DOC);
        await setDoc(docRef, {
            ...settings,
            updatedAt: serverTimestamp()
        }, { merge: true });
        return true;
    } catch (error) {
        console.error("Error saving bank settings:", error);
        throw error;
    }
};

// ============================
// TẠO QR CODE URL
// ============================
export const generateQrUrl = (settings, amount, transferContent) => {
    const { bankId, accountNo, accountName, qrTemplate } = settings;
    if (!bankId || !accountNo) return null;
    return `https://img.vietqr.io/image/${bankId}-${accountNo}-${qrTemplate || 'compact2'}.png?amount=${amount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(accountName || '')}`;
};

// ============================
// TẠO NỘI DUNG CHUYỂN KHOẢN
// ============================
export const generateTransferContent = (settings, orderCode) => {
    const prefix = settings.transferPrefix || "MALI";
    return `${prefix} ${orderCode}`;
};

// ============================
// LƯU GIAO DỊCH NGÂN HÀNG VÀO DB
// ============================
export const saveBankTransaction = async (transaction) => {
    try {
        const docRef = await addDoc(collection(db, BANK_TRANSACTIONS_COLLECTION), {
            ...transaction,
            createdAt: serverTimestamp()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error saving bank transaction:", error);
        throw error;
    }
};

// ============================
// LẤY LỊCH SỬ GIAO DỊCH
// ============================
export const getBankTransactions = async (limitCount = 50) => {
    try {
        const q = query(
            collection(db, BANK_TRANSACTIONS_COLLECTION),
            orderBy("createdAt", "desc"),
            limit(limitCount)
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
        console.error("Error getting bank transactions:", error);
        return [];
    }
};

// ============================
// XÁC MINH GIAO DỊCH VỚI SEPAY
// ============================
export const verifyWithSePay = async (settings) => {
    if (!settings.sepayApiKey) {
        throw new Error("Chưa cấu hình SePay API Key");
    }

    try {
        // Gọi SePay API để lấy giao dịch gần đây
        const response = await fetch(
            `https://my.sepay.vn/userapi/transactions/list?account_number=${settings.accountNo}&limit=20`,
            {
                headers: {
                    "Authorization": `Bearer ${settings.sepayApiKey}`,
                    "Content-Type": "application/json"
                }
            }
        );

        if (!response.ok) {
            throw new Error(`SePay API Error: ${response.status}`);
        }

        const data = await response.json();
        return data.transactions || [];
    } catch (error) {
        console.error("SePay verify error:", error);
        throw error;
    }
};

// ============================
// XÁC MINH GIAO DỊCH VỚI CASSO
// ============================
export const verifyWithCasso = async (settings) => {
    if (!settings.cassoApiKey) {
        throw new Error("Chưa cấu hình Casso API Key");
    }

    try {
        const response = await fetch(
            `https://oauth.casso.vn/v2/transactions?page=1&pageSize=20`,
            {
                headers: {
                    "Authorization": `apikey ${settings.cassoApiKey}`,
                    "Content-Type": "application/json"
                }
            }
        );

        if (!response.ok) {
            throw new Error(`Casso API Error: ${response.status}`);
        }

        const data = await response.json();
        return data.data?.records || [];
    } catch (error) {
        console.error("Casso verify error:", error);
        throw error;
    }
};

// ============================
// KHỚP GIAO DỊCH VỚI ĐƠN HÀNG
// ============================
export const matchTransactionToOrder = async (transaction, settings) => {
    try {
        // Lấy danh sách đơn hàng đang chờ
        const q = query(
            collection(db, "orders"),
            where("status", "==", "pending")
        );
        const snap = await getDocs(q);
        const pendingOrders = snap.docs.map(d => ({ id: d.id, ...d.data() }));

        const prefix = settings.transferPrefix || "MALI";
        const description = (transaction.description || transaction.content || "").toUpperCase();

        for (const order of pendingOrders) {
            const expectedContent = `${prefix} ${order.orderCode}`.toUpperCase();
            const expectedAmount = order.amount;
            const transAmount = parseFloat(transaction.amount || transaction.transferAmount || 0);

            // Kiểm tra nội dung CK và số tiền
            const contentMatch = description.includes(expectedContent) || 
                                 description.includes(order.orderCode?.toUpperCase());
            const amountMatch = Math.abs(transAmount - expectedAmount) < 1000; // Sai số < 1000đ

            if (contentMatch && amountMatch) {
                return { matched: true, order, transaction };
            }
        }

        return { matched: false };
    } catch (error) {
        console.error("Error matching transaction:", error);
        return { matched: false };
    }
};

// ============================
// CHẠY XÁC MINH TỰ ĐỘNG
// ============================
export const runAutoVerification = async () => {
    const settings = await getBankSettings();
    
    if (!settings.autoApproveEnabled) {
        return { success: false, message: "Tính năng tự động duyệt chưa được bật" };
    }

    let transactions = [];
    let source = "";

    try {
        if (settings.autoVerifyMethod === "sepay") {
            transactions = await verifyWithSePay(settings);
            source = "SePay";
        } else if (settings.autoVerifyMethod === "casso") {
            transactions = await verifyWithCasso(settings);
            source = "Casso";
        } else {
            return { success: false, message: "Phương thức xác minh không hợp lệ" };
        }

        let approvedCount = 0;
        const results = [];

        for (const tx of transactions) {
            const matchResult = await matchTransactionToOrder(tx, settings);
            if (matchResult.matched) {
                try {
                    await approveOrder(matchResult.order.id);
                    await saveBankTransaction({
                        transactionId: tx.id || tx.transaction_id || Date.now().toString(),
                        amount: tx.amount || tx.transferAmount,
                        description: tx.description || tx.content,
                        orderId: matchResult.order.id,
                        orderCode: matchResult.order.orderCode,
                        source,
                        autoApproved: true,
                        approvedAt: new Date().toISOString()
                    });
                    approvedCount++;
                    results.push({
                        orderCode: matchResult.order.orderCode,
                        amount: matchResult.order.amount,
                        status: "approved"
                    });
                } catch (approveError) {
                    console.error("Auto approve error:", approveError);
                }
            }
        }

        return {
            success: true,
            source,
            transactionsChecked: transactions.length,
            approvedCount,
            results
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
};
