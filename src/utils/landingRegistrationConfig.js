export const assertLandingRegistrationConfig = (config) => {
  if (config?.is_maintenance) throw new Error('Lớp học đang tạm ngưng nhận đăng ký. Bạn vui lòng quay lại sau.');
  const source = String(config?.active_source_key || '').trim();
  const batch = String(config?.course_k || '').trim().toUpperCase();
  const funnel = String(config?.targetFunnel || config?.funnel_type || '').toLowerCase();
  if (!config?.landingPageId || !/^[a-zA-Z0-9_-]{2,100}$/.test(source) || !/^K\d+$/.test(batch) ||
      !['ads', 'ads_funnel', 'leader', 'leader_funnel', 'brand', 'brand_funnel', 'thuonghieu', 'thuonghieu_funnel'].includes(funnel) ||
      source.match(/_(k\d+)$/i)?.[1].toUpperCase() !== batch) {
    throw new Error('Chưa xác nhận được lớp học đang nhận đăng ký. Thông tin trên form được giữ lại, bạn vui lòng thử lại sau ít phút.');
  }
  return config;
};
