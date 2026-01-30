// src/services/crmService.js
import { crmRealtimeDB } from '../firebase'; // Lấy cái công cụ vừa tạo ở Bước 1
import { ref, push, set } from 'firebase/database'; // Hàm của Realtime DB

/**
 * Hàm bắn data sang Firebase CRM (Secondary App - Realtime Database)
 */
export const submitToCRM = async (formData) => {
    try {
        console.log("Đang gửi dữ liệu về CRM (Realtime DB)...", formData);

        // 1. Xác định bắn vào phễu nào (Mặc định là ADS)
        const funnelType = (formData.targetFunnel || "ads").toLowerCase();
        // Đường dẫn kho: funnels/ads
        const nodePath = `funnels/${funnelType}`;

        // 2. Đóng gói dữ liệu đúng chuẩn CRM yêu cầu (Theo tài liệu tích hợp)
        const payload = {
            name: formData.name || "Khách hàng mới",
            phone: formData.phone,
            email: formData.email || "",

            // BẮT BUỘC: Phải có mã để CRM giải mã
            source_key: formData.source_key || "organic_web",
            status: "NEW", // Trạng thái "Mới"

            note: formData.note || "Đăng ký từ Landing Page",

            // MAPPING UTM THEO TÀI LIỆU
            cpSource: formData.utm_source || "",
            cpMedium: formData.utm_medium || "",
            cpCampaign: formData.utm_campaign || "",
            cpContent: formData.utm_content || "",
            cpTerm: formData.utm_term || "",

            createdAt: Date.now()
        };

        // 3. Ghi vào kho
        const funnelRef = ref(crmRealtimeDB, nodePath);
        const newLeadRef = push(funnelRef); // Tạo phiếu mới
        await set(newLeadRef, payload);     // Điền thông tin vào

        console.log("Đã gửi xong! ID:", newLeadRef.key);
        return { success: true, id: newLeadRef.key };

    } catch (error) {
        console.error("Lỗi gửi CRM:", error);
        throw error;
    }
};
