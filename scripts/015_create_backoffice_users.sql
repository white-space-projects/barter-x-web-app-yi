-- =============================================================================
-- BACKOFFICE USERS TABLE
-- =============================================================================
-- This migration creates a separate table for internal backoffice users.
-- These are NOT app/customer users - they are internal staff with backoffice access.
-- =============================================================================

-- Create backoffice_users table
CREATE TABLE IF NOT EXISTS application.backoffice_users (
  backoffice_user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  role TEXT NOT NULL DEFAULT 'operator' CHECK (role IN ('admin', 'operator', 'viewer')),
  status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'verified', 'disabled')),
  is_verified BOOLEAN NOT NULL DEFAULT false,
  
  -- Invite tracking
  invite_token UUID DEFAULT gen_random_uuid(),
  invite_token_expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  invited_by UUID REFERENCES application.backoffice_users(backoffice_user_id),
  
  -- Verification tracking
  verified_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Last login tracking
  last_login_at TIMESTAMPTZ
);

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_backoffice_users_email 
ON application.backoffice_users(email);

-- Index for invite token lookups
CREATE INDEX IF NOT EXISTS idx_backoffice_users_invite_token 
ON application.backoffice_users(invite_token) WHERE is_verified = false;

-- Index for status
CREATE INDEX IF NOT EXISTS idx_backoffice_users_status 
ON application.backoffice_users(status);

-- Enable RLS
ALTER TABLE application.backoffice_users ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users (backoffice access controlled by app logic)
CREATE POLICY "Allow authenticated read on backoffice_users"
ON application.backoffice_users FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated insert on backoffice_users"
ON application.backoffice_users FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated update on backoffice_users"
ON application.backoffice_users FOR UPDATE
TO authenticated
USING (true);

-- Insert default admin (same as current allowed_admin_emails)
INSERT INTO application.backoffice_users (email, display_name, role, status, is_verified, verified_at)
VALUES ('admin@barter-x.com', 'Default Admin', 'admin', 'verified', true, NOW())
ON CONFLICT (email) DO NOTHING;

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION application.update_backoffice_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_backoffice_users_updated_at
BEFORE UPDATE ON application.backoffice_users
FOR EACH ROW
EXECUTE FUNCTION application.update_backoffice_users_updated_at();
