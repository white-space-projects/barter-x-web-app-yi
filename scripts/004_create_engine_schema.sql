-- ============================================================================
-- ENGINE SCHEMA - Internal Graph Processing Support
-- ============================================================================
-- This schema is for internal services only.
-- Not for direct public client access.
-- ============================================================================

-- Create the engine schema
CREATE SCHEMA IF NOT EXISTS engine;

-- ============================================================================
-- A) engine.nodes - Internal node-state mirror
-- ============================================================================

CREATE TABLE IF NOT EXISTS engine.nodes (
  node_id UUID PRIMARY KEY,
  
  -- Readiness state
  ready_state BOOLEAN NOT NULL DEFAULT false,
  ready_updated_at TIMESTAMPTZ NULL,
  
  -- Lock level (0=AVAILABLE, 1=RESERVED, 2=PROCESSING, 3=EXCHANGED)
  lock_level SMALLINT NOT NULL DEFAULT 0,
  lock_updated_at TIMESTAMPTZ NULL,
  
  -- Notification progression (0=none, 1=first, 2=reserved, 3=final)
  notification_state SMALLINT NOT NULL DEFAULT 0,
  notification_updated_at TIMESTAMPTZ NULL,
  
  -- Active/inactive state
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_active_updated_at TIMESTAMPTZ NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT nodes_lock_level_range CHECK (lock_level >= 0 AND lock_level <= 3),
  CONSTRAINT nodes_notification_state_range CHECK (notification_state >= 0 AND notification_state <= 3)
);

-- Indexes for engine.nodes
CREATE INDEX IF NOT EXISTS idx_engine_nodes_lock_level ON engine.nodes(lock_level);
CREATE INDEX IF NOT EXISTS idx_engine_nodes_ready_state ON engine.nodes(ready_state);
CREATE INDEX IF NOT EXISTS idx_engine_nodes_notification_state ON engine.nodes(notification_state);
CREATE INDEX IF NOT EXISTS idx_engine_nodes_is_active ON engine.nodes(is_active);

COMMENT ON TABLE engine.nodes IS 'Internal node-state mirror for graph processing. Maps 1:1 with application.offers.offer_id';

-- ============================================================================
-- B) engine.edges - Internal directed graph edges
-- ============================================================================

CREATE TABLE IF NOT EXISTS engine.edges (
  src_node_id UUID NOT NULL,
  dst_node_id UUID NOT NULL,
  
  -- Active state
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Lock level for edge
  lock_level SMALLINT NOT NULL DEFAULT 0,
  lock_updated_at TIMESTAMPTZ NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Primary key
  PRIMARY KEY (src_node_id, dst_node_id),
  
  -- Constraints
  CONSTRAINT edges_no_self_loop CHECK (src_node_id <> dst_node_id),
  CONSTRAINT edges_lock_level_range CHECK (lock_level >= 0 AND lock_level <= 3)
);

-- Indexes for engine.edges
CREATE INDEX IF NOT EXISTS idx_engine_edges_is_active ON engine.edges(is_active);
CREATE INDEX IF NOT EXISTS idx_engine_edges_src_node_id ON engine.edges(src_node_id);
CREATE INDEX IF NOT EXISTS idx_engine_edges_dst_node_id ON engine.edges(dst_node_id);

COMMENT ON TABLE engine.edges IS 'Internal directed graph edges. Maps to application.hooks (source_offer_id -> target_offer_id)';

-- ============================================================================
-- C) engine.scc_snapshots - SCC snapshot outputs
-- ============================================================================

CREATE TABLE IF NOT EXISTS engine.scc_snapshots (
  id BIGSERIAL PRIMARY KEY,
  
  -- SCC identification
  scc_prefix TEXT NOT NULL,
  
  -- Snapshot data
  nodes JSONB NOT NULL,    -- Array of UUID strings
  cycles JSONB NOT NULL,   -- Array of {cycle:[], cycle_length:int, cycle_fingerprint:text}
  
  -- State flags
  picked BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for engine.scc_snapshots
CREATE INDEX IF NOT EXISTS idx_engine_scc_snapshots_prefix_id ON engine.scc_snapshots(scc_prefix, id DESC);
CREATE INDEX IF NOT EXISTS idx_engine_scc_snapshots_picked ON engine.scc_snapshots(picked);
CREATE INDEX IF NOT EXISTS idx_engine_scc_snapshots_is_active ON engine.scc_snapshots(is_active);

COMMENT ON TABLE engine.scc_snapshots IS 'Stores SCC (Strongly Connected Components) snapshot outputs for cycle detection';
COMMENT ON COLUMN engine.scc_snapshots.nodes IS 'Array of node UUIDs in this SCC';
COMMENT ON COLUMN engine.scc_snapshots.cycles IS 'Array of cycle objects: [{cycle:[], cycle_length:int, cycle_fingerprint:text}]';

-- ============================================================================
-- D) engine.cycle_reservations - Reserved cycle outputs
-- ============================================================================

