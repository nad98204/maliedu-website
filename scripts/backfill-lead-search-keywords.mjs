import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { FieldPath, getFirestore } from 'firebase-admin/firestore';
import {
  buildLeadSearchKeywords,
  normalizeLeadPhoneDigits,
  normalizeLeadSearchText,
} from '../src/utils/leadSearch.js';

const PAGE_SIZE = Number(process.env.PAGE_SIZE || 100);
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'maliedu-web';

initializeApp({
  credential: applicationDefault(),
  projectId: PROJECT_ID,
});

const db = getFirestore();

let cursor = null;
let scanned = 0;
let updated = 0;

while (true) {
  let leadsQuery = db
    .collection('leads')
    .orderBy(FieldPath.documentId())
    .limit(PAGE_SIZE);

  if (cursor) {
    leadsQuery = leadsQuery.startAfter(cursor);
  }

  const snap = await leadsQuery.get();
  if (snap.empty) break;

  const batch = db.batch();
  let batchUpdates = 0;

  snap.docs.forEach((docSnap) => {
    scanned += 1;
    const lead = docSnap.data();
    const name = lead.name || '';
    const phone = lead.phone || '';
    const searchName = normalizeLeadSearchText(name);
    const searchPhone = normalizeLeadPhoneDigits(phone);
    const searchKeywords = buildLeadSearchKeywords({ name, phone });

    if (
      lead.searchName === searchName &&
      lead.searchPhone === searchPhone &&
      Array.isArray(lead.searchKeywords) &&
      lead.searchKeywords.length > 0
    ) {
      return;
    }

    batch.update(docSnap.ref, {
      searchName,
      searchPhone,
      searchKeywords,
    });
    batchUpdates += 1;
  });

  if (batchUpdates > 0) {
    await batch.commit();
    updated += batchUpdates;
  }

  cursor = snap.docs[snap.docs.length - 1];
}

console.log(`Lead search backfill complete. Scanned: ${scanned}. Updated: ${updated}.`);
