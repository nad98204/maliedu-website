import test from "node:test";
import assert from "node:assert/strict";
import { onRequestPost } from "../functions/api/bunny-storage/upload.js";

const projectId = "demo-image-upload";
const token = `header.${Buffer.from(JSON.stringify({
  sub: "test-admin", aud: projectId,
  iss: `https://securetoken.google.com/${projectId}`,
  exp: Math.floor(Date.now() / 1000) + 3600,
  email: "admin@example.com", email_verified: true,
})).toString("base64url")}.signature`;
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWZkAAAAASUVORK5CYII=", "base64");

const makeContext = (overrides = {}) => {
  const body = new FormData();
  body.append("file", new File([png], "avatar.png", { type: "image/png" }));
  return {
    request: new Request("https://local.example/api/bunny-storage/upload", {
      method: "POST", headers: { Authorization: `Bearer ${token}` }, body,
    }),
    env: {
      FIREBASE_PROJECT_ID: projectId,
      BUNNY_STORAGE_ZONE_NAME: "test-images",
      BUNNY_STORAGE_ACCESS_KEY: "test-server-only-key",
      BUNNY_PULL_ZONE_HOSTNAME: "https://test-images.b-cdn.net",
      ...overrides,
    },
  };
};

const mockFetch = (t, modules, role = "admin") => {
  const requests = [];
  const previous = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    if (String(url).startsWith("https://firestore.googleapis.com/")) {
      return Response.json({ fields: {
        role: { stringValue: role },
        allowedModules: { arrayValue: { values: modules.map((item) => ({ stringValue: item })) } },
      } });
    }
    assert.match(String(url), /^https:\/\/storage\.bunnycdn\.com\/test-images\/courses\/images\//);
    requests.push({ url: String(url), options });
    return new Response("", { status: 201 });
  };
  t.after(() => { globalThis.fetch = previous; });
  return requests;
};

for (const modules of [["instructors"], ["courses"], []]) {
  test(`allows authenticated admins with image-management modules: ${modules.join(",") || "unrestricted"}`, async (t) => {
    const uploads = mockFetch(t, modules);
    const response = await onRequestPost(makeContext());
    assert.equal(response.status, 200);
    const data = await response.json();
    assert.equal(data.success, true);
    assert.match(data.url, /^https:\/\/test-images\.b-cdn\.net\/courses\/images\/.*\.png$/);
    assert.equal(uploads.length, 1);
    assert.equal(uploads[0].options.method, "PUT");
    assert.equal(uploads[0].options.headers.AccessKey, "test-server-only-key");
    assert.equal(JSON.stringify(data).includes("test-server-only-key"), false);
  });
}

test("rejects admins without course/instructor permissions before touching Bunny", async (t) => {
  const uploads = mockFetch(t, ["sales"]);
  assert.equal((await onRequestPost(makeContext())).status, 403);
  assert.equal(uploads.length, 0);
});

test("a module name does not grant upload access to a non-admin", async (t) => {
  const uploads = mockFetch(t, ["instructors"], "student");
  assert.equal((await onRequestPost(makeContext())).status, 403);
  assert.equal(uploads.length, 0);
});

test("rejects an unauthenticated request without calling external services", async (t) => {
  t.mock.method(globalThis, "fetch", () => { throw new Error("Must not fetch"); });
  const context = makeContext();
  context.request.headers.delete("Authorization");
  assert.equal((await onRequestPost(context)).status, 401);
});

test("missing storage configuration reports setting names without exposing secrets", async (t) => {
  const uploads = mockFetch(t, ["instructors"]);
  const response = await onRequestPost(makeContext({ BUNNY_STORAGE_ZONE_NAME: "" }));
  assert.equal(response.status, 503);
  const data = await response.json();
  assert.match(data.message, /BUNNY_STORAGE_ZONE_NAME/);
  assert.equal(JSON.stringify(data).includes("test-server-only-key"), false);
  assert.equal(uploads.length, 0);
});
