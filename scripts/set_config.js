import { initializeApp, cert } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function setConfig() {
  await db.collection('public_settings').doc('landing_config').set({
    fbCapiToken: FieldValue.delete(),
    updatedAt: new Date().toISOString()
  }, { merge: true });

  const landingPages = await db.collection('landing_pages').get();
  const batch = db.batch();
  landingPages.docs.forEach((landingPage) => {
    batch.update(landingPage.ref, { fbCapiToken: FieldValue.delete() });
  });
  await batch.commit();

  console.log("Removed public CAPI tokens. Configure META_CAPI_ACCESS_TOKEN on the server.");
}

setConfig().catch(console.error);
