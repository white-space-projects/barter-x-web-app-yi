-- ============================================================================
-- MIGRATION: Add Workflow Fields to Offers and Hooks
-- ============================================================================
-- This migration adds lock states, readiness confirmation, notification
-- progression, and active/inactive behavior fields to support the full
-- barter workflow.
-- 
-- IMPORTANT: This migration extends existing tables - it does NOT remove
-- or rename any existing columns (status, hook_status, etc. remain unchanged)
-- ============================================================================

-- ============================================================================
-- 1. EXTEND application.offers
-- ============================================================================

-- ready_state: user has confirmed they are ready for pickup
ALTER TABLE application.offers 
ADD COLUMN IF NOT EXISTS ready_state BOOLEAN DEFAULT FALSE NOT NULL;

ALTER TABLE application.offers 
ADD COLUMN IF NOT EXISTS ready_updated_at TIMESTAMPTZ;

-- lock_level: workflow lock stage for this offer
-- 0 = AVAILABLE, 1 = RESERVED, 2 = PROCESSING, 3 = EXCHANGED
ALTER TABLE application.offers 
ADD COLUMN IF NOT EXISTS lock_level SMALLINT DEFAULT 0 NOT NULL;

ALTER TABLE application.offers 
ADD COLUMN IF NOT EXISTS lock_updated_at TIMESTAMPTZ;

-- notification_state: progression of system notifications sent
-- 0 = none, 1 = first notification, 2 = reserved notification, 3 = final notification
ALTER TABLE application.offers 
ADD COLUMN IF NOT EXISTS notification_state SMALLINT DEFAULT 0 NOT NULL;

ALTER TABLE application.offers 
ADD COLUMN IF NOT EXISTS notification_updated_at TIMESTAMPTZ;

-- is_active: offer is visible/active in marketplace (soft delete)
ALTER TABLE application.offers 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE NOT NULL;

ALTER TABLE application.offers 
ADD COLUMN IF NOT EXISTS is_active_updated_at TIMESTAMPTZ;

-- Add check constraint for lock_level valid values
ALTER TABLE application.offers 
DROP CONSTRAINT IF EXISTS offers_lock_level_check;

ALTER TABLE application.offers 
ADD CONSTRAINT offers_lock_level_check CHECK (lock_level >= 0 AND lock_level <= 3);

-- Add check constraint for notification_state valid values
ALTER TABLE application.offers 
DROP CONSTRAINT IF EXISTS offers_notification_state_check;

ALTER TABLE application.offers 
ADD CONSTRAINT offers_notification_state_check CHECK (notification_state >= 0 AND notification_state <= 3);

-- Index for filtering active offers
CREATE INDEX IF NOT EXISTS idx_offers_is_active ON application.offers(is_active);

-- Index for filtering by lock_level
CREATE INDEX IF NOT EXISTS idx_offers_lock_level ON application.offers(lock_level);

-- Composite index for common query: active offers by lock level
CREATE INDEX IF NOT EXISTS idx_offers_active_lock ON application.offers(is_active, lock_level);

-- Add comments for documentation
COMMENT ON COLUMN application.offers.ready_state IS 'User has confirmed pickup readiness for this offer';
COMMENT ON COLUMN application.offers.ready_updated_at IS 'Timestamp when ready_state was last changed';
COMMENT ON COLUMN application.offers.lock_level IS 'Workflow lock stage: 0=AVAILABLE, 1=RESERVED, 2=PROCESSING, 3=EXCHANGED';
COMMENT ON COLUMN application.offers.lock_updated_at IS 'Timestamp when lock_level was last changed';
COMMENT ON COLUMN application.offers.notification_state IS 'Notification progression: 0=none, 1=first, 2=reserved, 3=final';
COMMENT ON COLUMN application.offers.notification_updated_at IS 'Timestamp when notification_state was last changed';
COMMENT ON COLUMN application.offers.is_active IS 'Offer visibility in marketplace (false = soft deleted)';
COMMENT ON COLUMN application.offers.is_active_updated_at IS 'Timestamp when is_active was last changed';


-- ============================================================================
-- 2. EXTEND application.hooks
-- ============================================================================

