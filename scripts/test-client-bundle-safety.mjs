import assert from 'node:assert/strict';
import { test } from 'node:test';
import { clientBundleSafety, isServerOnlyModule } from './client-bundle-safety.mjs';

test('bundle the shared routing helper, keep server modules excluded', () => {
  for (const id of ['../../../functions/_lib/landingHealth.js', 'D:\\Projects\\site\\functions\\_lib\\landingHealth.js']) {
    assert.equal(isServerOnlyModule(id), false);
  }
  assert.equal(isServerOnlyModule('../../../functions/_lib/adminLandings.js'), true);
  assert.equal(isServerOnlyModule('D:\\Projects\\site\\functions\\api\\admin.js'), true);
});

test('production build rejects unpublished static or lazy server imports', () => {
  const plugin = clientBundleSafety();
  const context = { error(message) { throw new Error(message); } };
  for (const field of ['imports', 'dynamicImports']) {
    const chunk = { type: 'chunk', fileName: 'assets/AdminLandings.js', imports: [], dynamicImports: [], [field]: ['../functions/_lib/landingHealth.js'] };
    assert.throws(() => plugin.generateBundle.call(context, {}, { admin: chunk }), /unpublished server module/);
  }
  assert.doesNotThrow(() => plugin.generateBundle.call(context, {}, { admin: { type: 'chunk', fileName: 'assets/AdminLandings.js', imports: ['assets/landingHealth.js'], dynamicImports: [] } }));
});
