import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { onRequest } from '../functions/api/_middleware.js';
import { onRequestPost } from '../functions/api/crm-leads.js';
const originalFetch=globalThis.fetch;
afterEach(()=>{globalThis.fetch=originalFetch;});

test('Pages sends intake to the private service, sanitizes client IP and never calls Firebase Hosting',async()=>{
  globalThis.fetch=async()=>assert.fail('public network must not be used by intake proxy');
  const ctx={request:new Request('https://example.test/api/crm-leads',{method:'POST',headers:{'CF-Connecting-IP':'192.0.2.3','X-Lead-Client-IP':'spoofed'},body:JSON.stringify({test:true})}),env:{LEAD_INTAKE:{fetch:async req=>{
    assert.equal(req.headers.get('X-Lead-Client-IP'),'192.0.2.3');
    assert.deepEqual(await req.json(),{test:true});
    return Response.json({success:true,id:'web-test',accepted:true});
  }}}};
  ctx.next=()=>onRequestPost(ctx);
  const response=await onRequest(ctx);
  assert.equal(response.status,200);assert.equal((await response.json()).accepted,true);
});

test('missing or failing service binding fails closed without claiming success',async()=>{
  for(const env of [{},{LEAD_INTAKE:{fetch:async()=>{throw Error('service unavailable');}}}]) {
    const response=await onRequestPost({request:new Request('https://example.test/api/crm-leads',{method:'POST',body:'{}'}),env});
    assert.equal(response.status,503);assert.equal((await response.json()).success,undefined);
  }
});

test('only approved intake routes bypass Firebase proxy and wrong methods cannot read public lead data',async()=>{
  for(const [path,method] of [['/api/crm-leads','POST'],['/api/admin/lead-intake','GET'],['/api/admin/lead-intake/retry','POST']]) {
    const response=await onRequest({request:new Request('https://example.test'+path,{method}),next:()=>Response.json({privateService:true})});
    assert.equal((await response.json()).privateService,true);
  }
  assert.equal((await onRequest({request:new Request('https://example.test/api/crm-leads')})).status,405);
  globalThis.fetch=async req=>{assert.equal(req.url,'https://maliedu-web.web.app/api/orders');return Response.json({error:'upstream disabled'},{status:503});};
  assert.equal((await onRequest({request:new Request('https://example.test/api/orders')})).status,503);
});
