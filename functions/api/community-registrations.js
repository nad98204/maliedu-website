import { proxyFirebaseApiRequest } from '../_lib/firebaseApiProxy.js';
export const onRequestPost = context => proxyFirebaseApiRequest(context, '/api/community-registrations');
