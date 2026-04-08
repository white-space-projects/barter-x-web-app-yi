-- =============================================================================
-- BARTER-X Ticketing System Schema
-- =============================================================================

-- Create tickets table
CREATE TABLE IF NOT EXISTS application.tickets (
    ticket_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_type TEXT NOT NULL CHECK (ticket_type IN ('login_issue', 'feedback', 'product_review')),
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'done')),
    title TEXT NOT NULL,
    description TEXT,
    created_by_user_id UUID REFERENCES application.users(id) ON DELETE SET NULL,
    related_product_id UUID REFERENCES application.products(id) ON DELETE SET NULL,
    related_offer_id UUID REFERENCES application.offers(offer_id) ON DELETE SET NULL,
    source TEXT,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tickets_status ON application.tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_type ON application.tickets(ticket_type);
CREATE INDEX IF NOT EXISTS idx_tickets_user ON application.tickets(created_by_user_id) WHERE created_by_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tickets_product ON application.tickets(related_product_id) WHERE related_product_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON application.tickets(created_at DESC);

-- RLS
ALTER TABLE application.tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all on tickets" ON application.tickets;
CREATE POLICY "Allow all on tickets" ON application.tickets FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon on tickets" ON application.tickets;
CREATE POLICY "Allow anon on tickets" ON application.tickets FOR ALL TO anon USING (true) WITH CHECK (true);
