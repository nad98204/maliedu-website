import { proxyFirebaseApiPost } from '../../_lib/firebaseApiProxy.js';
export const onRequestPost = context => proxyFirebaseApiPost(context, '/api/admin/hypnosis');
