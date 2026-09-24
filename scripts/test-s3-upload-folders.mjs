import test from "node:test";
import assert from "node:assert/strict";
import { createMultipartUpload } from "../functions/_lib/s3MultipartV3.js";

const env = {
  S3_REGION: "hn1",
  S3_ENDPOINT: "https://s3.example.com",
  S3_ACCESS_KEY: "test-access-key",
  S3_SECRET_KEY: "test-secret-key",
  S3_BUCKET: "test-bucket",
};

const mockS3 = (t) => {
  const requests = [];
  const previous = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    requests.push({ url: String(url), options });
    return new Response(
      "<InitiateMultipartUploadResult><UploadId>test-upload</UploadId></InitiateMultipartUploadResult>",
      { status: 200 },
    );
  };
  t.after(() => { globalThis.fetch = previous; });
  return requests;
};

for (const folder of [
  "files/course-lessons/images",
  "course-lessons/images",
  "courses/images",
]) {
  test(`allows the course image upload folder: ${folder}`, async (t) => {
    const requests = mockS3(t);
    const result = await createMultipartUpload(env, {
      folder,
      fileName: "lesson.png",
      contentType: "image/png",
      fileSize: 1024,
    });

    assert.match(result.key, new RegExp(`^${folder}/`));
    assert.equal(requests.length, 1);
    assert.equal(requests[0].options.method, "POST");
  });
}

test("still rejects an unrelated upload folder", async () => {
  await assert.rejects(
    createMultipartUpload(env, {
      folder: "private/system",
      fileName: "lesson.png",
      contentType: "image/png",
      fileSize: 1024,
    }),
    /Upload folder is not allowed/,
  );
});

test("allows lesson audio uploads in the protected files namespace", async (t) => {
  const requests = mockS3(t);
  const result = await createMultipartUpload(env, {
    folder: "files/course-lessons/audios",
    fileName: "thuc-hanh.mp3",
    contentType: "audio/mpeg",
    fileSize: 2048,
  });

  assert.match(result.key, /^files\/course-lessons\/audios\//);
  assert.equal(requests.length, 1);
});
