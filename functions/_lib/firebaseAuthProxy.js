const FIREBASE_AUTH_ORIGIN = "https://maliedu-web.firebaseapp.com";

export const proxyFirebaseAuthRequest = async (request, fetchUpstream = fetch) => {
  const incomingUrl = new URL(request.url);
  const method = request.method.toUpperCase();
  if (!incomingUrl.pathname.startsWith("/__/auth/") || !["GET", "POST"].includes(method)) {
    return new Response("Not found", { status: 404 });
  }

  const upstreamUrl = new URL(`${incomingUrl.pathname}${incomingUrl.search}`, FIREBASE_AUTH_ORIGIN);
  if (!upstreamUrl.pathname.startsWith("/__/auth/")) {
    return new Response("Not found", { status: 404 });
  }

  const headers = new Headers(request.headers);
  for (const name of ["host", "content-length", "cf-connecting-ip", "cf-ipcountry", "cf-ray", "cf-visitor"]) {
    headers.delete(name);
  }

  const upstream = await fetchUpstream(upstreamUrl, {
    method,
    headers,
    body: method === "POST" ? request.body : undefined,
    redirect: "manual",
  });
  const responseHeaders = new Headers(upstream.headers);
  responseHeaders.delete("server");
  responseHeaders.delete("alt-svc");
  responseHeaders.set("cache-control", "no-store");
  responseHeaders.set("x-content-type-options", "nosniff");
  responseHeaders.set("x-robots-tag", "noindex, nofollow");
  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
};
