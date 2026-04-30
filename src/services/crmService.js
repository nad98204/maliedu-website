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
        let funnelType = (formData.targetFunnel || "ads").toLowerCase();
        
        // --- CHỐT PATH CHUẨN ĐỒNG BỘ CRM ---
        if (funnelType === "leader") {
            funnelType = "leader";
        }
        
        // Đường dẫn kho: funnels/ads hoặc funnels/leader_funnel
        const nodePath = `funnels/${funnelType}`;

        // 2. Đóng gói dữ liệu đúng chuẩn CRM yêu cầu (Theo tài liệu tích hợp)
        const payload = {
            name: formData.name || "Khách hàng mới",
            phone: formData.phone,
            email: formData.email || "",

            // BẮT BUỘC: Phải có mã để CRM giải mã
            source_key: formData.source_key || "organic_web",
            status: "NEW", // Trạng thái "Mới"
            createdVia: "landing", // Bắt buộc để CRM xử lý
            createdAt: new Date().toISOString(), // Mốc thời gian chuẩn ISO

            note: formData.note || "Đăng ký từ Landing Page",

            // MAPPING UTM THEO TÀI LIỆU
            cpSource: formData.utm_source || "",
            cpMedium: formData.utm_medium || "",
            cpCampaign: formData.utm_campaign || "",
            cpContent: formData.utm_content || "",
            cpTerm: formData.utm_term || "",

            // BỔ SUNG CÁC TRƯỜNG CHO PHỄU LEADER / PHÊU ADS (TÙY CHỈNH)
            funnel_type: formData.funnel_type || "",
            targetFunnel: funnelType,
            source_type: formData.source_type || (funnelType === "leader" ? "leader_funnel" : funnelType),
            sourceUrl: formData.sourceUrl || "",
            landingPageId: formData.landingPageId || "",
            landingPageSlug: formData.landingPageSlug || "",
            referrer: formData.referrer || "",
            leaderName: formData.leaderName || "",
            leader_utm: formData.leader_utm || "",
            leaderUtm: formData.leaderUtm || formData.leader_utm || "",
            leaderSlug: formData.leaderSlug || "",
            introducedBy: formData.introducedBy || formData.referrer || "",
            is_learned_loa: formData.is_learned_loa || "",
            hasRegisteredLHD: formData.is_learned_loa === "ĐÃ HỌC LUẬT HẤP DẪN", // CRM Live dùng trường này
            funnel_channel: formData.funnel_channel || "",
            assigned_to: formData.assigned_to || "",
            assignedName: formData.assigned_to || "", // CRM Live dùng trường này
            registered_loa: formData.registered_loa || "",
            staff_in_charge: formData.staff_in_charge || "",

            // TRACKING IDs
            meta_event_id: formData.meta_event_id || "",
            lead_event_id: formData.lead_event_id || "",
            test_event_code: formData.test_event_code || "",

            // MÃ NGUỒN VÀ KHÓA K ĐỘNG
            courseName: formData.courseName || "Khơi Thông Dòng Tiền - Phễu",
            course_k: formData.course_k || "",
            batch_id: formData.batch_id || "",
            // BẮT BUỘC: batchName là field CRM dùng để lọc theo K, phải đồng bộ với course_k
            batchName: formData.course_k || formData.batch_id || ""
        };

        // 3. Ghi vào kho
        console.log("------------------------------------------");
        console.log("PAYLOAD GỬI CRM:", payload);
        console.log("------------------------------------------");

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
