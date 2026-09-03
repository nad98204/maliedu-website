import { proxyFirebaseApiRequest } from "../_lib/firebaseApiProxy.js";

export async function onRequest(context) {
  return proxyFirebaseApiRequest(context, "/api/affiliate");
}
