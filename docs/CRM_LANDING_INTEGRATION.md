# CRM Landing integration

The Landing manager runs in Firebase project `maliedu-web`, while CRM data is
stored in project `dangpkkzxy`. Cloud Functions therefore needs explicit IAM
access to the CRM project; deploying the function alone does not grant it.

## Required runtime configuration

Create `functions/.env.maliedu-web` locally (the file is intentionally ignored):

```dotenv
CRM_PROJECT_ID=dangpkkzxy
CRM_DATABASE_URL=https://dangpkkzxy-default-rtdb.asia-southeast1.firebasedatabase.app
```

## Required CRM IAM bindings

The deployed `uploadApi` currently runs as:

```text
996301842926-compute@developer.gserviceaccount.com
```

Grant that principal these roles on project `dangpkkzxy`:

- `roles/datastore.user`: read/write `landing_pages`, `source_configs`,
  `courses_config`, `public_settings`, and audit records in Firestore.
- `roles/firebasedatabase.admin`: read CRM users and write incoming leads to
  Realtime Database through `/api/crm-leads`.

With Google Cloud CLI installed, an owner of the CRM project can run:

```powershell
$crmProject = "dangpkkzxy"
$runtimeMember = "serviceAccount:996301842926-compute@developer.gserviceaccount.com"

gcloud projects add-iam-policy-binding $crmProject `
  --member=$runtimeMember `
  --role="roles/datastore.user"

gcloud projects add-iam-policy-binding $crmProject `
  --member=$runtimeMember `
  --role="roles/firebasedatabase.admin"
```

If the Cloud Function runtime service account changes, use the new principal
shown in Cloud Run/Cloud Functions instead of the address above.

## Deployment order

Deploy the backend before Hosting so a new frontend never calls an older route:

```powershell
$env:FUNCTIONS_DISCOVERY_TIMEOUT = "30"
npx firebase-tools deploy --only functions:uploadApi
Remove-Item Env:FUNCTIONS_DISCOVERY_TIMEOUT

npm run build
npx firebase-tools deploy --only hosting
```

Deploy the CRM frontend separately after running its build. Its Settings link
uses `https://luathapdan.vn/admin/landings` in production and can be overridden
with `VITE_MALIEDU_LANDING_ADMIN_URL`.

## Production smoke test

1. Sign in as a Website admin and open `/admin/landings`.
2. Confirm Landing/course counts load without `crm/access-denied`.
3. Edit one Landing and confirm both `landing_pages/{id}` and
   `source_configs/{sourceKey}` update in CRM Firestore.
4. Submit a test form and confirm the lead appears once in the configured CRM
   funnel with `courseName`, `batchName`, and assignment populated.
