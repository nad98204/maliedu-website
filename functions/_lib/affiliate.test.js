import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateCommissionBreakdown,
  createAffiliateHandlers,
  findAffiliateByCode,
  normalizeAffiliateCode,
  normalizeAffiliateSettings,
  normalizeCouponCode,
  processAffiliateCommission,
  resolveCoupon,
  resolveOrderAffiliate,
} from "./affiliate.js";
import { TestDb, testFieldValue as fieldValue } from "./affiliateTestDb.js";

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

test("rounding never allocates more than the payment or credits a free item", () => {
  for (let amount = 1; amount <= 4; amount += 1) {
    const result = calculateCommissionBreakdown({
      affiliate: {}, defaultCommissionPercent: 100, orderAmount: amount,
      items: [1, 1, 1, 1, 0].map((price, index) => ({ id: `c${index}`, price })),
    });
    assert.equal(result.items.reduce((sum, item) => sum + item.netAmount, 0), amount);
    assert.equal(result.items.at(-1).commissionAmount, 0);
    assert.equal(result.commissionAmount, amount);
  }
});

const affiliateFixture = (overrides = {}) => ({
  userId: "partner", name: "Test partner", email: "partner@example.test", affiliateCode: "PARTNER",
  couponCode: "PARTNER10", couponDiscountPercent: 10, status: "active",
  bankInfo: { bankName: "MB Bank", accountNumber: "0000000000", accountHolder: "TEST PARTNER" },
  stats: { balance: 500000, totalCommission: 500000, totalOrders: 1, paidAmount: 0 },
  createdAt: new Date("2026-09-01T00:00:00Z"), ...overrides,
});
const orderFixture = (overrides = {}) => ({
  userId: "buyer", userEmail: "buyer@example.test", status: "completed", affiliateId: "partner",
  affiliateCode: "PARTNER", amount: 800000, courseName: "Đơn hàng gồm 2 khóa học",
  items: [{ id: "a", name: "Course A", price: 600000 }, { id: "b", name: "Course B", price: 400000 }],
  ...overrides,
});
const setup = (order = orderFixture()) => new TestDb()
  .seed("affiliates/partner", affiliateFixture())
  .seed("courses/a", { affiliateCommissionPercent: 20 })
  .seed("courses/b", { affiliateCommissionPercent: 40 })
  .seed("orders/order1", order);
const processOrder = (db, event = orderFixture()) => processAffiliateCommission({ db, fieldValue, orderId: "order1", orderData: event });
const api = (db) => createAffiliateHandlers({
  getDb: () => db, fieldValue, createJsonResponse: (data, status = 200) => ({ data, status }),
  getClientFingerprint: () => "test-browser",
  verifyUser: async (request) => {
    if (!request.user) throw Object.assign(new Error("Unauthorized"), { status: 401 });
    return request.user;
  },
  requireAdmin: async (request) => {
    if (request.user?.uid !== "admin") throw Object.assign(new Error("Forbidden"), { status: 403 });
    return request.user;
  },
});
const request = (body = {}, userId = "partner", search = "") => ({ request: {
  url: `https://example.test/api/affiliate${search}`,
  user: userId ? { uid: userId, email: `${userId}@example.test`, name: userId } : null,
  json: async () => body,
} });

test("commission atomically credits once even for concurrent and replayed events", async () => {
  const db = setup();
  const result = await Promise.all([processOrder(db), processOrder(db), processOrder(db)]);
  assert.equal(result.filter((item) => !item.duplicate).length, 1);
  assert.equal(db.read("affiliates/partner").stats.balance, 724000);
  assert.equal(db.read("affiliates/partner").stats.totalOrders, 2);
  const commission = db.read("affiliate_commissions/order1");
  assert.equal(commission.commissionAmount, 224000);
  assert.equal(commission.commissionPercent, null);
  assert.equal(commission.courseName, "Đơn hàng gồm 2 khóa học");
  assert.equal(db.read("orders/order1").affiliateCommissionId, "order1");
});

