import { proxyFirebaseAuthRequest } from "../../_lib/firebaseAuthProxy.js";

export const onRequest = ({ request }) => proxyFirebaseAuthRequest(request);
