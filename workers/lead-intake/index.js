import { fail, json, parseLead, readJson } from './payload.js';
import { requireDataAdsAdmin } from './googleAuth.js';
import { listLeads, persistLead, publicLead, retryLead } from './store.js';
import { sweepPending, syncLead } from './sync.js';

export async function handleRequest(request, env, context) {
  try {
    if (!env.LEAD_DB) fail(503, 'Kho nhận đăng ký chưa sẵn sàng. Vui lòng thử lại sau.');
    const path = new URL(request.url).pathname.replace(/\/+$/, '');
    if (path === '/api/crm-leads' && request.method === 'POST') {
      const lead = await parseLead(request);
      const stored = await persistLead(env.LEAD_DB, lead);
      // Success is tied to the durable database commit, never the best-effort
      // immediate send. The scheduled sweeper survives process/browser exits.
      if (stored.sync_status !== 'synced') {
        try { context.waitUntil(syncLead(env.LEAD_DB, stored.id, env).catch(() => console.error('lead_immediate_send_interrupted'))); }
        catch { /* The committed pending row is picked up by the scheduler. */ }
      }
      return json({ success: true, id: stored.id, accepted: true, syncStatus: stored.sync_status });
    }
    if (path === '/api/admin/lead-intake' && request.method === 'GET') {
      await requireDataAdsAdmin(request, env);
      return json(await listLeads(env.LEAD_DB, new URL(request.url).searchParams));
    }
    if (path === '/api/admin/lead-intake/retry' && request.method === 'POST') {
      const user = await requireDataAdsAdmin(request, env);
      const body = await readJson(request, 2048);
      if (!/^web_[a-zA-Z0-9_-]{16,110}$/.test(body?.id || '')) fail(400, 'Mã đăng ký không hợp lệ.');
      const row = await retryLead(env.LEAD_DB, body.id, user.sub);
      context.waitUntil(syncLead(env.LEAD_DB, row.id, env).catch(() => console.error('lead_manual_send_interrupted')));
      return json({ success: true, lead: publicLead(row) });
    }
    return json({ error: 'Not found' }, 404);
  } catch (error) {
    const status = error.status || 503;
    if (!error.status) console.error('lead_intake_storage_unavailable');
    return json({ error: error.status ? error.message : 'Chưa lưu được đăng ký. Vui lòng giữ thông tin và thử lại.' }, status);
  }
}

export default {
  fetch: handleRequest,
  scheduled: (_event, env, context) => context.waitUntil(sweepPending(env)),
};