test("legacy commissions are not credited again, even after attribution changes", async () => {
  const db = setup().seed("affiliate_commissions/oldRecord", { orderId: "order1", affiliateId: "oldPartner", commissionAmount: 100000 });
  assert.equal((await processOrder(db)).duplicate, true);
  assert.equal(db.read("affiliates/partner").stats.balance, 500000);
  assert.equal(db.read("orders/order1").affiliateCommissionId, "oldRecord");
});

test("failed transaction leaves no partial credit and can be retried safely", async () => {
  const db = setup();
  const apply = db.apply.bind(db);
  let failOnce = true;
  db.apply = (records, operation, ref, ...args) => {
    if (failOnce && ref.path === "affiliates/partner" && operation === "update") {
      failOnce = false;
      throw new Error("Simulated transient failure");
    }
    return apply(records, operation, ref, ...args);
  };
  await assert.rejects(processOrder(db), /Simulated transient failure/);
  assert.equal(db.read("affiliate_commissions/order1"), undefined);
  assert.equal(db.read("orders/order1").affiliateCommissionId, undefined);
  assert.equal(db.read("affiliates/partner").stats.balance, 500000);
  assert.equal((await processOrder(db)).commissionAmount, 224000);
  assert.equal(db.read("affiliates/partner").stats.balance, 724000);
});

test("stale events cannot credit cancelled or missing orders", async () => {
  assert.equal(await processOrder(setup(orderFixture({ status: "cancelled" }))), null);
  assert.equal(await processOrder(new TestDb()), null);
});

test("self referrals, inactive affiliates and deleted attributed profiles earn no commission", async () => {
  assert.equal(await processOrder(setup(orderFixture({ userId: "partner" }))), null);
  assert.equal(await processOrder(setup(orderFixture({ customerEmail: "PARTNER@example.test" }))), null);
  assert.equal(await processOrder(setup().seed("affiliates/partner", affiliateFixture({ status: "paused" }))), null);
  const db = setup(orderFixture({ affiliateId: "deleted", couponCode: "PARTNER10" }));
  assert.equal(await processOrder(db), null);
});

test("zero-paid orders generate no commission", async () => {
  assert.equal(await processOrder(setup(orderFixture({ amount: 0 }))), null);
});

test("new orders without attribution cannot be claimed later through a reassigned coupon", async () => {
  const db = setup(orderFixture({ affiliateAttributionVersion: 1, affiliateId: null, couponCode: "PARTNER10" }));
  assert.equal(await processOrder(db), null);
});

test("legacy affiliate coupon works, but disabled, expired or duplicate coupons do not", async () => {
  const db = setup();
  assert.equal((await resolveCoupon(db, "partner10")).discountPercent, 10);
  db.seed("coupons/coupon1", { code: "PARTNER10", discountPercent: 10, isActive: false });
  assert.equal(await resolveCoupon(db, "PARTNER10"), null);
  db.seed("coupons/coupon1", { code: "PARTNER10", discountPercent: 10, isActive: true, expiryDate: "2000-01-01" });
  assert.equal(await resolveCoupon(db, "PARTNER10"), null);
  db.seed("coupons/coupon1", { code: "PARTNER10", discountPercent: 10, isActive: true });
  db.seed("coupons/coupon2", { code: "PARTNER10", discountPercent: 20, isActive: true });
  assert.equal(await resolveCoupon(db, "PARTNER10"), null);
});

test("paused affiliate coupons and stale coupon registries fail closed", async () => {
  const db = setup()
    .seed("coupons/affiliate_partner", { code: "PARTNER10", affiliateId: "partner", isActive: true, discountPercent: 10 })
    .seed("affiliates/partner", affiliateFixture({ status: "paused" }));
  assert.equal(await resolveCoupon(db, "PARTNER10"), null);
  db.seed("affiliates/partner", affiliateFixture({ couponCode: "NEWCODE" }))
    .seed("affiliate_coupon_codes/PARTNER10", { affiliateId: "partner" });
  assert.equal(await resolveCoupon(db, "PARTNER10"), null);
});