CREATE TABLE IF NOT EXISTS engine.cycle_reservations (
  id BIGSERIAL PRIMARY KEY,
  
  -- Cycle identification
  cycle_fingerprint TEXT NOT NULL,
  snapshot_id BIGINT NOT NULL,
  scc_prefix TEXT NOT NULL,
  
  -- Cycle data
  cycle JSONB NOT NULL,        -- The cycle path
  node_ids JSONB NOT NULL,     -- Array of node UUIDs in cycle
  cycle_length INT NOT NULL,
  
  -- Status: RESERVED, COMMIT_READY, EXECUTED, EXPIRED, CANCELLED
  status TEXT NOT NULL,
  
  -- Lifecycle timestamps
  reserved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT cycle_reservations_unique_per_snapshot UNIQUE (snapshot_id, cycle_fingerprint),
  CONSTRAINT cycle_reservations_status_values CHECK (
    status IN ('RESERVED', 'COMMIT_READY', 'EXECUTED', 'EXPIRED', 'CANCELLED')
  ),
  
  -- Foreign key to scc_snapshots (optional but recommended for data integrity)
  CONSTRAINT fk_cycle_reservations_snapshot 
    FOREIGN KEY (snapshot_id) REFERENCES engine.scc_snapshots(id) ON DELETE CASCADE
);

-- Indexes for engine.cycle_reservations
CREATE INDEX IF NOT EXISTS idx_engine_cycle_reservations_status ON engine.cycle_reservations(status);
CREATE INDEX IF NOT EXISTS idx_engine_cycle_reservations_expires_at ON engine.cycle_reservations(expires_at);
CREATE INDEX IF NOT EXISTS idx_engine_cycle_reservations_scc_prefix ON engine.cycle_reservations(scc_prefix);
CREATE INDEX IF NOT EXISTS idx_engine_cycle_reservations_snapshot_id ON engine.cycle_reservations(snapshot_id);

COMMENT ON TABLE engine.cycle_reservations IS 'Stores reserved cycles and their lifecycle state';
COMMENT ON COLUMN engine.cycle_reservations.status IS 'RESERVED | COMMIT_READY | EXECUTED | EXPIRED | CANCELLED';

-- ============================================================================
-- E) Updated_at triggers for engine tables
-- ============================================================================

-- Trigger function (reuse existing or create)
CREATE OR REPLACE FUNCTION engine.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to engine.nodes
DROP TRIGGER IF EXISTS update_engine_nodes_updated_at ON engine.nodes;
CREATE TRIGGER update_engine_nodes_updated_at
  BEFORE UPDATE ON engine.nodes
  FOR EACH ROW
  EXECUTE FUNCTION engine.update_updated_at_column();

-- Apply trigger to engine.edges
DROP TRIGGER IF EXISTS update_engine_edges_updated_at ON engine.edges;
CREATE TRIGGER update_engine_edges_updated_at
  BEFORE UPDATE ON engine.edges
  FOR EACH ROW
  EXECUTE FUNCTION engine.update_updated_at_column();

-- Apply trigger to engine.cycle_reservations
DROP TRIGGER IF EXISTS update_engine_cycle_reservations_updated_at ON engine.cycle_reservations;
CREATE TRIGGER update_engine_cycle_reservations_updated_at
  BEFORE UPDATE ON engine.cycle_reservations
  FOR EACH ROW
  EXECUTE FUNCTION engine.update_updated_at_column();

-- ============================================================================
-- F) Row Level Security - Internal Access Only
-- ============================================================================

-- Enable RLS on all engine tables
ALTER TABLE engine.nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE engine.edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE engine.scc_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE engine.cycle_reservations ENABLE ROW LEVEL SECURITY;

-- No public policies are added.
-- Access is restricted to service_role only (default Supabase behavior when RLS is enabled with no policies).
-- Backend services using the service_role key bypass RLS automatically.

COMMENT ON SCHEMA engine IS 'Internal schema for graph processing. Access restricted to service_role only. No public client access.';

