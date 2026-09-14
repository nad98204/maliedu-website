import assert from "node:assert/strict";
import test from "node:test";

import { proxyFirebaseAuthRequest } from "./firebaseAuthProxy.js";

test("serves Firebase OAuth helpers through the app origin without redirecting the browser", async () => {
  let forwarded;
  const request = new Request("https://luathapdan.vn/__/auth/handler?state=abc", {
    headers: { host: "luathapdan.vn", accept: "text/html" },
  });
  const response = await proxyFirebaseAuthRequest(request, async (url, options) => {
    forwarded = { url: String(url), options };
    return new Response("helper", { status: 200, headers: { "content-type": "text/html" } });
  });
  assert.equal(forwarded.url, "https://maliedu-web.firebaseapp.com/__/auth/handler?state=abc");
  assert.equal(forwarded.options.redirect, "manual");
  assert.equal(forwarded.options.headers.has("host"), false);
  assert.equal(response.status, 200);
  assert.equal(await response.text(), "helper");
  assert.equal(response.headers.get("cache-control"), "no-store");
});

test("forwards Firebase OAuth POST callback body", async () => {
  let body;
  const request = new Request("https://luathapdan.vn/__/auth/handler", {
    method: "POST", body: "code=test-code",
  });
  const response = await proxyFirebaseAuthRequest(request, async (_url, options) => {
    body = await new Response(options.body).text();
    return new Response("ok");
  });
  assert.equal(body, "code=test-code");
  assert.equal(response.status, 200);
});

test("never proxies unrelated paths or methods", async () => {
  const unexpectedFetch = () => { throw new Error("Unexpected upstream request"); };
  assert.equal((await proxyFirebaseAuthRequest(new Request("https://luathapdan.vn/api/orders"), unexpectedFetch)).status, 404);
  assert.equal((await proxyFirebaseAuthRequest(new Request("https://luathapdan.vn/__/auth/handler", { method: "PUT" }), unexpectedFetch)).status, 404);
});