test("ambiguous legacy referral codes do not silently select a payee", async () => {
  const db = setup().seed("affiliates/other", affiliateFixture({ userId: "other" }));
  await assert.rejects(findAffiliateByCode(db, "PARTNER"), { status: 409 });
});

test("coupon attribution wins over link; self referral is blocked", async () => {
  const db = setup().seed("affiliates/other", affiliateFixture({ userId: "other", affiliateCode: "OTHER" }));
  const coupon = { affiliateId: "partner" };
  const result = await resolveOrderAffiliate({ db, coupon, affiliateCode: "OTHER", userId: "buyer" });
  assert.equal(result.affiliateId, "partner");
  assert.equal(result.attributionType, "coupon");
  assert.equal(await resolveOrderAffiliate({ db, coupon, userId: "partner" }), null);
});

test("authentication is required for private data, mutation and every admin endpoint", async () => {
  const handlers = api(setup());
  await assert.rejects(handlers.publicGet(request({}, null, "?view=profile")), { status: 401 });
  await assert.rejects(handlers.publicPost(request({ action: "request-payout", amount: 200000 }, null)), { status: 401 });
  await assert.rejects(handlers.adminGet(request({}, "partner", "?view=affiliates")), { status: 403 });
  await assert.rejects(handlers.adminPost(request({ action: "save-settings" }, "partner")), { status: 403 });
});

test("profile and history queries ignore client-supplied identity", async () => {
  const handlers = api(setup().seed("affiliate_commissions/private", {
    affiliateId: "someoneElse", createdAt: new Date(), commissionAmount: 999,
  }));
  const result = await handlers.publicGet(request({}, "partner", "?view=profile&userId=someoneElse"));
  assert.equal(result.data.userId, "partner");
  assert.deepEqual((await handlers.publicGet(request({}, "partner", "?view=commissions&userId=someoneElse"))).data, []);
});

test("registration creates the coupon and reserves unique referral codes without resetting an old balance", async () => {
  const db = new TestDb();
  const handlers = api(db);
  const body = { action: "register", affiliateCode: "NEWPARTNER", bankInfo: affiliateFixture().bankInfo };
  assert.equal((await handlers.publicPost(request(body))).status, 201);
  assert.equal(db.read("coupons/affiliate_partner").isActive, true);
  assert.equal(db.read("affiliate_codes/NEWPARTNER").affiliateId, "partner");
  db.seed("affiliates/partner", affiliateFixture({ stats: { balance: 123456 } }));
  await assert.rejects(handlers.publicPost(request(body)), { status: 409 });
  assert.equal(db.read("affiliates/partner").stats.balance, 123456);
});

test("registration rejects an existing legacy affiliate coupon and concurrent duplicate code claims", async () => {
  const db = setup();
  const handlers = api(db);
  const body = { action: "register", affiliateCode: "PARTNER", bankInfo: affiliateFixture().bankInfo };
  await assert.rejects(handlers.publicPost(request(body, "newUser")), { status: 409 });
  const concurrent = await Promise.allSettled(["one", "two"].map((id) => handlers.publicPost(request({ ...body, affiliateCode: "UNIQUE" }, id))));
  assert.equal(concurrent.filter((item) => item.status === "fulfilled").length, 1);
});

