# Landing registration recovery — 10 September 2026

Production hotfix: `ac4cd2b`, deployed successfully by Cloudflare Pages to
`luathapdan.vn` on 10 September 2026.

## Cause

`/api/crm-leads` was intercepted by the Pages API middleware and proxied to
Firebase Hosting / `uploadApi`. Requests returned HTTP 500/503 (and later 429).
Cloud Run logs explicitly reported that requests failed because billing was
disabled. The linked billing account reported `open: false`, even though the
project billing-info endpoint still reported `billingEnabled: true`.

## Recovery

The middleware now dispatches only POST `/api/crm-leads` to the existing Pages
CRM handler. The handler creates leads directly in CRM Realtime Database using
its existing create-only public landing rules. Database rules and IAM were not
changed. It validates contacts, source keys, funnel paths and body size; limits
stored fields; supplies server timestamps/state; preserves attribution and
course data; and returns success only after CRM acknowledges the write. It does
not automatically retry an ambiguous write. Other APIs retain their proxy.

## Verification

- Production build and SEO checks passed; 13 registration/landing tests passed.
- ESLint passed for both handlers and the new regression tests.
- A real browser submission on the production landing returned HTTP 200 and
  navigated to `/cam-on-khoi-thong` without runtime errors.
- The exact created CRM record was read back and verified in `funnels/ads` with
  source `1768973703248_ads_k55`, K55, matching contact and campaign fields.
- Browser analytics were blocked for this test. The uniquely named test lead
  was deleted by its returned ID, and its deletion was verified.

## Remaining operational work

Restore the closed Google Cloud billing account through the account owner.
Other APIs still depend on that service. While Pages handles intake directly,
the `uploadApi` Firestore-based rate limiter, secondary Website `leads` mirror
and server-side Meta CAPI path are not executed; the existing browser Pixel
code is unchanged. CAPI logs already reported a missing access token before
the outage. Restore and validate the backend and its tracking configuration
before routing lead intake back to it, or migrate these secondary capabilities
to Cloudflare separately. Do not assume reopening billing alone changes the
new intake routing.