-- lock_level: workflow lock stage for this hook
-- 0 = normal, 1 = RESERVED, 2 = PROCESSING, 3 = DONE
ALTER TABLE application.hooks 
ADD COLUMN IF NOT EXISTS lock_level SMALLINT DEFAULT 0 NOT NULL;

ALTER TABLE application.hooks 
ADD COLUMN IF NOT EXISTS lock_updated_at TIMESTAMPTZ;

-- is_active: hook is active / not soft removed
ALTER TABLE application.hooks 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE NOT NULL;

ALTER TABLE application.hooks 
ADD COLUMN IF NOT EXISTS is_active_updated_at TIMESTAMPTZ;

-- Add check constraint for lock_level valid values
ALTER TABLE application.hooks 
DROP CONSTRAINT IF EXISTS hooks_lock_level_check;

ALTER TABLE application.hooks 
ADD CONSTRAINT hooks_lock_level_check CHECK (lock_level >= 0 AND lock_level <= 3);

-- Index for filtering active hooks
CREATE INDEX IF NOT EXISTS idx_hooks_is_active ON application.hooks(is_active);

-- Index for filtering by lock_level
CREATE INDEX IF NOT EXISTS idx_hooks_lock_level ON application.hooks(lock_level);

-- Add comments for documentation
COMMENT ON COLUMN application.hooks.lock_level IS 'Workflow lock stage: 0=normal, 1=RESERVED, 2=PROCESSING, 3=DONE';
COMMENT ON COLUMN application.hooks.lock_updated_at IS 'Timestamp when lock_level was last changed';
COMMENT ON COLUMN application.hooks.is_active IS 'Hook is active (false = soft deleted/removed)';
COMMENT ON COLUMN application.hooks.is_active_updated_at IS 'Timestamp when is_active was last changed';


-- ============================================================================
-- 3. HELPER FUNCTIONS (optional, for future backend use)
-- ============================================================================

-- Function to check if an offer can be modified (not locked)
CREATE OR REPLACE FUNCTION application.can_modify_offer(p_offer_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_lock_level SMALLINT;
  v_is_active BOOLEAN;
BEGIN
  SELECT lock_level, is_active INTO v_lock_level, v_is_active
  FROM application.offers
  WHERE offer_id = p_offer_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Can only modify if lock_level = 0 (AVAILABLE) and is_active = true
  RETURN v_lock_level = 0 AND v_is_active = TRUE;
END;
$$;

-- Function to check if an offer can be hooked to
CREATE OR REPLACE FUNCTION application.can_hook_offer(p_offer_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_lock_level SMALLINT;
  v_is_active BOOLEAN;
BEGIN
  SELECT lock_level, is_active INTO v_lock_level, v_is_active
  FROM application.offers
  WHERE offer_id = p_offer_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Can hook if lock_level <= 1 (AVAILABLE or RESERVED) and is_active = true
  RETURN v_lock_level <= 1 AND v_is_active = TRUE;
END;
$$;

-- Function to check if a hook can be removed
CREATE OR REPLACE FUNCTION application.can_remove_hook(p_hook_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_lock_level SMALLINT;
  v_is_active BOOLEAN;
BEGIN
  SELECT lock_level, is_active INTO v_lock_level, v_is_active
  FROM application.hooks
  WHERE hook_id = p_hook_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Can only remove if lock_level = 0 (normal) and is_active = true
  RETURN v_lock_level = 0 AND v_is_active = TRUE;
END;
$$;


-- ============================================================================
-- 4. DONE
-- ============================================================================
-- The migration is complete. Existing columns (status, hook_status, etc.)
-- remain unchanged for backwards compatibility.
-- 
-- Lock Level Mapping:
-- Offers: 0=AVAILABLE, 1=RESERVED, 2=PROCESSING, 3=EXCHANGED
-- Hooks:  0=normal, 1=RESERVED, 2=PROCESSING, 3=DONE
-- 
-- UI Badge Mapping:
-- - 0 → Available (Green)
-- - 1 → Reserved (Yellow)
-- - 2 → Processing (Blue)
-- - 3 → Exchanged (Grey) [Closed Offers tab]
-- ============================================================================
