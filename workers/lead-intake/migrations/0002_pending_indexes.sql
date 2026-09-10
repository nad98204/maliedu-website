-- Keep periodic recovery from scanning registrations already delivered to CRM.
CREATE INDEX IF NOT EXISTS lead_intake_pending_due ON lead_intake(next_attempt_at, locked_until)
  WHERE sync_status != 'synced';
CREATE INDEX IF NOT EXISTS lead_intake_pending_created ON lead_intake(created_at)
  WHERE sync_status != 'synced';
