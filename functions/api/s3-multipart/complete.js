import {
  completeMultipartUpload,
  createErrorResponse,
  createJsonResponse,
} from "../../_lib/s3MultipartV3.js";

export async function onRequestPost(context) {
  try {
    const payload = await context.request.json();
    const result = await completeMultipartUpload(context.env, payload);
    return createJsonResponse(result);
  } catch (error) {
    return createErrorResponse(error);
  }
}
