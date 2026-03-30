-- ============================================================================
-- Migration 007: Refactor Users, Sessions, PAT, and Analytics
-- ============================================================================
-- This migration:
-- 1. Refactors application.users to be lean (identity + login only)
-- 2. Creates application.user_profiles for profile page data
-- 3. Creates application.personal_access_tokens for session-based PAT auth
-- 4. Refactors application.sessions as authoritative session table
-- 5. Creates application.session_search_preferences for search history
-- 6. Extends analytics schema with api_logs table
-- 7. Adds indexes, FKs, and RLS policies
-- ============================================================================

-- Enable citext extension for case-insensitive email
CREATE EXTENSION IF NOT EXISTS citext;

-- ============================================================================
-- 1) REFACTOR application.users
-- ============================================================================
-- Goal: Store only identity + login methods, remove profile data

-- Add new columns to users table
ALTER TABLE application.users 
  ADD COLUMN IF NOT EXISTS user_pk uuid DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS phone_e164 text,
  ADD COLUMN IF NOT EXISTS email_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS phone_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS google_id text,
  ADD COLUMN IF NOT EXISTS apple_id text,
  ADD COLUMN IF NOT EXISTS source text;

-- Create unique constraints on new identity columns
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_phone_e164_unique') THEN
    ALTER TABLE application.users ADD CONSTRAINT users_phone_e164_unique UNIQUE (phone_e164);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_google_id_unique') THEN
    ALTER TABLE application.users ADD CONSTRAINT users_google_id_unique UNIQUE (google_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_apple_id_unique') THEN
    ALTER TABLE application.users ADD CONSTRAINT users_apple_id_unique UNIQUE (apple_id);
  END IF;
END $$;

-- Migrate phone to phone_e164 if not already done
UPDATE application.users 
SET phone_e164 = phone 
WHERE phone IS NOT NULL AND phone_e164 IS NULL;

-- Add index on identity lookup columns
CREATE INDEX IF NOT EXISTS idx_users_google_id ON application.users(google_id) WHERE google_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_apple_id ON application.users(apple_id) WHERE apple_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_phone_e164 ON application.users(phone_e164) WHERE phone_e164 IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_source ON application.users(source) WHERE source IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_is_active ON application.users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON application.users(last_login_at);

-- ============================================================================
-- 2) CREATE application.user_profiles
-- ============================================================================
-- Goal: Store all profile page data separately from identity

CREATE TABLE IF NOT EXISTS application.user_profiles (
  profile_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  
  -- Basic profile
  full_name text,
  first_name text,
  last_name text,
  email text,
  phone text,
  bio text,
  avatar_image_key text,
  
  -- Profile address / location
  country_id uuid,
  state_id uuid,
  city_id uuid,
  zip_id uuid,
  address_line_1 text,
  address_line_2 text,
  
  -- Detected location
  detected_country_id uuid,
  detected_state_id uuid,
  detected_city_id uuid,
  detected_zip_id uuid,
  detected_at timestamptz,
  
  -- Profile settings
  notification_settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  profile_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  
  -- Connected account flags
  google_connected boolean NOT NULL DEFAULT false,
  apple_connected boolean NOT NULL DEFAULT false,
  email_connected boolean NOT NULL DEFAULT false,
  
  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Foreign keys
  CONSTRAINT fk_user_profiles_user FOREIGN KEY (user_id) 
    REFERENCES application.users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_user_profiles_country FOREIGN KEY (country_id) 
    REFERENCES application.countries(country_id) ON DELETE SET NULL,
  CONSTRAINT fk_user_profiles_state FOREIGN KEY (state_id) 
    REFERENCES application.states(state_id) ON DELETE SET NULL,
  CONSTRAINT fk_user_profiles_city FOREIGN KEY (city_id) 
    REFERENCES application.cities(city_id) ON DELETE SET NULL,
  CONSTRAINT fk_user_profiles_zip FOREIGN KEY (zip_id) 
    REFERENCES application.zip_codes(zip_id) ON DELETE SET NULL,
  CONSTRAINT fk_user_profiles_detected_country FOREIGN KEY (detected_country_id) 
    REFERENCES application.countries(country_id) ON DELETE SET NULL,
  CONSTRAINT fk_user_profiles_detected_state FOREIGN KEY (detected_state_id) 
    REFERENCES application.states(state_id) ON DELETE SET NULL,
  CONSTRAINT fk_user_profiles_detected_city FOREIGN KEY (detected_city_id) 
    REFERENCES application.cities(city_id) ON DELETE SET NULL,
  CONSTRAINT fk_user_profiles_detected_zip FOREIGN KEY (detected_zip_id) 
    REFERENCES application.zip_codes(zip_id) ON DELETE SET NULL
);

