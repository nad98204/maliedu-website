import {
  createErrorResponse,
  createJsonResponse,
  createMultipartUpload,
} from "../../_lib/s3Multipart.js";

export async function onRequestPost(context) {
  try {
    const payload = await context.request.json();
    const result = await createMultipartUpload(context.env, payload);
    return createJsonResponse(result);
  } catch (error) {
    return createErrorResponse(error);
  }
}
