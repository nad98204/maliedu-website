import process from "node:process";

const baseUrl = String(process.env.TEST_BASE_URL || "http://localhost:5173")
  .replace(/\/+$/, "");
const idToken = String(process.env.FIREBASE_ID_TOKEN || "").trim();

if (!idToken) {
  throw new Error("Set FIREBASE_ID_TOKEN to an administrator Firebase ID token.");
}

const request = async (path, payload) => {
  const response = await fetch(`${baseUrl}/api/s3-multipart${path}`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${idToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Upload API failed (${response.status})`);
  }
  return data;
};

const upload = await request("/init", {
  contentType: "text/plain",
  fileName: "authenticated-smoke-test.txt",
  fileSize: 32,
  folder: "files/security-tests",
});

await request("/abort", {
  key: upload.key,
  uploadId: upload.uploadId,
});

console.log("Authenticated upload API smoke test passed.");
