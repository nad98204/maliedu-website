const attempts = new Map();
const storageKey = 'maliedu_registration_attempts_v1';
// Keep the same receipt across long outages and a page reload in this tab.
const maxAge = 24 * 60 * 60 * 1000;

// Store only a contact fingerprint and event IDs, never contact data.
export async function getRegistrationAttempt(nodePath, payload) {
  const identity = JSON.stringify([nodePath, String(payload.name || '').trim().toLowerCase(),
    String(payload.phone || '').replace(/\D/g, '').replace(/^84(?=\d{9}$)/, '0'),
    payload.email || '', payload.source_key, payload.course_k || payload.batchName || '',
    payload.landingPageId || '', payload.referrer || '']);
  const key = [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(identity)))]
    .map(byte => byte.toString(16).padStart(2, '0')).join('');
  try {
    for (const [k, value] of JSON.parse(sessionStorage.getItem(storageKey) || '[]')) {
      if (Date.now() - value.createdAt < maxAge && !attempts.has(k)) attempts.set(k, value);
    }
  } catch { /* Storage may be disabled; in-memory retries still work. */ }
  for (const [k, value] of attempts) if (Date.now() - value.createdAt >= maxAge) attempts.delete(k);
  if (!attempts.has(key)) attempts.set(key, {
    id: crypto.randomUUID(), createdAt: Date.now(),
    leadEventId: payload.lead_event_id || '', registrationEventId: payload.meta_event_id || '',
  });
  try { sessionStorage.setItem(storageKey, JSON.stringify([...attempts].slice(-20))); } catch { /* Optional. */ }
  return attempts.get(key);
}
