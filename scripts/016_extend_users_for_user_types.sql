-- =============================================================================
-- EXTEND USERS TABLE FOR UNIFIED USER MANAGEMENT
-- =============================================================================
-- This migration extends the users table to support multiple user types:
--   - app: Regular app/customer users
--   - bo: Backoffice/internal users
--   - friends_family: Friends & Family testers
--   - beta: Beta testers
--
-- IMPORTANT: This does NOT replace backoffice_users table.
-- BO login still uses backoffice_users for compatibility.
-- =============================================================================

-- Add user_type field
ALTER TABLE application.users 
ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'app' 
CHECK (user_type IN ('app', 'bo', 'friends_family', 'beta'));

-- Add user_reference_id (unique human-readable ID)
ALTER TABLE application.users 
ADD COLUMN IF NOT EXISTS user_reference_id TEXT UNIQUE;

-- Generate reference IDs for existing users that don't have one
UPDATE application.users 
SET user_reference_id = 'BX-' || UPPER(LEFT(user_id::text, 8))
WHERE user_reference_id IS NULL;

-- Add referred_by field (FK to another user)
ALTER TABLE application.users 
ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES application.users(user_id) ON DELETE SET NULL;

-- Add invite tracking fields
ALTER TABLE application.users 
ADD COLUMN IF NOT EXISTS invite_token UUID;

ALTER TABLE application.users 
ADD COLUMN IF NOT EXISTS invite_token_expires_at TIMESTAMPTZ;

ALTER TABLE application.users 
ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ;

ALTER TABLE application.users 
ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES application.users(user_id) ON DELETE SET NULL;

-- Add approval tracking fields
ALTER TABLE application.users 
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES application.users(user_id) ON DELETE SET NULL;

ALTER TABLE application.users 
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- Add verified_at if not exists
ALTER TABLE application.users 
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

-- Add role field for BO users (mirrors backoffice_users.role)
ALTER TABLE application.users 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' 
CHECK (role IN ('admin', 'operator', 'viewer', 'user'));

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_users_user_type ON application.users(user_type);
CREATE INDEX IF NOT EXISTS idx_users_user_reference_id ON application.users(user_reference_id);
CREATE INDEX IF NOT EXISTS idx_users_invite_token ON application.users(invite_token) WHERE invite_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_referred_by ON application.users(referred_by) WHERE referred_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_role ON application.users(role);

-- Create index for listing non-app users (BO, F&F, Beta)
CREATE INDEX IF NOT EXISTS idx_users_managed_types 
ON application.users(user_type, created_at DESC) 
WHERE user_type IN ('bo', 'friends_family', 'beta');

-- =============================================================================
-- HELPER FUNCTION: Generate unique reference ID
-- =============================================================================
CREATE OR REPLACE FUNCTION application.generate_user_reference_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_reference_id IS NULL THEN
    NEW.user_reference_id := 'BX-' || UPPER(LEFT(COALESCE(NEW.user_id::text, gen_random_uuid()::text), 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger for auto-generating reference ID
DROP TRIGGER IF EXISTS trigger_users_generate_reference_id ON application.users;
CREATE TRIGGER trigger_users_generate_reference_id
BEFORE INSERT ON application.users
FOR EACH ROW
EXECUTE FUNCTION application.generate_user_reference_id();

-- =============================================================================
-- UPDATE backoffice_users: Add invited_at update on token regeneration
-- =============================================================================
-- This ensures invited_at is updated when resending invites

-- Update regenerate function behavior (done in app code, not SQL)

COMMENT ON COLUMN application.users.user_type IS 'Type of user: app (customer), bo (backoffice), friends_family (F&F tester), beta (beta tester)';
COMMENT ON COLUMN application.users.user_reference_id IS 'Human-readable unique reference ID (e.g., BX-A1B2C3D4)';
COMMENT ON COLUMN application.users.referred_by IS 'FK to user who referred this user';
COMMENT ON COLUMN application.users.invite_token IS 'Token for email verification/invitation';
COMMENT ON COLUMN application.users.invited_at IS 'When invitation was last sent/resent';
COMMENT ON COLUMN application.users.role IS 'Role for BO users: admin, operator, viewer; user for app users';
