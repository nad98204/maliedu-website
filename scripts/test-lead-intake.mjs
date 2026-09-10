import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createTestDb } from './helpers/intake-test-db.mjs';
import { parseLead } from '../workers/lead-intake/payload.js';
import { persistLead, getLead, claimLead, listLeads, retryLead } from '../workers/lead-intake/store.js';
import { deliverToCrm, sweepPending, syncLead } from '../workers/lead-intake/sync.js';
import { handleRequest } from '../workers/lead-intake/index.js';
import { requireDataAdsAdmin, verifyFirebaseToken } from '../workers/lead-intake/googleAuth.js';
import { getRegistrationAttempt } from '../src/services/registrationAttempt.js';

const payload = { name: 'Khách kiểm thử', phone: '8497 253 7633', source_key: 'test_ads_k55', course_k: 'K55',
  batchName: 'K55', cpSource: 'facebook', cpCampaign: 'campaign-test', landingPageId: 'test-landing', fbEventValue: 0 };
const body = (overrides = {}) => ({ nodePath: 'funnels/ads', payload, submissionId: '11111111-1111-4111-8111-111111111111', ...overrides });
const request = data => new Request('https://example.test/api/crm-leads', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Lead-Client-IP': '192.0.2.5' }, body: typeof data === 'string' ? data : JSON.stringify(data) });
const lead = (overrides, now) => parseLead(request(body(overrides)), now);
const dependencies = fetcher => ({ fetcher, getReadToken: async () => 'test-reader-token' });
const due = (db, id) => db.prepare('UPDATE lead_intake SET next_attempt_at = 0 WHERE id = ?').bind(id).run();

test('durable intake acknowledges storage while CRM is unavailable and does not expose contact data', async () => {
  const db = createTestDb();
  const tasks = [];
  const response = await handleRequest(request(body()), { LEAD_DB: db }, { waitUntil: task => tasks.push(task) });
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.success, true);
  assert.equal(result.accepted, true);
  assert.equal(result.phone, undefined);
  await Promise.all(tasks);
  const stored = await getLead(db, result.id);
  assert.equal(stored.sync_status, 'pending');
  assert.equal(stored.attempts, 1);
  assert.equal(JSON.parse(stored.payload_json).phone, '84972537633');
  assert.equal(stored.batch_name, 'K55');
  db.close();
});

test('storage outage never reports success or falls back to direct CRM writes', async () => {
  const db = { prepare: () => { throw Error('disk unavailable'); } };
  const response = await handleRequest(request(body()), { LEAD_DB: db }, { waitUntil: () => assert.fail('not saved') });
  assert.equal(response.status, 503);
  assert.equal((await response.json()).success, undefined);
});

test('same request and concurrent submissions create one row; reused id with different contact is rejected', async () => {
  const db = createTestDb();
  const item = await lead();
  await Promise.all([persistLead(db, item), persistLead(db, item)]);
  assert.equal((await listLeads(db, new URLSearchParams())).total, 1);
  const changed = await lead({ payload: { ...payload, phone: '0912345678' } });
  await assert.rejects(() => persistLead(db, changed), { status: 409 });
  db.close();
});

test('pending data survives process restart and retains original K and source until automatic recovery', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'lead-intake-test-'));
  const path = join(dir, 'data.sqlite');
  let db = createTestDb(path);
  const item = await lead();
  await persistLead(db, item);
  await syncLead(db, item.id, {}, dependencies(async () => { throw Error('CRM offline'); }));
  db.close(); db = createTestDb(path);
  await due(db, item.id);
  let writes = 0;
  await sweepPending({ LEAD_DB: db }, dependencies(async (_url, options) => {
    if (options.method !== 'PUT') return Response.json(null);
    writes++;
    const saved = JSON.parse(options.body);
    assert.equal(saved.course_k, 'K55'); assert.equal(saved.source_key, 'test_ads_k55');
    assert.equal(saved.cpCampaign, 'campaign-test');
    return Response.json(saved);
  }));
  assert.equal((await getLead(db, item.id)).sync_status, 'synced');
  assert.equal(writes, 1);
  db.close(); await rm(dir, { recursive: true });
});