test("admin pause really disables coupon; zero percent is preserved and old coupon is released", async () => {
  const db = setup().seed("affiliate_coupon_codes/PARTNER10", { affiliateId: "partner" });
  const handlers = api(db);
  await handlers.adminPost(request({ action: "update-affiliate", affiliateId: "partner", updateData: {
    couponCode: "NEWCODE", couponDiscountPercent: 0, customCommissionPercent: 0, status: "paused",
  } }, "admin"));
  assert.equal(db.read("affiliates/partner").status, "paused");
  assert.equal(db.read("coupons/affiliate_partner").isActive, false);
  assert.equal(db.read("coupons/affiliate_partner").discountPercent, 0);
  assert.equal(db.read("affiliate_coupon_codes/PARTNER10"), undefined);
  assert.equal(await resolveCoupon(db, "NEWCODE"), null);
});

test("payout validates whole currency units and uses trusted bank data", async () => {
  const db = setup();
  const handlers = api(db);
  await assert.rejects(handlers.publicPost(request({ action: "request-payout", amount: 200000.5 })), { status: 400 });
  await assert.rejects(handlers.publicPost(request({ action: "request-payout", amount: 1000 })), { status: 400 });
  const result = await handlers.publicPost(request({ action: "request-payout", amount: 200000, userId: "other", bankInfo: { accountNumber: "fake" } }));
  const payout = db.read(`affiliate_payouts/${result.data.id}`);
  assert.equal(payout.affiliateId, "partner");
  assert.deepEqual(payout.bankInfo, affiliateFixture().bankInfo);
  assert.equal(db.read("affiliates/partner").stats.balance, 300000);
});

test("concurrent payout requests cannot overdraw; a rejected payout refunds once only", async () => {
  const db = setup();
  const handlers = api(db);
  const results = await Promise.allSettled([1, 2].map(() => handlers.publicPost(request({ action: "request-payout", amount: 400000 }))));
  assert.equal(results.filter((item) => item.status === "fulfilled").length, 1);
  assert.equal(db.read("affiliates/partner").stats.balance, 100000);
  const payoutId = results.find((item) => item.status === "fulfilled").value.data.id;
  const action = request({ action: "process-payout", payoutId, status: "rejected" }, "admin");
  await handlers.adminPost(action);
  await assert.rejects(handlers.adminPost(action), { status: 409 });
  assert.equal(db.read("affiliates/partner").stats.balance, 500000);
});

test("approved payout cannot be approved or refunded twice", async () => {
  const db = setup();
  const handlers = api(db);
  const payoutId = (await handlers.publicPost(request({ action: "request-payout", amount: 200000 }))).data.id;
  await handlers.adminPost(request({ action: "process-payout", payoutId, status: "completed" }, "admin"));
  await assert.rejects(handlers.adminPost(request({ action: "process-payout", payoutId, status: "rejected" }, "admin")), { status: 409 });
  assert.equal(db.read("affiliates/partner").stats.paidAmount, 200000);
  assert.equal(db.read("affiliates/partner").stats.balance, 300000);
});

test("click retries are deduplicated without exposing affiliate data", async () => {
  const db = setup();
  const handlers = api(db);
  const payload = request({ action: "click", affiliateCode: "PARTNER" }, null);
  assert.equal((await handlers.publicPost(payload)).data.recorded, true);
  assert.equal((await handlers.publicPost(payload)).data.recorded, false);
  assert.equal(db.read("affiliates/partner").stats.totalClicks, 1);
});

test("admin pagination does not silently lose entries beyond the first 100", async () => {
  const db = new TestDb();
  for (let index = 0; index < 105; index += 1) db.seed(`affiliates/member${index}`, affiliateFixture({ userId: `member${index}` }));
  const handlers = api(db);
  const first = (await handlers.adminGet(request({}, "admin", "?view=affiliates&paginated=1"))).data;
  const second = (await handlers.adminGet(request({}, "admin", `?view=affiliates&paginated=1&cursor=${first.nextCursor}`))).data;
  assert.equal(first.items.length, 100);
  assert.equal(second.items.length, 5);
  assert.equal(second.nextCursor, null);
  assert.equal(new Set([...first.items, ...second.items].map((item) => item.id)).size, 105);
});
