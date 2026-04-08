-- =============================================================================
-- BARTER-X Ticketing System Schema
-- =============================================================================
-- Creates the tickets table for the Back Office ticketing module.
-- Supports ticket types: login_issue, feedback, product_review
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Tickets Table
-- -----------------------------------------------------------------------------
-- Main ticketing table for Back Office workflow

CREATE TABLE IF NOT EXISTS application.tickets (
    ticket_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Ticket classification
    ticket_type TEXT NOT NULL CHECK (ticket_type IN ('login_issue', 'feedback', 'product_review')),
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'done')),
    
    -- Ticket content
    title TEXT NOT NULL,
    description TEXT,
    
    -- Related entities (all nullable for flexibility)
    created_by_user_id UUID REFERENCES application.users(id) ON DELETE SET NULL,
    related_product_id UUID REFERENCES application.products(id) ON DELETE SET NULL,
    related_offer_id UUID REFERENCES application.offers(offer_id) ON DELETE SET NULL,
    
    -- Source tracking (where the ticket originated from)
    source TEXT,
    
    -- Flexible metadata for additional info
    metadata JSONB NOT NULL DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 2. Indexes for Common Queries
-- -----------------------------------------------------------------------------

-- Status filter (most common filter)
CREATE INDEX IF NOT EXISTS idx_tickets_status 
ON application.tickets(status);

-- Ticket type filter
CREATE INDEX IF NOT EXISTS idx_tickets_type 
ON application.tickets(ticket_type);

-- User lookup
CREATE INDEX IF NOT EXISTS idx_tickets_user 
ON application.tickets(created_by_user_id) WHERE created_by_user_id IS NOT NULL;

-- Product lookup (important for product_review tickets)
CREATE INDEX IF NOT EXISTS idx_tickets_product 
ON application.tickets(related_product_id) WHERE related_product_id IS NOT NULL;

-- Created at for sorting (newest first is common)
CREATE INDEX IF NOT EXISTS idx_tickets_created_at 
ON application.tickets(created_at DESC);

-- Composite index for common list query pattern
CREATE INDEX IF NOT EXISTS idx_tickets_status_type_created 
ON application.tickets(status, ticket_type, created_at DESC);

-- -----------------------------------------------------------------------------
-- 3. Auto-update Timestamp Trigger
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION application.update_ticket_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_tickets_updated_at ON application.tickets;
CREATE TRIGGER trigger_tickets_updated_at
    BEFORE UPDATE ON application.tickets
    FOR EACH ROW
    EXECUTE FUNCTION application.update_ticket_timestamp();

-- -----------------------------------------------------------------------------
-- 4. RLS Policies (if needed)
-- -----------------------------------------------------------------------------

ALTER TABLE application.tickets ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users full access (backoffice will handle auth)
CREATE POLICY "Allow all on tickets"
ON application.tickets FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Also allow anon for API routes that don't use auth
CREATE POLICY "Allow anon read on tickets"
ON application.tickets FOR SELECT
TO anon
USING (true);

CREATE POLICY "Allow anon insert on tickets"
ON application.tickets FOR INSERT
TO anon
WITH CHECK (true);

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