test('a lost CRM response is reconciled on retry without duplicate or overwriting Sale changes', async () => {
  const db = createTestDb(); const item = await lead(); await persistLead(db, item);
  let crm = null, writes = 0;
  const dep = dependencies(async (_url, options) => {
    if (options.method !== 'PUT') return Response.json(crm);
    writes++; crm = { ...JSON.parse(options.body), status: 'CONTACTED', assignedName: 'Sale đang chăm sóc' };
    throw Error('response lost after commit');
  });
  await syncLead(db, item.id, {}, dep);
  assert.equal((await getLead(db, item.id)).sync_status, 'pending');
  await due(db, item.id);
  await syncLead(db, item.id, {}, dep);
  assert.equal((await getLead(db, item.id)).sync_status, 'synced');
  assert.equal(writes, 1); assert.equal(crm.status, 'CONTACTED');
  db.close();
});

test('leases prevent simultaneous delivery and expire after an interrupted worker', async () => {
  const db = createTestDb(); const item = await lead(); await persistLead(db, item);
  const claims = await Promise.all([claimLead(db, item.id), claimLead(db, item.id)]);
  assert.equal(claims.filter(Boolean).length, 1);
  assert.equal(await syncLead(db, item.id, {}, dependencies(() => assert.fail('locked'))), false);
  await db.prepare('UPDATE lead_intake SET locked_until = 0 WHERE id = ?').bind(item.id).run();
  assert.ok(await claimLead(db, item.id));
  db.close();
});

test('CRM race is checked by receipt ID and a conflicting record is never overwritten', async () => {
  const item = await lead(); const row = { id: item.id, node_path: item.nodePath, payload_json: JSON.stringify(item.payload) };
  let reads = 0, writes = 0;
  await deliverToCrm(row, {}, dependencies(async (_url, options) => {
    if (options.method === 'PUT') { writes++; assert.equal(options.headers['If-Match'], undefined); assert.equal(options.headers.Authorization, undefined); return Response.json({ error: 'exists' }, { status: 401 }); }
    reads++; return Response.json(reads === 1 ? null : { websiteRegistrationId: item.id, status: 'CONTACTED' });
  }));
  assert.equal(writes, 1); assert.equal(reads, 2);
  await assert.rejects(() => deliverToCrm(row, {}, dependencies(async (_url, options) => {
    assert.notEqual(options.method, 'PUT'); return Response.json({ websiteRegistrationId: 'different-id' });
  })), { status: 409 });
});

test('exhausted retries remain stored, visible and automatically recover after configuration repair', async () => {
  const db = createTestDb(); const item = await lead(); await persistLead(db, item);
  for (let i = 0; i < 6; i++) {
    await due(db, item.id);
    await syncLead(db, item.id, {}, dependencies(async () => Response.json({ error: 'denied' }, { status: 403 })));
  }
  let row = await getLead(db, item.id);
  assert.equal(row.sync_status, 'attention'); assert.equal(row.attempts, 6);
  assert.ok(row.next_attempt_at > Date.now());
  await retryLead(db, item.id, 'admin-test');
  await syncLead(db, item.id, {}, dependencies(async (_url, options) => Response.json(options.method === 'PUT' ? JSON.parse(options.body) : null)));
  row = await getLead(db, item.id); assert.equal(row.sync_status, 'synced'); assert.equal(row.attempts, 7);
  db.close();
});

test('rejects invalid payloads before storage and controls server-only fields', async () => {
  for (const data of ['{', body({ nodePath: 'security' }), body({payload:[]}), body({submissionId:'../escape'}),
    ...[{name:'x'},{phone:'123'},{phone:'abc123456789'},{source_key:''},{email:'invalid'}].map(p=>body({payload:{...payload,...p}}))]) {
    await assert.rejects(() => parseLead(request(data)), { status: 400 });
  }
  await assert.rejects(() => parseLead(request('x'.repeat(32769))), { status: 413 });
  const item = await lead({payload:{...payload, createdAt:'old', createdVia:'admin', status:'WON', admin:true, note:'x'.repeat(2500)}});
  assert.equal(item.payload.status,'NEW'); assert.equal(item.payload.createdVia,'landing'); assert.equal(item.payload.admin,undefined);
  assert.notEqual(item.payload.createdAt,'old'); assert.equal(item.payload.note.length,2000);
  for (const funnel of ['ads','brand','leader','thuonghieu']) assert.equal((await lead({nodePath:'funnels/'+funnel})).nodePath,'funnels/'+funnel);
});

