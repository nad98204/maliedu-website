// src/services/crmService.js
const CRM_LEAD_API_PATH = "/api/crm-leads";

const isLocalhost = () => {
    if (typeof window === "undefined") return false;
    return ["localhost", "127.0.0.1", ""].includes(window.location.hostname);
};

const shouldFallbackToDirectWrite = (error) =>
    isLocalhost() || [404, 405, 501].includes(error?.status);

const submitLeadViaApi = async ({ nodePath, payload }) => {
    const response = await fetch(CRM_LEAD_API_PATH, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ nodePath, payload }),
    });

    let data = null;
    try {
        data = await response.json();
    } catch {
        /* response may be empty or non-json */
    }

    if (!response.ok || !data?.success) {
        const error = new Error(data?.error || `CRM API error (${response.status})`);
        error.status = response.status;
        throw error;
    }

    return data;
};

const submitLeadDirectly = async ({ nodePath, payload }) => {
    const [{ crmRealtimeDB }, { ref, push, set }] = await Promise.all([
        import('../firebase'),
        import('firebase/database'),
    ]);

    const funnelRef = ref(crmRealtimeDB, nodePath);
    const newLeadRef = push(funnelRef);
    await set(newLeadRef, payload);

    return { success: true, id: newLeadRef.key };
};

/**
 * Hàm bắn data sang Firebase CRM (Secondary App - Realtime Database)
 */
export const submitToCRM = async (formData) => {
    try {
        console.log("Đang gửi dữ liệu về CRM (Realtime DB)...", formData);

        // 1. Xác định bắn vào phễu nào (Mặc định là ADS)
        let funnelType = (formData.targetFunnel || "ads").toLowerCase();
        
        // --- CHỐT PATH CHUẨN ĐỒNG BỘ CRM ---
        if (funnelType === "leader" || funnelType === "leader_funnel") {
            funnelType = "leader";
        } else if (funnelType === "thuonghieu" || funnelType === "thuonghieu_funnel" || funnelType === "brand" || funnelType === "brand_funnel") {
            funnelType = "thuonghieu";
        } else if (funnelType === "ads_funnel") {
            funnelType = "ads";
        }
        
        // Đường dẫn kho: funnels/ads hoặc funnels/leader
        const nodePath = `funnels/${funnelType}`;

        const resolvedNoteRaw = formData.note != null ? String(formData.note).trim() : "";
        const resolvedNote =
            resolvedNoteRaw ||
            (formData.ghiChu != null ? String(formData.ghiChu).trim() : "") ||
            "Đăng ký từ Landing Page";

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

            // Ghi chú: một số bản CRM đọc note, một số chỉ đọc ghiChu / customerNote
            note: resolvedNote,
            ghiChu: resolvedNote,
            ghi_chu: resolvedNote,
            customerNote: resolvedNote,
            remarks: resolvedNote,

            // MAPPING UTM THEO TÀI LIỆU
            cpSource: formData.utm_source || "",
            cpMedium: formData.utm_medium || "",
            cpCampaign: formData.utm_campaign || "",
            cpContent: formData.utm_content || "",
            cpTerm: formData.utm_term || "",
            utm_owner: formData.utm_owner || formData.utm_content || "",
            utm_owner_slug: formData.utm_owner_slug || formData.leader_utm || "",

            // BỔ SUNG CÁC TRƯỜNG CHO PHỄU LEADER / PHÊU ADS (TÙY CHỈNH)
            funnel_type: formData.funnel_type || "",
            targetFunnel: funnelType,
            source_type: formData.source_type || (funnelType === "leader" ? "leader_funnel" : funnelType === "thuonghieu" ? "thuonghieu_funnel" : funnelType),
            sourceUrl: formData.sourceUrl || "",
            landingPageId: formData.landingPageId || "",
            landingPageSlug: formData.landingPageSlug || "",
            referrer: formData.referrer || "",
            referrer_type: formData.referrer_type || "",
            other_referrer_name: formData.other_referrer_name || "",
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
            fbp: formData.fbp || "",
            fbc: formData.fbc || "",
            fbEventValue: formData.fbEventValue || 0,
            fbCurrency: formData.fbCurrency || "VND",
            userAgent: formData.userAgent || "",
            clientIp: formData.clientIp || "",

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

        let result;
        try {
            result = await submitLeadViaApi({ nodePath, payload });
        } catch (apiError) {
            if (!shouldFallbackToDirectWrite(apiError)) {
                throw apiError;
            }

            console.warn("CRM API unavailable, falling back to direct RTDB write.", apiError);
            result = await submitLeadDirectly({ nodePath, payload });
        }

        console.log("Đã gửi xong! ID:", result.id);
        return result;

    } catch (error) {
        console.error("Lỗi gửi CRM:", error);
        throw new Error("Không thể gửi đăng ký về CRM. Vui lòng thử lại sau.");
    }
};
