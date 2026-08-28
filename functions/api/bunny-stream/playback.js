import { proxyFirebaseApiPost } from "../../_lib/firebaseApiProxy.js";

export async function onRequestPost(context) {
  return proxyFirebaseApiPost(context, "/api/bunny-stream/playback");
}
