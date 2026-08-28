const FIREBASE_API_ORIGIN = "https://maliedu-web.web.app";

const copySafeRequestHeaders = (requestHeaders = {}) => {
  const headers = new Headers(requestHeaders);
  headers.delete("host");
  headers.delete("content-length");
  headers.set("content-type", "application/json");
  return headers;
};

export const proxyFirebaseApiPost = async (context, pathname) => {
  const payload = await context.request.json();
  const upstreamResponse = await fetch(
    new URL(pathname, FIREBASE_API_ORIGIN),
    {
      method: "POST",
      headers: copySafeRequestHeaders(context.request.headers),
      body: JSON.stringify(payload),
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
