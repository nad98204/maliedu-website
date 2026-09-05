import { readFile } from 'node:fs/promises';
import { before, after, test } from 'node:test';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, getDocs, collection, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

let env;
before(async () => {
  if (!process.env.FIRESTORE_EMULATOR_HOST) throw Error('Run with the Firestore emulator; never use production.');
  env = await initializeTestEnvironment({ projectId: 'demo-maliedu-hypnosis',
    firestore: { rules: await readFile(new URL('../firestore.rules', import.meta.url), 'utf8') } });
  await env.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    await Promise.all([
      setDoc(doc(db, 'hypnosis_audios/paid'), { title: 'paid', audioUrl: 'secret', isFree: false }),
      setDoc(doc(db, 'user_audios/student_paid'), { userId: 'student', trackId: 'paid', status: 'active' }),
      setDoc(doc(db, 'users/student'), { role: 'student', email: 'student@test.invalid' }),
      setDoc(doc(db, 'users/limited'), { role: 'admin', allowedModules: ['students'] }),
      setDoc(doc(db, 'users/hypnosisAdmin'), { role: 'admin', allowedModules: ['hypnosis'] }),
      setDoc(doc(db, 'users/orderAdmin'), { role: 'admin', allowedModules: ['orders'] }),
      setDoc(doc(db, 'orders/pending'), { userId: 'student', status: 'pending', amount: 199000 }),
    ]);
  });
});
after(async () => { await env?.cleanup(); });
const dbFor = uid => env.authenticatedContext(uid, { email: `${uid}@test.invalid`, email_verified: true }).firestore();

test('anonymous and students cannot get or enumerate private audio', async () => {
  for (const db of [env.unauthenticatedContext().firestore(), dbFor('student')]) {
    await assertFails(getDoc(doc(db, 'hypnosis_audios/paid')));
    await assertFails(getDocs(collection(db, 'hypnosis_audios')));
  }
});
test('only hypnosis admins can read source media; all browser writes are denied', async () => {
  await assertFails(getDoc(doc(dbFor('limited'), 'hypnosis_audios/paid')));
  await assertSucceeds(getDoc(doc(dbFor('hypnosisAdmin'), 'hypnosis_audios/paid')));
  await assertFails(setDoc(doc(dbFor('hypnosisAdmin'), 'hypnosis_audios/paid'), { audioUrl: 'replacement' }));
  await assertFails(deleteDoc(doc(dbFor('hypnosisAdmin'), 'hypnosis_audios/paid')));
});
test('no browser, including admins, can create/update/delete audio ownership', async () => {
  for (const uid of ['student', 'hypnosisAdmin', 'orderAdmin']) {
    const db = dbFor(uid);
    await assertFails(setDoc(doc(db, `user_audios/${uid}_new`), { userId: uid, trackId: 'paid', isFree: true, status: 'active' }));
    await assertFails(updateDoc(doc(db, 'user_audios/student_paid'), { trackId: 'other' }));
    await assertFails(deleteDoc(doc(db, 'user_audios/student_paid')));
  }
});
test('owners can read their grants but cannot read another buyer', async () => {
  await assertSucceeds(getDoc(doc(dbFor('student'), 'user_audios/student_paid')));
  await assertFails(getDoc(doc(dbFor('other'), 'user_audios/student_paid')));
});
test('restricted admins cannot self-promote or grant themselves modules', async () => {
  const db = dbFor('limited');
  await assertFails(updateDoc(doc(db, 'users/limited'), { allowedModules: [] }));
  await assertFails(updateDoc(doc(db, 'users/student'), { role: 'admin' }));
  await assertSucceeds(updateDoc(doc(db, 'users/limited'), { displayName: 'Changed name' }));
});
test('only order managers can mark orders paid; regular users cannot', async () => {
  for (const uid of ['limited', 'student', 'hypnosisAdmin']) {
    await assertFails(updateDoc(doc(dbFor(uid), 'orders/pending'), { status: 'completed' }));
  }
  await assertSucceeds(updateDoc(doc(dbFor('orderAdmin'), 'orders/pending'), { status: 'completed' }));
});
