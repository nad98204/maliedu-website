# Durable website registration intake

`POST /api/crm-leads` commits the immutable registration and pending delivery in
one Cloudflare D1 row before returning success. Pages connects to this private
Worker through `LEAD_INTAKE`. Missing storage/binding fails with 503 and the form
keeps the customer's input. Do not restore a direct-to-CRM fallback.

The Worker attempts delivery immediately and a cron runs every minute, including
when the visitor closes their browser. Each tick claims up to eight due rows with
90-second leases. Failures retry after 1, 2, 4, 8, then at most 15 minutes;
`attention` rows continue retrying. Pending records are never automatically deleted.
CRM recovery capacity from the cron alone is eight records per minute. Watch the
oldest pending time and adjust capacity/plan if incoming backlog exceeds this.

The client's submission ID survives page reloads in the same tab for 24 hours.
Repeated requests use the same website and CRM ID and the first stored payload,
including original source, K, and Meta event IDs. Cached older clients without an
ID receive 30-minute bounded deduplication. A read-only CRM service account checks
receipts at the exact destination ID. Writes use the existing anonymous landing
rules (`!data.exists()`), which atomically prohibit overwriting an existing lead.
Do not relax those rules. Conditional REST writes are intentionally not used:
Firebase requires read permission for them, which anonymous landing clients lack.

## Production configuration

- Cloudflare account: `d7e81ab0f2301ec21229995ab5398aa1`.
- Worker: `maliedu-lead-intake`; public workers.dev/preview URLs disabled.
- D1: `maliedu-lead-intake`, configured in `wrangler.jsonc`.
- Pages: `maliedu-website`, production branch `main`.
- Pages production service binding: `LEAD_INTAKE` → `maliedu-lead-intake`,
  environment `production`. The Pages API field is
  `deployment_configs.production.services.LEAD_INTAKE`.
- Preview deployments must use separate infrastructure; they are intentionally
  not bound to the production intake database.
- Secret: `CRM_READER_SERVICE_ACCOUNT`, Google service-account JSON with only
  `roles/firebasedatabase.viewer` on CRM project `dangpkkzxy`. Never commit it.

Deploy migrations and Worker before the Pages change. With an authenticated
Wrangler installation:

```sh
wrangler d1 migrations apply maliedu-lead-intake --remote --config workers/lead-intake/wrangler.jsonc
wrangler secret put CRM_READER_SERVICE_ACCOUNT --config workers/lead-intake/wrangler.jsonc
wrangler deploy --config workers/lead-intake/wrangler.jsonc
```

Set the secret only for initial setup or rotation. Existing secrets survive
normal Worker deployments. Preserve all other Pages settings when adding its
service binding; then push reviewed code to `main` to run the existing Git build.
For local integration use Wrangler's local D1 and a test CRM, never production
service credentials. Plain Vite has no private service binding and fails closed.

## Operation and verification

`/admin/data-ads` defaults to new durable registrations. It shows sync state,
attempt count, last error, oldest pending warning and scheduler heartbeat warning;
authorized admins can retry or export a filtered CSV. Firebase ID tokens and the
existing Data Ads role/module authorization protect both admin API routes. The
history tab retains old Website Firestore records; they are not automatically
replayed into CRM because they predate reliable receipt IDs.

Alerts are displayed in Data Ads; no external email/SMS notification is configured.
This change does not restore Google's disabled CAPI/upload service. Optional
browser tracking failures cannot turn a saved registration into a failed form.

Run with Node 22.13+ (SQLite built-in) or Node 24:

```sh
node --test scripts/test-lead-intake.mjs scripts/test-crm-edge.mjs scripts/test-secret-landing.mjs
npm run build
```

Tests cover database failure, CRM outage/recovery, restart durability, lost CRM
responses, concurrent claims, duplicate suppression, immutable K/attribution,
forged admin tokens and module permissions. Verify a clearly marked synthetic
registration on production: durable receipt → matching CRM ID → scheduler
heartbeat. Remove only that exact test record after verification.

Rollback Pages if its UI or proxy breaks, while retaining the D1 database and
Worker so already accepted registrations keep retrying. Do not delete queued
rows, revoke the reader credential, or disable cron during a website rollback.