-- ============================================================================
-- G) Sync Functions: application -> engine
-- ============================================================================
-- Recommended approach: DB trigger-based sync for real-time consistency.
-- These triggers fire on application table changes and upsert into engine tables.
-- ============================================================================

-- Sync function: application.offers -> engine.nodes
CREATE OR REPLACE FUNCTION engine.sync_offer_to_node()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    -- On delete, mark node as inactive (soft delete)
    UPDATE engine.nodes
    SET 
      is_active = false,
      is_active_updated_at = NOW(),
      updated_at = NOW()
    WHERE node_id = OLD.offer_id;
    RETURN OLD;
  ELSE
    -- Insert or update
    INSERT INTO engine.nodes (
      node_id,
      ready_state,
      ready_updated_at,
      lock_level,
      lock_updated_at,
      notification_state,
      notification_updated_at,
      is_active,
      is_active_updated_at,
      created_at,
      updated_at
    ) VALUES (
      NEW.offer_id,
      COALESCE(NEW.ready_state, false),
      NEW.ready_updated_at,
      COALESCE(NEW.lock_level, 0),
      NEW.lock_updated_at,
      COALESCE(NEW.notification_state, 0),
      NEW.notification_updated_at,
      COALESCE(NEW.is_active, true),
      NEW.is_active_updated_at,
      COALESCE(NEW.created_at, NOW()),
      NOW()
    )
    ON CONFLICT (node_id) DO UPDATE SET
      ready_state = COALESCE(EXCLUDED.ready_state, engine.nodes.ready_state),
      ready_updated_at = COALESCE(EXCLUDED.ready_updated_at, engine.nodes.ready_updated_at),
      lock_level = COALESCE(EXCLUDED.lock_level, engine.nodes.lock_level),
      lock_updated_at = COALESCE(EXCLUDED.lock_updated_at, engine.nodes.lock_updated_at),
      notification_state = COALESCE(EXCLUDED.notification_state, engine.nodes.notification_state),
      notification_updated_at = COALESCE(EXCLUDED.notification_updated_at, engine.nodes.notification_updated_at),
      is_active = COALESCE(EXCLUDED.is_active, engine.nodes.is_active),
      is_active_updated_at = COALESCE(EXCLUDED.is_active_updated_at, engine.nodes.is_active_updated_at),
      updated_at = NOW();
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Sync function: application.hooks -> engine.edges
CREATE OR REPLACE FUNCTION engine.sync_hook_to_edge()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    -- On delete, mark edge as inactive
    UPDATE engine.edges
    SET 
      is_active = false,
      updated_at = NOW()
    WHERE src_node_id = OLD.source_offer_id AND dst_node_id = OLD.target_offer_id;
    RETURN OLD;
  ELSE
    -- Insert or update
    INSERT INTO engine.edges (
      src_node_id,
      dst_node_id,
      is_active,
      lock_level,
      lock_updated_at,
      created_at,
      updated_at
    ) VALUES (
      NEW.source_offer_id,
      NEW.target_offer_id,
      COALESCE(NEW.is_active, true),
      COALESCE(NEW.lock_level, 0),
      NEW.lock_updated_at,
      COALESCE(NEW.created_at, NOW()),
      NOW()
    )
    ON CONFLICT (src_node_id, dst_node_id) DO UPDATE SET
      is_active = COALESCE(EXCLUDED.is_active, engine.edges.is_active),
      lock_level = COALESCE(EXCLUDED.lock_level, engine.edges.lock_level),
      lock_updated_at = COALESCE(EXCLUDED.lock_updated_at, engine.edges.lock_updated_at),
      updated_at = NOW();
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply sync triggers to application tables
DROP TRIGGER IF EXISTS sync_offers_to_nodes ON application.offers;
CREATE TRIGGER sync_offers_to_nodes
  AFTER INSERT OR UPDATE OR DELETE ON application.offers
  FOR EACH ROW
  EXECUTE FUNCTION engine.sync_offer_to_node();

DROP TRIGGER IF EXISTS sync_hooks_to_edges ON application.hooks;
CREATE TRIGGER sync_hooks_to_edges
  AFTER INSERT OR UPDATE OR DELETE ON application.hooks
  FOR EACH ROW
  EXECUTE FUNCTION engine.sync_hook_to_edge();

COMMENT ON FUNCTION engine.sync_offer_to_node IS 'Syncs application.offers changes to engine.nodes';
COMMENT ON FUNCTION engine.sync_hook_to_edge IS 'Syncs application.hooks changes to engine.edges';
