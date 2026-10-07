export const REFERRAL_RUNS_DOCUMENT = 'referral_course_runs';
export const GOAL_COURSE_ID = 'chinh-phuc-muc-tieu';
export const GOAL_COURSE_PATH = '/dao-tao/chinh-phuc-muc-tieu';
export const DEFAULT_REFERRAL_RUNS = {
  activeRunId: GOAL_COURSE_ID,
  runs: [{ id: GOAL_COURSE_ID, name: 'Chinh Phục Mục Tiêu', status: 'active', startsAt: 0 }],
};

export const leadTimestamp = value => {
  if (typeof value?.toMillis === 'function') return value.toMillis();
  if (typeof value?.seconds === 'number') return value.seconds * 1000;
  if (typeof value === 'number') return value;
  return Date.parse(value || '') || 0;
};

export function resolveReferralRun(lead, config = DEFAULT_REFERRAL_RUNS) {
  const explicitId = lead.courseId || lead.landingPageId;
  const explicitRun = config.runs.find(run => run.id === explicitId && run.id !== GOAL_COURSE_ID);
  if (explicitRun) return explicitRun.id;
  const millis = leadTimestamp(lead.createdAt);
  const run = [...config.runs].reverse().find(item =>
    millis >= item.startsAt && (!item.endsAt || millis < item.endsAt));
  return run?.id || GOAL_COURSE_ID;
}

export function finishReferralRun(config, expectedRunId, nextName, now) {
  if (config.activeRunId !== expectedRunId) throw new Error('Khóa đã được thay đổi. Vui lòng tải lại trước khi xác nhận.');
  const active = config.runs.find(run => run.id === expectedRunId);
  if (!active || active.status !== 'active') throw new Error('Khóa này đã kết thúc.');
  const name = nextName.trim();
  if (!name || name.length > 120) throw new Error('Vui lòng nhập tên đợt mới (tối đa 120 ký tự).');
  if (!Number.isFinite(now) || now <= active.startsAt) throw new Error('Mốc kết thúc không hợp lệ.');
  const id = `${GOAL_COURSE_ID}-${now}`;
  return {
    activeRunId: id,
    runs: [...config.runs.map(run => run.id === expectedRunId
      ? { ...run, status: 'ended', endsAt: now } : run),
    { id, name, status: 'active', startsAt: now }],
  };
}

export function mergeReferralLeads(history, intake, config) {
  const records = new Map(history.map(lead => [lead.id, lead]));
  for (const lead of intake) {
    const saved = records.get(lead.id);
    records.set(lead.id, { ...lead, ...saved, isIntake: true });
  }
  return [...records.values()].filter(lead =>
    lead.source === GOAL_COURSE_ID || lead.source === 'chinh_phuc_muc_tieu_web' ||
    lead.landingPageId === GOAL_COURSE_ID || String(lead.sourceUrl || '').includes(GOAL_COURSE_PATH)
  ).map(lead => ({ ...lead, source: GOAL_COURSE_ID,
    referralCode: lead.referralCode || 'cong-ty', courseId: resolveReferralRun(lead, config) }));
}
