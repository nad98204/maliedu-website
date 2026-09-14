import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import fs from 'node:fs';
import path from 'node:path';
import { INITIAL_TRACKS } from '../src/data/hypnosisTracksData.js';
import { hypnosisPrice, publicHypnosisTrack, hypnosisMedia } from '../functions/_lib/hypnosis.js';

const serviceAccountPath = path.resolve('serviceAccountKey.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('serviceAccountKey.json not found');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
const app = initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore(app);

async function seed() {
  console.log(`Starting hypnosis track seed for ${INITIAL_TRACKS.length} tracks...`);
  const batch = db.batch();

  for (const item of INITIAL_TRACKS) {
    const trackRef = db.collection('hypnosis_audios').doc(item.id);
    const existing = await trackRef.get();

    const cleanData = publicHypnosisTrack(item.id, item);

    const fullTrackData = {
      ...item,
      ...cleanData,
      audioUrl: item.isFree ? (item.audioUrl || '') : '',
      videoId: item.videoId || '',
      audioProvider: item.isFree ? 'url' : 'bunny',
      isPublished: true,
      price: item.isFree ? 0 : (hypnosisPrice(item.price) || 0),
      originalPrice: hypnosisPrice(item.originalPrice) || 0,
      createdAt: existing.exists ? existing.data()?.createdAt || FieldValue.serverTimestamp() : FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    batch.set(trackRef, fullTrackData, { merge: true });
    console.log(`Prepared ${item.id}: "${item.title}" (isFree: ${item.isFree}, price: ${fullTrackData.price})`);
  }

  await batch.commit();
  console.log('Successfully seeded hypnosis tracks into Firestore hypnosis_audios collection.');
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