-- Migrate existing user profile data from users table to user_profiles
INSERT INTO application.user_profiles (
  user_id,
  first_name,
  last_name,
  full_name,
  email,
  phone,
  bio,
  avatar_image_key,
  country_id,
  city_id,
  address_line_1,
  address_line_2,
  detected_country_id,
  detected_city_id,
  detected_at,
  notification_settings,
  created_at,
  updated_at
)
SELECT 
  u.user_id,
  u.first_name,
  u.last_name,
  COALESCE(u.first_name || ' ' || u.last_name, u.display_name),
  u.email,
  u.phone,
  u.bio,
  u.avatar_image_key,
  u.profile_country_id,
  u.profile_city_id,
  u.profile_address_line1,
  u.profile_address_line2,
  u.detected_country_id,
  u.detected_city_id,
  u.detected_at,
  COALESCE(u.notification_settings, '{}'::jsonb),
  u.created_at,
  u.updated_at
FROM application.users u
WHERE NOT EXISTS (
  SELECT 1 FROM application.user_profiles up WHERE up.user_id = u.user_id
);

-- Indexes for user_profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON application.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_country ON application.user_profiles(country_id) WHERE country_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_profiles_city ON application.user_profiles(city_id) WHERE city_id IS NOT NULL;

-- ============================================================================
-- 3) CREATE application.sessions (authoritative session table)
-- ============================================================================
-- Goal: Replace/extend existing session handling with full device/platform info

-- Drop existing sessions table if it exists and recreate with new structure
-- First check if we need to backup any existing data
DO $$
DECLARE
  has_sessions boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'application' AND table_name = 'sessions'
  ) INTO has_sessions;
  
  IF NOT has_sessions THEN
    -- Create the sessions table fresh
    CREATE TABLE application.sessions (
      session_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid,
      correlation_id uuid NOT NULL DEFAULT gen_random_uuid(),
      device_id uuid,
      platform text,
      device_type text,
      device_model text,
      os_name text,
      os_version text,
      browser_name text,
      browser_version text,
      ip_address inet,
      user_agent text,
      session_status text NOT NULL DEFAULT 'active',
      started_at timestamptz NOT NULL DEFAULT now(),
      last_activity_at timestamptz,
      ended_at timestamptz,
      duration_seconds integer,
      session_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      
      CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) 
        REFERENCES application.users(user_id) ON DELETE SET NULL,
      CONSTRAINT chk_session_status CHECK (session_status IN ('active', 'expired', 'revoked', 'closed'))
    );
  END IF;
END $$;

-- Add columns if table already exists but is missing them
ALTER TABLE application.sessions
  ADD COLUMN IF NOT EXISTS correlation_id uuid DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS device_id uuid,
  ADD COLUMN IF NOT EXISTS platform text,
  ADD COLUMN IF NOT EXISTS device_type text,
  ADD COLUMN IF NOT EXISTS device_model text,
  ADD COLUMN IF NOT EXISTS os_name text,
  ADD COLUMN IF NOT EXISTS os_version text,
  ADD COLUMN IF NOT EXISTS browser_name text,
  ADD COLUMN IF NOT EXISTS browser_version text,
  ADD COLUMN IF NOT EXISTS ip_address inet,
  ADD COLUMN IF NOT EXISTS user_agent text,
  ADD COLUMN IF NOT EXISTS session_status text DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS started_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS last_activity_at timestamptz,
  ADD COLUMN IF NOT EXISTS ended_at timestamptz,
  ADD COLUMN IF NOT EXISTS duration_seconds integer,
  ADD COLUMN IF NOT EXISTS session_metadata jsonb DEFAULT '{}'::jsonb;

