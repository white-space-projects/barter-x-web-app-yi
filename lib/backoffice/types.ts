/**
 * ============================================================================
 * BACK OFFICE TYPES
 * ============================================================================
 * All TypeScript types/interfaces for the Back Office module.
 * Kept separate for easy extraction to a different codebase later.
 */

// =============================================================================
// AUTH TYPES
// =============================================================================

export interface BackOfficeUser {
  email: string;
  name?: string;
  role: "admin" | "operator" | "viewer";
  loggedInAt: string;
}

export interface AllowedEmail {
  id: string;
  email: string;
  role: "admin" | "operator" | "viewer";
  addedAt: string;
  addedBy: string;
}

export interface LoginResponse {
  success: boolean;
  user?: BackOfficeUser;
  error?: string;
}

// =============================================================================
// DASHBOARD / METRICS TYPES
// =============================================================================

export type TimeRange = "15m" | "1h" | "3h" | "6h" | "12h" | "16h" | "1d" | "2d" | "1w" | "1m";

export interface DashboardMetrics {
  ingestEvents: {
    "15m": number;
    "1h": number;
    "6h": number;
    "12h": number;
    "24h": number;
  };
  activeEdges: number;
  nodesByLockLevel: {
    level0: number;
    level1: number;
    level2: number;
    level3: number;
  };
  snapshots: {
    total: number;
    active: number;
    unpicked: number;
  };
  cycleReservations: {
    RESERVED: number;
    COMMIT_READY: number;
    EXECUTED: number;
    EXPIRED: number;
    CANCELLED: number;
  };
  lastUpdated: string;
}

// =============================================================================
// SIMULATE TYPES
// =============================================================================

export interface SimulateRequest {
  users: number;
  nodes: number;
  edges: number;
  seed?: number;
}

export interface SimulateResponse {
  success: boolean;
  run_id?: string;
  created_users?: number;
  created_nodes?: number;
  created_edges?: number;
  created_scc_snapshots?: number;
  error?: string;
}

// =============================================================================
// ENGINE TABLE TYPES
// =============================================================================

// Nodes
export interface EngineNode {
  node_id: string;
  ready_state: boolean;
  ready_updated_at: string | null;
  lock_level: 0 | 1 | 2 | 3;
  lock_updated_at: string | null;
  notification_state: 0 | 1 | 2 | 3;
  notification_updated_at: string | null;
  is_active: boolean;
  is_active_updated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NodesFilter {
  lock_level?: 0 | 1 | 2 | 3;
  ready_state?: boolean;
  notification_state?: 0 | 1 | 2 | 3;
  is_active?: boolean;
  search?: string;
}

// Edges
export interface EngineEdge {
  src_node_id: string;
  dst_node_id: string;
  is_active: boolean;
  lock_level: 0 | 1 | 2 | 3;
  lock_updated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EdgesFilter {
  is_active?: boolean;
  src_node_id?: string;
  dst_node_id?: string;
  search?: string;
}

// SCC Snapshots
export interface SccSnapshot {
  id: number;
  scc_prefix: string;
  nodes: string[];
  cycles: Array<{
    cycle: string[];
    cycle_length: number;
    cycle_fingerprint: string;
  }>;
  picked: boolean;
  is_active: boolean;
  created_at: string;
}

export interface SnapshotsFilter {
  scc_prefix?: string;
  picked?: boolean;
  is_active?: boolean;
  search?: string;
}

// Cycle Reservations
export type ReservationStatus = "RESERVED" | "COMMIT_READY" | "EXECUTED" | "EXPIRED" | "CANCELLED";

export interface CycleReservation {
  id: number;
  cycle_fingerprint: string;
  snapshot_id: number;
  scc_prefix: string;
  cycle: string[];
  node_ids: string[];
  cycle_length: number;
  status: ReservationStatus;
  reserved_at: string;
  expires_at: string;
  updated_at: string;
}

export interface ReservationsFilter {
  status?: ReservationStatus;
  cycle_fingerprint?: string;
  scc_prefix?: string;
  search?: string;
}

// Pagination
export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// =============================================================================
// CONFIG TYPES
// =============================================================================

export interface EngineConfig {
  PHASE2_POLL_SECONDS: number;
  MAX_PREFIX_PER_TICK: number;
  RESERVATION_TTL_SECONDS: number;
  RULESET1_STRATEGY: "FIFO" | "LIFO" | "RANDOM";
  LOCK0_PREFERENCE: boolean;
  SHORTEST_CYCLE_TIEBREAK: boolean;
}

// =============================================================================
// AI QUERY TYPES
// =============================================================================

export interface SqlQueryRequest {
  sql: string;
}

export interface SqlQueryResponse {
  success: boolean;
  columns?: string[];
  rows?: Record<string, unknown>[];
  rowCount?: number;
  error?: string;
  executionTime?: number;
}

// =============================================================================
// TICKETS TYPES
// =============================================================================

export type TicketSource = "login_issue" | "feedback" | "product_review" | "support";
export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type TicketPriority = "low" | "medium" | "high" | "urgent";

export interface Ticket {
  id: string;
  source: TicketSource;
  status: TicketStatus;
  priority: TicketPriority;
  subject: string;
  description: string;
  user_id?: string;
  user_email?: string;
  related_product_id?: string;
  related_offer_id?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  resolved_by?: string;
  notes?: string;
}

export interface TicketsFilter {
  source?: TicketSource;
  status?: TicketStatus;
  priority?: TicketPriority;
  search?: string;
}

// =============================================================================
// PRODUCT REVIEW TYPES
// =============================================================================

export type ProductReviewStatus = "pending" | "approved" | "rejected" | "needs_info";

export interface ProductForReview {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  brand: string;
  model: string;
  image_url: string | null;
  product_info: Record<string, string> | null;
  review_status: ProductReviewStatus;
  needs_review: boolean;
  review_note?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ProductInfoField {
  name: string;
  value: string;
}

export interface UpdateProductInfoRequest {
  product_id: string;
  product_info: Record<string, string>;
  review_status?: ProductReviewStatus;
  review_note?: string;
}
