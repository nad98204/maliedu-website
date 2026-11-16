const funnelOf = value => {
  const text = String(value || '').toLowerCase();
  return text.includes('leader') ? 'leader' : /brand|thuonghieu|thuong_hieu/.test(text) ? 'brand' : /organic|web/.test(text) ? 'organic' : 'ads';
};

export const getLandingHealth = (landings, sources) => {
  const byId = {};
  for (const landing of landings) {
    const key = String(landing.active_source_key || '');
    const source = sources[key];
    const issues = [];
    const add = (code, message) => issues.push({ code, message });
    if (!/^K\d+$/i.test(landing.course_k || '')) add('batch', 'Chưa có khóa K hợp lệ');
    if (!key || key.match(/_(k\d+)$/i)?.[1].toUpperCase() !== String(landing.course_k).toUpperCase()) add('source-batch', 'Mã nguồn chưa khớp khóa K');
    if (landings.some(other => other.id !== landing.id && other.active_source_key === key)) add('duplicate', 'Mã nguồn đang dùng chung');
    if (!source) add('mapping', 'Thiếu cấu hình nhận lead');
    else {
      if (source.landingPageId && source.landingPageId !== landing.id) add('owner', 'Mã nguồn thuộc landing khác');
      if (String(source.targetK || '').toUpperCase() !== String(landing.course_k).toUpperCase()) add('target-batch', 'Khóa K ở CRM chưa khớp');
      if (funnelOf(source.targetFunnel || source.funnel_type) !== funnelOf(landing.targetFunnel || landing.funnel_type)) add('funnel', 'Phễu ở CRM chưa khớp');
    }
    byId[landing.id] = { ok: issues.length === 0, issues };
  }
  return { byId, healthy: Object.values(byId).filter(row => row.ok).length, total: landings.length };
};

export const assertRoutingBatch = (sourceKey, courseK) => {
  if (String(sourceKey).match(/_(k\d+)$/i)?.[1].toUpperCase() !== String(courseK).toUpperCase()) {
    throw Object.assign(new Error('Mã nguồn phải kết thúc bằng khóa K đang chọn.'), { status: 400, code: 'validation/source-batch' });
  }
};

export const assertExpectedRouting = (current, update) => {
  if ((update.expectedSourceKey != null && update.expectedSourceKey !== current.active_source_key) ||
      (update.expectedCourseK != null && update.expectedCourseK !== current.course_k) ||
      (update.expectedFunnel != null && funnelOf(update.expectedFunnel) !== funnelOf(current.funnel_type || current.targetFunnel))) {
    throw Object.assign(new Error('Landing vừa được thay đổi ở máy khác. Vui lòng làm mới và kiểm tra lại.'), { status: 409, code: 'conflict/landing-changed' });
  }
};
