const FIREBASE_API_ORIGIN = "https://maliedu-web.web.app";

const copySafeRequestHeaders = (requestHeaders = {}) => {
  const headers = new Headers(requestHeaders);
  headers.delete("host");
  headers.delete("content-length");
  headers.set("content-type", "application/json");
  return headers;
};

export const proxyFirebaseApiRequest = async (context, pathname) => {
  const incomingUrl = new URL(context.request.url);
  const upstreamUrl = new URL(pathname, FIREBASE_API_ORIGIN);
  upstreamUrl.search = incomingUrl.search;
  const method = String(context.request.method || "GET").toUpperCase();
  const hasBody = !["GET", "HEAD"].includes(method);
  const payload = hasBody ? await context.request.text() : undefined;
  const upstreamResponse = await fetch(
    upstreamUrl,
    {
      method,
      headers: copySafeRequestHeaders(context.request.headers),
      body: payload,
      redirect: "manual",
    },
  );

  const headers = new Headers(upstreamResponse.headers);
  headers.delete("alt-svc");
  headers.delete("server");
  headers.set("cache-control", "no-store");

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers,
  });
};

export const proxyFirebaseApiPost = async (context, pathname) =>
  proxyFirebaseApiRequest(context, pathname);
