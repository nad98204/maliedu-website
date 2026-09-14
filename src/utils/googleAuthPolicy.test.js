import assert from "node:assert/strict";
import test from "node:test";

import { isInAppBrowserUserAgent } from "./browserDetection.js";
import { shouldRedirectGoogleSignIn } from "./googleAuthPolicy.js";

test("desktop keeps popup while iPhone and Android use redirect on same-origin helper", () => {
  const config = { hostname: "luathapdan.vn", authDomain: "luathapdan.vn" };
  assert.equal(shouldRedirectGoogleSignIn({ ...config, userAgent: "Mozilla/5.0 (Windows NT 10.0) Chrome", maxTouchPoints: 0 }), false);
  assert.equal(shouldRedirectGoogleSignIn({ ...config, userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0) Safari", maxTouchPoints: 5 }), true);
  assert.equal(shouldRedirectGoogleSignIn({ ...config, userAgent: "Mozilla/5.0 (Linux; Android 15) Chrome Mobile", maxTouchPoints: 5 }), true);
  assert.equal(shouldRedirectGoogleSignIn({ ...config, userAgent: "Mozilla/5.0 (Macintosh) Safari", maxTouchPoints: 5 }), true);
});

test("mobile does not redirect through a cross-origin Firebase helper", () => {
  assert.equal(shouldRedirectGoogleSignIn({
    userAgent: "Mozilla/5.0 (iPhone) Safari", maxTouchPoints: 5,
    hostname: "luathapdan.vn", authDomain: "maliedu-web.firebaseapp.com",
  }), false);
});

test("detects Zalo and embedded iOS WebViews while leaving Safari usable", () => {
  assert.equal(isInAppBrowserUserAgent("Mozilla/5.0 (iPhone) AppleWebKit Zalo"), true);
  assert.equal(isInAppBrowserUserAgent("Mozilla/5.0 (iPhone) AppleWebKit Mobile"), true);
  assert.equal(isInAppBrowserUserAgent("Mozilla/5.0 (iPhone) AppleWebKit Mobile Safari"), false);
});
