import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateCommissionBreakdown,
  normalizeAffiliateCode,
  normalizeAffiliateSettings,
  normalizeCouponCode,
} from "./affiliate.js";

test("normalizes and rejects unsafe affiliate identifiers", () => {
  assert.equal(normalizeAffiliateCode("  mong_01 "), "MONG_01");
  assert.equal(normalizeAffiliateCode("ab"), "");
  assert.equal(normalizeAffiliateCode("mã-có-dấu"), "");
  assert.equal(normalizeCouponCode(" mong_0110 "), "MONG_0110");
  assert.equal(normalizeCouponCode("x"), "");
});

test("clamps financial settings to safe ranges", () => {
  assert.deepEqual(normalizeAffiliateSettings({
    autoApproveAffiliate: false,
    cookieDurationDays: 99999,
    defaultCommissionPercent: 150,
    minPayoutAmount: -1,
    payoutTerms: " Điều khoản ",
  }), {
    autoApproveAffiliate: false,
    cookieDurationDays: 3650,
    defaultCommissionPercent: 100,
    minPayoutAmount: 50000,
    payoutTerms: "Điều khoản",
  });
});

test("calculates each cart course with its own rate after discount", () => {
  const result = calculateCommissionBreakdown({
    affiliate: { customCommissionPercent: null },
    courseRates: { courseA: 20, courseB: 40 },
    defaultCommissionPercent: 30,
    items: [
      { id: "courseA", name: "A", price: 600000 },
      { id: "courseB", name: "B", price: 400000 },
    ],
    orderAmount: 800000,
  });

  assert.equal(result.items[0].netAmount, 480000);
  assert.equal(result.items[0].commissionAmount, 96000);
  assert.equal(result.items[1].netAmount, 320000);
  assert.equal(result.items[1].commissionAmount, 128000);
  assert.equal(result.commissionAmount, 224000);
});

test("affiliate custom rate overrides every course rate", () => {
  const result = calculateCommissionBreakdown({
    affiliate: { customCommissionPercent: 50 },
    courseRates: { courseA: 10, courseB: 20 },
    defaultCommissionPercent: 30,
    items: [
      { id: "courseA", price: 500001 },
      { id: "courseB", price: 499999 },
    ],
    orderAmount: 799999,
  });

  assert.equal(result.items.reduce((sum, item) => sum + item.netAmount, 0), 799999);
  assert.equal(result.commissionAmount, 400000);
});
