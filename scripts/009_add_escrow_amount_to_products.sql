-- ============================================================================
-- ADD ESCROW AMOUNT TO PRODUCTS TABLE
-- ============================================================================
-- Escrow amount represents the logistics/commitment amount for each product.
-- This is pre-defined per product/model and is NOT dynamic pricing.
-- 
-- Usage: When user confirms pickup readiness, escrow_amount is used
-- instead of the hardcoded €500 value.
-- ============================================================================

-- Add escrow_amount column to products table
ALTER TABLE application.products
ADD COLUMN IF NOT EXISTS escrow_amount NUMERIC(10,2);

-- Add comment for documentation
COMMENT ON COLUMN application.products.escrow_amount IS 'Logistics/commitment escrow amount for this product. Used during pickup confirmation.';

-- Set default escrow amount for existing products (€100 as safe fallback)
UPDATE application.products
SET escrow_amount = 100.00
WHERE escrow_amount IS NULL;

-- ============================================================================
-- ALSO ADD WORKFLOW FIELDS TO OFFERS IF NOT EXISTS
-- ============================================================================
-- These fields align with the frontend types and are needed for chat logic

-- lock_level: 0=AVAILABLE, 1=RESERVED, 2=PROCESSING, 3=EXCHANGED
ALTER TABLE application.offers
ADD COLUMN IF NOT EXISTS lock_level SMALLINT DEFAULT 0;

-- ready_state: User confirmed pickup readiness
ALTER TABLE application.offers
ADD COLUMN IF NOT EXISTS ready_state BOOLEAN DEFAULT FALSE;

-- is_active: Soft delete / visibility flag
ALTER TABLE application.offers
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- ready_updated_at: Timestamp when ready_state was last updated
ALTER TABLE application.offers
ADD COLUMN IF NOT EXISTS ready_updated_at TIMESTAMPTZ;

-- escrow_paid: Whether escrow has been paid
ALTER TABLE application.offers
ADD COLUMN IF NOT EXISTS escrow_paid BOOLEAN DEFAULT FALSE;

-- escrow_paid_at: Timestamp when escrow was paid
ALTER TABLE application.offers
ADD COLUMN IF NOT EXISTS escrow_paid_at TIMESTAMPTZ;

-- lock_updated_at: Timestamp when lock_level was last updated
ALTER TABLE application.offers
ADD COLUMN IF NOT EXISTS lock_updated_at TIMESTAMPTZ;

-- Add indexes for workflow queries
CREATE INDEX IF NOT EXISTS idx_offers_lock_level ON application.offers(lock_level);
CREATE INDEX IF NOT EXISTS idx_offers_ready_state ON application.offers(ready_state);
CREATE INDEX IF NOT EXISTS idx_offers_is_active ON application.offers(is_active) WHERE is_active = TRUE;

-- ============================================================================
-- ADD WORKFLOW FIELDS TO HOOKS TABLE IF NOT EXISTS
-- ============================================================================

-- Rename source_offer_id to origin_offer_id for consistency (if exists)
-- Note: Only run this if the column exists with old name
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'application' 
    AND table_name = 'hooks' 
    AND column_name = 'source_offer_id'
  ) THEN
    ALTER TABLE application.hooks RENAME COLUMN source_offer_id TO origin_offer_id;
  END IF;
END $$;

-- lock_level for hooks: 0=normal, 1=RESERVED, 2=PROCESSING, 3=DONE
ALTER TABLE application.hooks
ADD COLUMN IF NOT EXISTS lock_level SMALLINT DEFAULT 0;

-- is_active for hooks
ALTER TABLE application.hooks
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- lock_updated_at for hooks
ALTER TABLE application.hooks
ADD COLUMN IF NOT EXISTS lock_updated_at TIMESTAMPTZ;

-- Add indexes for hook workflow queries
CREATE INDEX IF NOT EXISTS idx_hooks_lock_level ON application.hooks(lock_level);
CREATE INDEX IF NOT EXISTS idx_hooks_is_active ON application.hooks(is_active) WHERE is_active = TRUE;

COMMENT ON COLUMN application.offers.lock_level IS '0=AVAILABLE, 1=RESERVED, 2=PROCESSING, 3=EXCHANGED';
COMMENT ON COLUMN application.offers.ready_state IS 'User confirmed pickup readiness (after escrow)';
COMMENT ON COLUMN application.hooks.lock_level IS '0=normal, 1=RESERVED, 2=PROCESSING, 3=DONE';
