import {
  abortMultipartUpload,
  createErrorResponse,
  createJsonResponse,
} from "../../_lib/s3Multipart.js";

export async function onRequestPost(context) {
  try {
    const payload = await context.request.json();
    const result = await abortMultipartUpload(context.env, payload);
    return createJsonResponse(result);
  } catch (error) {
    return createErrorResponse(error);
  }
}
