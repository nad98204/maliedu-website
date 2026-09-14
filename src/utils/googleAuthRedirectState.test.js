import assert from "node:assert/strict";
import test from "node:test";

import {
  clearPendingGoogleRedirectIntent,
  getPendingGoogleRedirectIntent,
  setPendingGoogleRedirectIntent,
} from "./googleAuthRedirectState.js";

test("keeps the Google return destination only for the current browser tab", () => {
  const previousWindow = globalThis.window;
  const values = new Map();
  globalThis.window = {
    sessionStorage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
      removeItem: (key) => values.delete(key),
    },
  };
  try {
    setPendingGoogleRedirectIntent("admin");
    assert.equal(getPendingGoogleRedirectIntent(), "admin");
    clearPendingGoogleRedirectIntent();
    assert.equal(getPendingGoogleRedirectIntent(), null);
    assert.throws(() => setPendingGoogleRedirectIntent("unknown"));
  } finally {
    globalThis.window = previousWindow;
  }
});
