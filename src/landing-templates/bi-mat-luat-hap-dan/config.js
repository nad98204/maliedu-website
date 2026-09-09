export const SECRET_LANDING_ID = "bi-mat-luat-hap-dan";
export const SECRET_LANDING_PATH = "/dao-tao/bi-mat-luat-hap-dan";
export const SECRET_LANDING_NAME = "Ứng dụng Luật Hấp Dẫn để Khơi Thông Dòng Tiền";

export function normalizeSecretPhone(value = "") {
  const digits = String(value).replace(/[\s().-]/g, "");
  return digits.replace(/^\+?84(?=\d{9}$)/, "0");
}

export function validateSecretContact({ name = "", phone = "" }) {
  const errors = {};
  if (name.trim().length < 2 || name.trim().length > 120) errors.name = "Vui lòng nhập họ tên từ 2 đến 120 ký tự.";
  if (!/^0[35789]\d{8}$/.test(normalizeSecretPhone(phone))) errors.phone = "Vui lòng nhập số di động Việt Nam hợp lệ (10 số).";
  return errors;
}

// Use the exact admin source mapping; never invent a K or fall back to organic_web.
export function buildSecretLead({ contact, config, url, browserData = {}, eventIds = {} }) {
  if (!config?.landingPageId || !config.active_source_key || !/^K\d+$/i.test(config.course_k || "")) {
    throw new Error("Lớp học đang được cập nhật. Bạn vui lòng thử lại sau ít phút.");
  }
  if (config.is_maintenance) throw new Error("Lớp học đang tạm ngưng nhận đăng ký. Bạn vui lòng quay lại sau.");
  if (Object.keys(validateSecretContact(contact)).length) throw new Error("Vui lòng kiểm tra lại họ tên và số điện thoại.");
  const params = new URL(url).searchParams;
  return {
    name: contact.name.trim(), phone: normalizeSecretPhone(contact.phone),
    source_key: config.active_source_key,
    course_k: config.course_k, batch_id: config.course_k,
    courseName: "Khơi Thông Dòng Tiền - Phễu",
    targetFunnel: config.targetFunnel || "ADS",
    landingPageId: config.landingPageId, landingPageSlug: SECRET_LANDING_PATH.slice(1),
    sourceUrl: url,
    note: `Đăng ký từ landing ${SECRET_LANDING_NAME}`,
    utm_source: params.get("utm_source") || "ads",
    utm_medium: params.get("utm_medium") || "landing",
    utm_campaign: params.get("utm_campaign") || config.active_source_key,
    utm_content: params.get("utm_content") || "",
    utm_term: params.get("utm_term") || "",
    fbp: browserData.fbp || "", fbc: browserData.fbc || "",
    lead_event_id: eventIds.lead || "", meta_event_id: eventIds.registration || "",
    test_event_code: params.get("test_event_code") || "",
    fbEventValue: 0, fbCurrency: "VND",
  };
}
