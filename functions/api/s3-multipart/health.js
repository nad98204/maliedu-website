import {
  createErrorResponse,
  createJsonResponse,
  validateHealthcheck,
} from "../../_lib/s3Multipart.js";

export async function onRequestGet(context) {
  try {
    const result = validateHealthcheck(context.env);
    return createJsonResponse(result);
  } catch (error) {
    return createErrorResponse(error);
  }
}