-- Indexes for sessions
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON application.sessions(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sessions_correlation_id ON application.sessions(correlation_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON application.sessions(session_status);
CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON application.sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_sessions_device_id ON application.sessions(device_id) WHERE device_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sessions_platform ON application.sessions(platform) WHERE platform IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sessions_active ON application.sessions(user_id, session_status) WHERE session_status = 'active';

-- ============================================================================
-- 4) CREATE application.personal_access_tokens
-- ============================================================================
-- Goal: Session-oriented PAT auth for API requests

CREATE TABLE IF NOT EXISTS application.personal_access_tokens (
  token_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_id uuid NOT NULL,
  name text NOT NULL,
  token_hash varchar(128) NOT NULL UNIQUE,
  abilities jsonb NOT NULL DEFAULT '[]'::jsonb,
  device_id uuid,
  device_name text,
  last_used_at timestamptz,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  CONSTRAINT fk_pat_user FOREIGN KEY (user_id) 
    REFERENCES application.users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_pat_session FOREIGN KEY (session_id) 
    REFERENCES application.sessions(session_id) ON DELETE CASCADE
);

-- Indexes for personal_access_tokens
CREATE INDEX IF NOT EXISTS idx_pat_user_id ON application.personal_access_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_pat_session_id ON application.personal_access_tokens(session_id);
CREATE INDEX IF NOT EXISTS idx_pat_token_hash ON application.personal_access_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_pat_expires_at ON application.personal_access_tokens(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pat_active ON application.personal_access_tokens(user_id, revoked_at) WHERE revoked_at IS NULL;

-- ============================================================================
-- 5) CREATE application.session_search_preferences
-- ============================================================================
-- Goal: Store search/filter history per session for personalization

CREATE TABLE IF NOT EXISTS application.session_search_preferences (
  search_pref_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  user_id uuid,
  correlation_id uuid,
  search_query text,
  sort_order text,
  view_mode text,
  selected_barter_type_id uuid,
  selected_category_id uuid,
  selected_subcategory_id uuid,
  selected_brand_id uuid,
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  result_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_last_used boolean NOT NULL DEFAULT false,
  searched_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  CONSTRAINT fk_ssp_session FOREIGN KEY (session_id) 
    REFERENCES application.sessions(session_id) ON DELETE CASCADE,
  CONSTRAINT fk_ssp_user FOREIGN KEY (user_id) 
    REFERENCES application.users(user_id) ON DELETE SET NULL,
  CONSTRAINT fk_ssp_barter_type FOREIGN KEY (selected_barter_type_id) 
    REFERENCES application.barter_types(barter_type_id) ON DELETE SET NULL,
  CONSTRAINT fk_ssp_category FOREIGN KEY (selected_category_id) 
    REFERENCES application.categories(category_id) ON DELETE SET NULL,
  CONSTRAINT fk_ssp_subcategory FOREIGN KEY (selected_subcategory_id) 
    REFERENCES application.subcategories(subcategory_id) ON DELETE SET NULL,
  CONSTRAINT fk_ssp_brand FOREIGN KEY (selected_brand_id) 
    REFERENCES application.brands(brand_id) ON DELETE SET NULL
);

-- Indexes for session_search_preferences
CREATE INDEX IF NOT EXISTS idx_ssp_session_id ON application.session_search_preferences(session_id);
CREATE INDEX IF NOT EXISTS idx_ssp_user_id ON application.session_search_preferences(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ssp_searched_at ON application.session_search_preferences(searched_at);
CREATE INDEX IF NOT EXISTS idx_ssp_last_used ON application.session_search_preferences(user_id, is_last_used) WHERE is_last_used = true;
CREATE INDEX IF NOT EXISTS idx_ssp_correlation ON application.session_search_preferences(correlation_id) WHERE correlation_id IS NOT NULL;

-- ============================================================================
-- 6A) EXTEND analytics.events
-- ============================================================================
-- Goal: Add device_info, browser_info, ip_address columns

ALTER TABLE analytics.events
  ADD COLUMN IF NOT EXISTS ip_address inet,
  ADD COLUMN IF NOT EXISTS device_info jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS browser_info jsonb DEFAULT '{}'::jsonb;

-- Additional indexes for analytics.events
CREATE INDEX IF NOT EXISTS idx_events_correlation_id ON analytics.events(correlation_id);
CREATE INDEX IF NOT EXISTS idx_events_session_id ON analytics.events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_user_id ON analytics.events(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON analytics.events(event_timestamp);
CREATE INDEX IF NOT EXISTS idx_events_name ON analytics.events(event_name);
CREATE INDEX IF NOT EXISTS idx_events_category ON analytics.events(event_category) WHERE event_category IS NOT NULL;

-- ============================================================================
-- 6B) CREATE analytics.api_logs
-- ============================================================================
-- Goal: Capture API request/response telemetry

CREATE TABLE IF NOT EXISTS analytics.api_logs (
  api_log_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  correlation_id uuid NOT NULL,
  session_id uuid,
  user_id uuid,
  request_timestamp timestamptz NOT NULL,
  response_timestamp timestamptz,
  duration_ms integer,
  http_method text NOT NULL,
  endpoint_path text NOT NULL,
  status_code integer,
  request_headers jsonb NOT NULL DEFAULT '{}'::jsonb,
  request_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  response_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip_address inet,
  device_info jsonb NOT NULL DEFAULT '{}'::jsonb,
  browser_info jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_code text,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Note: request/response payloads should be truncated at application level
-- to avoid storing sensitive data (tokens, passwords, etc.)
-- Recommend max 10KB per payload in production

-- Indexes for analytics.api_logs
CREATE INDEX IF NOT EXISTS idx_api_logs_correlation_id ON analytics.api_logs(correlation_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_session_id ON analytics.api_logs(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_api_logs_user_id ON analytics.api_logs(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_api_logs_timestamp ON analytics.api_logs(request_timestamp);
CREATE INDEX IF NOT EXISTS idx_api_logs_endpoint ON analytics.api_logs(endpoint_path);
CREATE INDEX IF NOT EXISTS idx_api_logs_status ON analytics.api_logs(status_code) WHERE status_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_api_logs_errors ON analytics.api_logs(error_code) WHERE error_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_api_logs_method_path ON analytics.api_logs(http_method, endpoint_path);

-- ============================================================================
-- 6C) analytics.sessions - Keep as summary/aggregation table
-- ============================================================================
-- Note: analytics.sessions remains as a summary table for analytics purposes
-- It links to application.sessions via session_id but serves analytics aggregation
-- Add columns to align with application.sessions if needed

ALTER TABLE analytics.sessions
  ADD COLUMN IF NOT EXISTS correlation_id uuid,
  ADD COLUMN IF NOT EXISTS platform text,
  ADD COLUMN IF NOT EXISTS session_status text;

CREATE INDEX IF NOT EXISTS idx_analytics_sessions_correlation ON analytics.sessions(correlation_id) WHERE correlation_id IS NOT NULL;

-- ============================================================================
-- 7) UPDATED_AT TRIGGERS
-- ============================================================================

-- Generic updated_at trigger function
CREATE OR REPLACE FUNCTION application.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to new tables
DROP TRIGGER IF EXISTS trg_user_profiles_updated_at ON application.user_profiles;
CREATE TRIGGER trg_user_profiles_updated_at
  BEFORE UPDATE ON application.user_profiles
  FOR EACH ROW EXECUTE FUNCTION application.set_updated_at();

DROP TRIGGER IF EXISTS trg_sessions_updated_at ON application.sessions;
CREATE TRIGGER trg_sessions_updated_at
  BEFORE UPDATE ON application.sessions
  FOR EACH ROW EXECUTE FUNCTION application.set_updated_at();

DROP TRIGGER IF EXISTS trg_pat_updated_at ON application.personal_access_tokens;
CREATE TRIGGER trg_pat_updated_at
  BEFORE UPDATE ON application.personal_access_tokens
  FOR EACH ROW EXECUTE FUNCTION application.set_updated_at();

DROP TRIGGER IF EXISTS trg_ssp_updated_at ON application.session_search_preferences;
CREATE TRIGGER trg_ssp_updated_at
  BEFORE UPDATE ON application.session_search_preferences
  FOR EACH ROW EXECUTE FUNCTION application.set_updated_at();

-- ============================================================================
-- 8) RLS POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE application.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE application.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE application.personal_access_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE application.session_search_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics.api_logs ENABLE ROW LEVEL SECURITY;

-- user_profiles: Users can only read/update their own profile
DROP POLICY IF EXISTS user_profiles_read_own ON application.user_profiles;
CREATE POLICY user_profiles_read_own ON application.user_profiles
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS user_profiles_update_own ON application.user_profiles;
CREATE POLICY user_profiles_update_own ON application.user_profiles
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS user_profiles_insert_own ON application.user_profiles;
CREATE POLICY user_profiles_insert_own ON application.user_profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- sessions: Users can only read their own sessions
DROP POLICY IF EXISTS sessions_read_own ON application.sessions;
CREATE POLICY sessions_read_own ON application.sessions
  FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);

DROP POLICY IF EXISTS sessions_insert ON application.sessions;
CREATE POLICY sessions_insert ON application.sessions
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS sessions_update_own ON application.sessions;
CREATE POLICY sessions_update_own ON application.sessions
  FOR UPDATE USING (user_id = auth.uid() OR user_id IS NULL);

-- personal_access_tokens: Users can only manage their own tokens (no public read)
DROP POLICY IF EXISTS pat_read_own ON application.personal_access_tokens;
CREATE POLICY pat_read_own ON application.personal_access_tokens
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS pat_insert_own ON application.personal_access_tokens;
CREATE POLICY pat_insert_own ON application.personal_access_tokens
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS pat_update_own ON application.personal_access_tokens;
CREATE POLICY pat_update_own ON application.personal_access_tokens
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS pat_delete_own ON application.personal_access_tokens;
CREATE POLICY pat_delete_own ON application.personal_access_tokens
  FOR DELETE USING (user_id = auth.uid());

-- session_search_preferences: Session/user owned
DROP POLICY IF EXISTS ssp_read_own ON application.session_search_preferences;
CREATE POLICY ssp_read_own ON application.session_search_preferences
  FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);

