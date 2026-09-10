CREATE TABLE IF NOT EXISTS lead_intake (
  id TEXT PRIMARY KEY,
  fingerprint TEXT NOT NULL,
  node_path TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  search_text TEXT NOT NULL,
  source_key TEXT NOT NULL,
  batch_name TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  sync_status TEXT NOT NULL DEFAULT 'pending' CHECK (sync_status IN ('pending','sending','synced','attention')),
  attempts INTEGER NOT NULL DEFAULT 0,
  next_attempt_at INTEGER NOT NULL,
  last_attempt_at INTEGER,
  synced_at INTEGER,
  last_error TEXT,
  lease_token TEXT,
  locked_until INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS lead_intake_due ON lead_intake(sync_status, next_attempt_at, locked_until);
CREATE INDEX IF NOT EXISTS lead_intake_created ON lead_intake(created_at DESC, id DESC);
CREATE TABLE IF NOT EXISTS intake_rate_limits (
  bucket TEXT PRIMARY KEY,
  requests INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS intake_rate_expiry ON intake_rate_limits(expires_at);
CREATE TABLE IF NOT EXISTS intake_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS intake_health (
  id TEXT PRIMARY KEY,
  last_run_at INTEGER NOT NULL,
  processed INTEGER NOT NULL DEFAULT 0
);
