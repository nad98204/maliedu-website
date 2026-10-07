# Referral course runs

The super administrator can end the current Chinh Phuc Muc Tieu run from
`/admin/referral-customers`. The dialog requires a new run name, the date/time
registrations began for that run, and an explicit consent checkbox. Canceling or
opening the dialog does not write anything.

Confirmation atomically closes the previous run and opens the next one in
`system_settings/referral_course_runs`. That document contains only public course
metadata. A separate private `system_settings/referral_run_event-*` document logs
the confirming administrator and server timestamp. Concurrent confirmations for
the same run fail instead of creating multiple active runs.

Existing registrations are never deleted or bulk rewritten. Untagged legacy
records are assigned by their original registration timestamps using the
confirmed boundary. New landing submissions read the active run before sending
and include its ID in `landingPageId` and `batch_id`. The CRM source key and each
employee's referral code remain the same.

The customer table, per-employee counts, search, status filtering and Excel
export combine historical Firestore records with durable intake registrations.
Intake records are read from `/api/admin/referral-leads`, which verifies the
Firebase token and `referral-customers` module permission and exposes only this
course's records. Firestore notes/status overlays are merged by receipt ID.
Tracking fields and CRM credentials are not returned.

Ended runs remain in both course selectors. Their employee rows offer a shortcut
to archived data rather than generating registration links for a closed run.

Validation:

```sh
node --test scripts/test-referral-course-runs.mjs scripts/test-lead-intake.mjs scripts/test-crm-edge.mjs
npm run build
```

Deploy the intake Worker and Firestore rules before publishing the Pages client.
Deploying this feature does not end a run; the administrator confirms that in the
dialog with the correct historical start date for the new campaign.
