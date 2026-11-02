import { proxyFirebaseApiRequest } from '../../_lib/firebaseApiProxy.js';
export const onRequestGet = context => proxyFirebaseApiRequest(context, '/api/admin/community-registrations');
