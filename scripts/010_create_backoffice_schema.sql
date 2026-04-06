-- =============================================================================
-- BARTER-X Back Office Schema Additions
-- =============================================================================
-- This migration adds tables and columns required for the Back Office module:
-- 1. allowed_admin_emails - for controlling backoffice access
-- 2. support_tickets - for unified ticket management
-- 3. Product review fields on application.products table
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Allowed Admin Emails Table
-- -----------------------------------------------------------------------------
-- Stores emails that are permitted to access the Back Office
-- Uses simple OTP auth flow (temp: hardcoded 123456)

CREATE TABLE IF NOT EXISTS application.allowed_admin_emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'viewer', 'operator')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES application.users(id),
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_allowed_admin_emails_email 
ON application.allowed_admin_emails(email) WHERE is_active = true;

-- Insert default admin email
INSERT INTO application.allowed_admin_emails (email, name, role)
VALUES ('admin@project-x.com', 'Default Admin', 'admin')
ON CONFLICT (email) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 2. Support Tickets Table
-- -----------------------------------------------------------------------------
-- Unified ticket system for:
-- - Login issues / support requests from app
-- - Feedback / complaints from app
-- - Product review requests (new products needing normalization)

CREATE TABLE IF NOT EXISTS application.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Ticket classification
    source TEXT NOT NULL CHECK (source IN ('login_issue', 'feedback', 'product_review', 'support')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    
    -- Ticket content
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    
    -- Related entities
    user_id UUID REFERENCES application.users(id),
    user_email TEXT,
    related_product_id UUID REFERENCES application.products(id),
    related_offer_id UUID REFERENCES application.offers(id),
    
    -- Additional data (flexible JSONB for any extra info)
    metadata JSONB DEFAULT '{}',
    
    -- Resolution tracking
    assigned_to UUID REFERENCES application.allowed_admin_emails(id),
    resolved_at TIMESTAMPTZ,
    resolution_note TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON application.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_source ON application.support_tickets(source);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON application.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON application.support_tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON application.support_tickets(priority) WHERE status IN ('open', 'in_progress');

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION application.update_support_ticket_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_support_tickets_updated_at ON application.support_tickets;
CREATE TRIGGER trigger_support_tickets_updated_at
    BEFORE UPDATE ON application.support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION application.update_support_ticket_timestamp();

-- -----------------------------------------------------------------------------
-- 3. Product Review Fields
-- -----------------------------------------------------------------------------
-- Add review-related columns to existing products table
-- These support the product normalization workflow

-- Add review status column
ALTER TABLE application.products 
ADD COLUMN IF NOT EXISTS review_status TEXT DEFAULT 'pending' 
CHECK (review_status IN ('pending', 'approved', 'rejected', 'needs_info'));

-- Add review note for admin comments
ALTER TABLE application.products 
ADD COLUMN IF NOT EXISTS review_note TEXT;

-- Add reviewer tracking
ALTER TABLE application.products 
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES application.allowed_admin_emails(id);

ALTER TABLE application.products 
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Add needs_review flag for quick filtering
ALTER TABLE application.products 
ADD COLUMN IF NOT EXISTS needs_review BOOLEAN DEFAULT true;

-- Ensure product_info JSONB column exists (for specifications)
ALTER TABLE application.products 
ADD COLUMN IF NOT EXISTS product_info JSONB DEFAULT '{}';

-- Index for review workflow
CREATE INDEX IF NOT EXISTS idx_products_review_status 
ON application.products(review_status) WHERE needs_review = true;

CREATE INDEX IF NOT EXISTS idx_products_needs_review 
ON application.products(created_at DESC) WHERE needs_review = true;

-- -----------------------------------------------------------------------------
-- 4. Engine Config Table (if not exists)
-- -----------------------------------------------------------------------------
-- Stores trade engine configuration parameters

CREATE TABLE IF NOT EXISTS engine.config (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID REFERENCES application.allowed_admin_emails(id)
);

-- Insert default config values
INSERT INTO engine.config (key, value, description) VALUES
    ('PHASE2_POLL_SECONDS', '5', 'How often the Phase 2 worker polls for new prefixes'),
    ('MAX_PREFIX_PER_TICK', '10', 'Maximum number of SCC prefixes to process per tick'),
    ('RESERVATION_TTL_SECONDS', '300', 'Time-to-live for cycle reservations (5 minutes)'),
    ('RULESET1_STRATEGY', '"shortest_cycle"', 'Cycle selection strategy: shortest_cycle, longest_cycle, random'),
    ('LOCK0_PREFERENCE', 'true', 'Whether to prefer lock_level=0 nodes in tie-breaking'),
    ('SHORTEST_CYCLE_TIEBREAK', 'true', 'Use shortest cycle as secondary tie-breaker')
ON CONFLICT (key) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 5. Backoffice Audit Log (optional but recommended)
-- -----------------------------------------------------------------------------
-- Track important admin actions for compliance

CREATE TABLE IF NOT EXISTS application.backoffice_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_email TEXT NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    details JSONB DEFAULT '{}',
    ip_address INET,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_admin ON application.backoffice_audit_log(admin_email);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON application.backoffice_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON application.backoffice_audit_log(entity_type, entity_id);

-- -----------------------------------------------------------------------------
-- 6. RLS Policies for Back Office Tables
-- -----------------------------------------------------------------------------
-- Note: These policies should be adjusted based on your auth setup

ALTER TABLE application.allowed_admin_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE application.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE application.backoffice_audit_log ENABLE ROW LEVEL SECURITY;

-- For now, allow authenticated users (will be restricted by app logic)
-- In production, these should be more restrictive

CREATE POLICY "Allow admin read on allowed_admin_emails"
ON application.allowed_admin_emails FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow admin all on support_tickets"
ON application.support_tickets FOR ALL
TO authenticated
USING (true);

CREATE POLICY "Allow admin read on audit_log"
ON application.backoffice_audit_log FOR SELECT
TO authenticated
USING (true);

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
