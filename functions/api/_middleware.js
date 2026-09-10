const FIREBASE_API_ORIGIN = "https://maliedu-web.web.app";
const MAX_API_BODY_BYTES = 2 * 1024 * 1024;

const createHttpError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const createUpstreamRequest = async (request) => {
  const incomingUrl = new URL(request.url);
  const upstreamUrl = new URL(
    `${incomingUrl.pathname}${incomingUrl.search}`,
    FIREBASE_API_ORIGIN,
  );
  const headers = new Headers(request.headers);
  const clientIp = headers.get("CF-Connecting-IP");
  const declaredLength = Number(headers.get("Content-Length"));

  if (
    Number.isFinite(declaredLength) &&
    declaredLength > MAX_API_BODY_BYTES
  ) {
    throw createHttpError(413, "Request body is too large");
  }

  const body =
    request.method === "GET" || request.method === "HEAD"
      ? undefined
      : await request.arrayBuffer();
  if (body && body.byteLength > MAX_API_BODY_BYTES) {
    throw createHttpError(413, "Request body is too large");
  }

  headers.delete("CF-Connecting-IP");
  headers.delete("CF-IPCountry");
  headers.delete("CF-Ray");
  headers.delete("CF-Visitor");
  headers.delete("Host");
  headers.delete("X-Forwarded-For");
  headers.delete("X-Forwarded-Host");
  headers.delete("X-Forwarded-Proto");
  if (clientIp) {
    headers.set("X-Forwarded-For", clientIp);
  }
  headers.set("X-Forwarded-Host", incomingUrl.host);
  headers.set("X-Forwarded-Proto", "https");

  return new Request(upstreamUrl, {
    method: request.method,
    headers,
    body,
    redirect: "manual",
  });
};

export async function onRequest(context) {
  // Intake and its authenticated admin API run in the private Cloudflare service.
  const path = new URL(context.request.url).pathname.replace(/\/+$/, "");
  const intakeMethods = {
    "/api/crm-leads": "POST",
    "/api/admin/lead-intake": "GET",
    "/api/admin/lead-intake/retry": "POST",
  };
  if (Object.hasOwn(intakeMethods, path)) {
    if (context.request.method !== intakeMethods[path]) {
      return Response.json({ error: "Method not allowed" }, {
        status: 405,
        headers: { Allow: intakeMethods[path], "Cache-Control": "no-store" },
      });
    }
    return context.next();
  }

  try {
    const response = await fetch(
      await createUpstreamRequest(context.request),
    );
    const headers = new Headers(response.headers);

    headers.delete("Alt-Svc");
    headers.delete("Server");
    headers.set("Referrer-Policy", "no-referrer");
    headers.set("X-Content-Type-Options", "nosniff");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  } catch (error) {
    const status = Number(error?.status) || 502;
    return Response.json(
      {
        error:
          status >= 500
            ? "Service is temporarily unavailable"
            : error?.message || "Request failed",
      },
      {
        status,
        headers: {
          "Cache-Control": "no-store",
          "Referrer-Policy": "no-referrer",
          "X-Content-Type-Options": "nosniff",
        },
      },
    );
  }
}
