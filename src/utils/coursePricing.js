export const ACCESS_PLAN_TYPES = {
  DURATION: "duration",
  LIFETIME: "lifetime",
};

export const ACCESS_DURATION_UNITS = {
  DAYS: "days",
  MONTHS: "months",
  YEARS: "years",
};

const ALLOWED_DURATION_UNITS = new Set(Object.values(ACCESS_DURATION_UNITS));

const normalizeMoney = (value, fallback = null) => {
  if (value === "" || value === null || value === undefined) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed) : fallback;
};

const normalizePlanId = (value, index = 0) => {
  const normalized = String(value || "")
    .trim()
    .replace(/[^A-Za-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
  return normalized || `access-plan-${index + 1}`;
};

export const formatAccessDuration = (plan) => {
  if (!plan || plan.accessType !== ACCESS_PLAN_TYPES.DURATION) return "Vĩnh viễn";

  const value = Math.max(1, Math.round(Number(plan.durationValue) || 1));
  if (plan.durationUnit === ACCESS_DURATION_UNITS.DAYS) return `${value} ngày`;
  if (plan.durationUnit === ACCESS_DURATION_UNITS.YEARS) return `${value} năm`;
  return `${value} tháng`;
};

export const normalizeCourseAccessPlan = (plan = {}, index = 0) => {
  const accessType = plan.accessType === ACCESS_PLAN_TYPES.LIFETIME
    ? ACCESS_PLAN_TYPES.LIFETIME
    : ACCESS_PLAN_TYPES.DURATION;
  const durationUnit = ALLOWED_DURATION_UNITS.has(plan.durationUnit)
    ? plan.durationUnit
    : ACCESS_DURATION_UNITS.MONTHS;
  const durationValue = accessType === ACCESS_PLAN_TYPES.LIFETIME
    ? null
    : Math.max(1, Math.min(1200, Math.round(Number(plan.durationValue) || 1)));
  const price = normalizeMoney(plan.price, 0);
  const salePrice = normalizeMoney(plan.salePrice, null);
  const normalized = {
    id: normalizePlanId(plan.id, index),
    name: String(plan.name || "").trim() || formatAccessDuration({
      accessType,
      durationUnit,
      durationValue,
    }),
    accessType,
    durationValue,
    durationUnit: accessType === ACCESS_PLAN_TYPES.LIFETIME ? null : durationUnit,
    price,
    salePrice: salePrice !== null && salePrice < price ? salePrice : null,
    isActive: plan.isActive !== false,
    isRecommended: Boolean(plan.isRecommended),
    sortOrder: Number.isFinite(Number(plan.sortOrder)) ? Number(plan.sortOrder) : index,
  };

  return normalized;
};

export const normalizeCourseAccessPlans = (plans = []) =>
  (Array.isArray(plans) ? plans : [])
    .map(normalizeCourseAccessPlan)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((plan, index) => ({ ...plan, sortOrder: index }));

export const getPlanEffectivePrice = (plan) => {
  if (!plan) return 0;
  return plan.salePrice !== null && plan.salePrice !== undefined
    ? Number(plan.salePrice)
    : Number(plan.price || 0);
};

export const getLegacyLifetimePlan = (course = {}) =>
  normalizeCourseAccessPlan({
    id: "legacy-lifetime",
    name: "Truy cập vĩnh viễn",
    accessType: ACCESS_PLAN_TYPES.LIFETIME,
    price: course.price || 0,
    salePrice: course.salePrice,
    isActive: true,
    isRecommended: true,
  });

export const getActiveCourseAccessPlans = (course = {}) => {
  const configuredPlans = course.accessPlansEnabled === true
    ? normalizeCourseAccessPlans(course.accessPlans).filter((plan) => plan.isActive)
    : [];

  return configuredPlans.length > 0 ? configuredPlans : [getLegacyLifetimePlan(course)];
};

export const getDefaultCourseAccessPlan = (course = {}) => {
  const plans = getActiveCourseAccessPlans(course);
  return plans.find((plan) => plan.id === course.defaultAccessPlanId)
    || plans.find((plan) => plan.isRecommended)
    || plans[0];
};

export const getCourseAccessPlanById = (course = {}, planId = "") => {
  const plans = getActiveCourseAccessPlans(course);
  return plans.find((plan) => plan.id === planId) || getDefaultCourseAccessPlan(course);
};

export const getCourseStartingPlan = (course = {}) =>
  getActiveCourseAccessPlans(course).reduce((lowest, plan) => (
    !lowest || getPlanEffectivePrice(plan) < getPlanEffectivePrice(lowest) ? plan : lowest
  ), null);

export const calculateAccessExpiryDate = (plan, fromDate = new Date()) => {
  if (!plan || plan.accessType !== ACCESS_PLAN_TYPES.DURATION) return null;

  const result = new Date(fromDate);
  const value = Math.max(1, Math.round(Number(plan.durationValue) || 1));
  if (plan.durationUnit === ACCESS_DURATION_UNITS.DAYS) {
    result.setUTCDate(result.getUTCDate() + value);
  } else if (plan.durationUnit === ACCESS_DURATION_UNITS.YEARS) {
    const originalMonth = result.getUTCMonth();
    result.setUTCDate(1);
    result.setUTCFullYear(result.getUTCFullYear() + value);
    const lastDay = new Date(Date.UTC(result.getUTCFullYear(), originalMonth + 1, 0)).getUTCDate();
    result.setUTCMonth(originalMonth, Math.min(fromDate.getUTCDate(), lastDay));
  } else {
    const originalDay = result.getUTCDate();
    result.setUTCDate(1);
    result.setUTCMonth(result.getUTCMonth() + value);
    const lastDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
    result.setUTCDate(Math.min(originalDay, lastDay));
  }
  return result;
};

export const toDateValue = (value) => {
  if (!value) return null;
  const resolved = value?.toDate?.() || (value?.seconds ? new Date(value.seconds * 1000) : new Date(value));
  return resolved instanceof Date && Number.isFinite(resolved.getTime()) ? resolved : null;
};

export const isAccessExpired = (access, now = new Date()) => {
  if (!access || access.status !== "active") return false;
  const expiry = toDateValue(access.expiresAt);
  return Boolean(expiry && expiry.getTime() <= now.getTime());
};
