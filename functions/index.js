import { Buffer } from "node:buffer";
import process from "node:process";

import { onRequest } from "firebase-functions/v2/https";

import { onRequestPost as onAbort } from "./api/s3-multipart/abort.js";
import { onRequestPost as onComplete } from "./api/s3-multipart/complete.js";
import { onRequestGet as onHealth } from "./api/s3-multipart/health.js";
import { onRequestPost as onInit } from "./api/s3-multipart/init.js";
import { onRequestPost as onSignPart } from "./api/s3-multipart/sign-part.js";
import { createJsonResponse } from "./_lib/s3MultipartV3.js";

const ROUTES = new Map([
  ["GET /api/s3-multipart/health", onHealth],
  ["POST /api/s3-multipart/abort", onAbort],
  ["POST /api/s3-multipart/complete", onComplete],
  ["POST /api/s3-multipart/init", onInit],
  ["POST /api/s3-multipart/sign-part", onSignPart],
]);

const normalizeRequestPath = (request) => {
  const rawPath =
    request.path ||
    request.originalUrl ||
    request.url ||
    "/";
  const withoutQuery = rawPath.split("?")[0] || "/";
  const apiIndex = withoutQuery.indexOf("/api/");
  const normalizedPath = apiIndex >= 0
    ? withoutQuery.slice(apiIndex)
    : withoutQuery;

  return normalizedPath.replace(/\/+$/, "") || "/";
};

const getRawBodyText = (request) => {
  if (Buffer.isBuffer(request.rawBody) && request.rawBody.length > 0) {
    return request.rawBody.toString("utf8");
  }

  if (typeof request.body === "string") {
    return request.body;
  }

  if (request.body != null && typeof request.body === "object") {
    return JSON.stringify(request.body);
  }

  return "";
};

const createRequestAdapter = (request) => {
  const rawBodyText = getRawBodyText(request);

  return {
    method: request.method,
    url: `${request.protocol || "https"}://${request.get("host")}${request.originalUrl || request.url || "/"}`,
    headers: request.headers,
    json: async () => {
      if (request.body != null && typeof request.body === "object" && !Buffer.isBuffer(request.body)) {
        return request.body;
      }

      return JSON.parse(rawBodyText || "{}");
    },
    text: async () => rawBodyText,
  };
};

const sendWebResponse = async (response, expressResponse) => {
  expressResponse.status(response.status);

  response.headers.forEach((value, key) => {
    expressResponse.setHeader(key, value);
  });

  expressResponse.send(await response.text());
};

export const uploadApi = onRequest(
  {
    region: "asia-southeast1",
  },
  async (request, response) => {
    const routeKey = `${request.method.toUpperCase()} ${normalizeRequestPath(request)}`;
    const handler = ROUTES.get(routeKey);

    if (!handler) {
      return sendWebResponse(
        createJsonResponse(
          { error: `Upload route not found: ${routeKey}` },
          404,
        ),
        response,
      );
    }

    try {
      const result = await handler({
        request: createRequestAdapter(request),
        env: process.env,
      });

      return sendWebResponse(result, response);
    } catch (error) {
      return sendWebResponse(
        createJsonResponse(
          {
            error:
              error?.message ||
              "Unexpected upload API error",
          },
          error?.status || 500,
        ),
        response,
      );
    }
  },
);