test('search, dates, status and pagination work against the real SQL schema without exposing tracking fields', async () => {
  const db=createTestDb();
  for(let i=0;i<3;i++) await persistLead(db,await lead({submissionId:'test_registration_'+i,payload:{...payload,name:i===1?'Đặng Ánh':'Khách '+i}},Date.parse('2026-09-10T02:00:00Z')+i),Date.parse('2026-09-10T02:00:00Z')+i);
  const result=await listLeads(db,new URLSearchParams({search:'dang anh',from:'2026-09-10',to:'2026-09-10',sync:'pending'}));
  assert.equal(result.total,1); assert.equal(result.leads[0].name,'Đặng Ánh'); assert.equal(result.leads[0].payload_json,undefined);
  const first=await listLeads(db,new URLSearchParams({limit:'1',page:'0'}));
  const next=await listLeads(db,new URLSearchParams({limit:'1',page:'1'}));
  assert.notEqual(first.leads[0].id,next.leads[0].id);
  assert.equal((await listLeads(db,new URLSearchParams({search:"%' OR 1=1 --"}))).total,0);
  db.close();
});

test('client retry preserves request and tracking IDs; a new K is a separate registration', async () => {
  const first=await getRegistrationAttempt('funnels/ads',{...payload,lead_event_id:'original-lead'});
  const retry=await getRegistrationAttempt('funnels/ads',{...payload,lead_event_id:'new-event'});
  assert.equal(first.id,retry.id); assert.equal(retry.leadEventId,'original-lead');
  const different=await getRegistrationAttempt('funnels/ads',{...payload,course_k:'K56'});
  assert.notEqual(first.id,different.id);
});

test('anonymous and forged admin tokens cannot list or retry leads', async () => {
  const db=createTestDb();
  for(const path of ['/api/admin/lead-intake','/api/admin/lead-intake/retry']) {
    const response=await handleRequest(new Request('https://example.test'+path,{method:path.endsWith('retry')?'POST':'GET'}),{LEAD_DB:db},{});
    assert.equal(response.status,401);
  }
  await assert.rejects(()=>verifyFirebaseToken('forged.payload.signature','maliedu-web'),{status:401});
  db.close();
});

test('admin token audience, signature and Data Ads module permission are verified', async () => {
  const keys=await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
  const jwk=await crypto.subtle.exportKey('jwk',keys.publicKey);jwk.kid='test-key';
  const b64=value=>Buffer.from(JSON.stringify(value)).toString('base64url');
  const now=Math.floor(Date.now()/1000);
  const createToken=async changes=>{const unsigned=b64({alg:'RS256',kid:'test-key'})+'.'+b64({sub:'admin-test',aud:'maliedu-web',iss:'https://securetoken.google.com/maliedu-web',iat:now,exp:now+3600,auth_time:now,...changes});const signature=await crypto.subtle.sign('RSASSA-PKCS1-v1_5',keys.privateKey,new TextEncoder().encode(unsigned));return unsigned+'.'+Buffer.from(signature).toString('base64url');};
  const token=await createToken({});
  let allowed=['courses'];
  const fetcher=async url=>Response.json(url.includes('/jwk/')?{keys:[jwk]}:{fields:{role:{stringValue:'admin'},allowedModules:{arrayValue:{values:allowed.map(stringValue=>({stringValue}))}}}});
  const req=new Request('https://example.test/api/admin/lead-intake',{headers:{Authorization:'Bearer '+token}});
  await assert.rejects(()=>requireDataAdsAdmin(req,{},fetcher),{status:403});
  allowed=['data-ads'];assert.equal((await requireDataAdsAdmin(req,{},fetcher)).sub,'admin-test');
  await assert.rejects(()=>verifyFirebaseToken(token.slice(0,-10)+'AAAAAAAAAA','maliedu-web',fetcher),{status:401});
  async function invalid(changes) { await assert.rejects(()=>createToken(changes).then(t=>verifyFirebaseToken(t,'maliedu-web',fetcher)),{status:401}); }
  await invalid({aud:'different-project'});await invalid({exp:now-1});
});