DROP POLICY IF EXISTS ssp_insert ON application.session_search_preferences;
CREATE POLICY ssp_insert ON application.session_search_preferences
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS ssp_update_own ON application.session_search_preferences;
CREATE POLICY ssp_update_own ON application.session_search_preferences
  FOR UPDATE USING (user_id = auth.uid() OR user_id IS NULL);

-- analytics.api_logs: Insert allowed for clients, reads restricted
DROP POLICY IF EXISTS api_logs_insert ON analytics.api_logs;
CREATE POLICY api_logs_insert ON analytics.api_logs
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS api_logs_read_own ON analytics.api_logs;
CREATE POLICY api_logs_read_own ON analytics.api_logs
  FOR SELECT USING (user_id = auth.uid());

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- 
-- Tables Created/Modified:
-- 1. application.users - Added identity columns (google_id, apple_id, source, etc.)
-- 2. application.user_profiles - NEW - Profile page data with geo FKs
-- 3. application.sessions - Extended with full device/platform/correlation info
-- 4. application.personal_access_tokens - NEW - Session-based PAT auth
-- 5. application.session_search_preferences - NEW - Search history per session
-- 6. analytics.events - Extended with device_info, browser_info, ip_address
-- 7. analytics.api_logs - NEW - API request/response telemetry
--
-- PAT/Session Flow:
-- - User authenticates → Session created with correlation_id
-- - PAT created linked to session_id and user_id
-- - Every API request uses PAT token_hash for auth
-- - Session tracks device/platform/activity
-- - PAT can be revoked independently of session
--
-- Search Preferences:
-- - Each search/filter action creates a session_search_preferences record
-- - is_last_used flag marks the most recent preference per user
-- - filters and result_snapshot stored as JSONB for flexibility
-- - Can restore user's last search state on login
--
-- Analytics Linkage:
-- - analytics.events references application.users.user_id and session_id
-- - analytics.api_logs tracks all API calls with correlation_id
-- - Both tables include device_info and browser_info for full telemetry
-- ============================================================================
