import {
  createErrorResponse,
  createJsonResponse,
  validateHealthcheck,
} from "../../_lib/s3MultipartV3.js";

export async function onRequestGet(context) {
  try {
    const result = validateHealthcheck(context.env);
    return createJsonResponse(result);
  } catch (error) {
    return createErrorResponse(error);
  }
}
