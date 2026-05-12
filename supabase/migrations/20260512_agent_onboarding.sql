-- Agent first-login onboarding tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarded_at TIMESTAMPTZ;

COMMENT ON COLUMN users.onboarded_at IS
  'NULL = agent has not yet completed first-login onboarding (terms + password change). Set once after completion.';
