/**
 * ============================================================================
 * BACK OFFICE API CLIENT
 * ============================================================================
 * Mock API functions for the Back Office module.
 * Backend developers can wire real API calls later.
 * API base URL is configurable via NEXT_PUBLIC_BACKOFFICE_API_URL env var.
 */

import type {
  BackOfficeUser,
  AllowedEmail,
  LoginResponse,
  DashboardMetrics,
  TimeRange,
  SimulateRequest,
  SimulateResponse,
  EngineNode,
  NodesFilter,
  EngineEdge,
  EdgesFilter,
  SccSnapshot,
  SnapshotsFilter,
  CycleReservation,
  ReservationsFilter,
  PaginationParams,
  PaginatedResponse,
  EngineConfig,
  SqlQueryRequest,
  SqlQueryResponse,
  Ticket,
  TicketsFilter,
  ProductForReview,
  UpdateProductInfoRequest,
  ProductReviewStatus,
} from "./types";

// =============================================================================
// API BASE URL
// =============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKOFFICE_API_URL || "/api/backoffice";

// =============================================================================
// MOCK DATA GENERATORS
// =============================================================================

function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function randomDate(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  return date.toISOString();
}

// =============================================================================
// AUTH API
// =============================================================================

const ALLOWED_EMAILS: AllowedEmail[] = [
  { id: "1", email: "admin@project-x.com", role: "admin", addedAt: "2024-01-01T00:00:00Z", addedBy: "system" },
];

const HARDCODED_OTP = "123456";

export async function loginWithOtp(email: string, otp: string): Promise<LoginResponse> {
  // Simulate API delay
  await new Promise((r) => setTimeout(r, 500));

  // Check if email is allowed
  const allowed = ALLOWED_EMAILS.find((e) => e.email.toLowerCase() === email.toLowerCase());
  if (!allowed) {
    return { success: false, error: "Email not authorized for Back Office access" };
  }

  // Check OTP
  if (otp !== HARDCODED_OTP) {
    return { success: false, error: "Invalid OTP code" };
  }

  return {
    success: true,
    user: {
      email: allowed.email,
      role: allowed.role,
      loggedInAt: new Date().toISOString(),
    },
  };
}

export async function getAllowedEmails(): Promise<AllowedEmail[]> {
  await new Promise((r) => setTimeout(r, 300));
  return [...ALLOWED_EMAILS];
}

export async function addAllowedEmail(email: string, role: "admin" | "operator" | "viewer" = "operator"): Promise<AllowedEmail> {
  await new Promise((r) => setTimeout(r, 300));
  const newEmail: AllowedEmail = {
    id: generateUUID(),
    email,
    role,
    addedAt: new Date().toISOString(),
    addedBy: "admin@project-x.com",
  };
  ALLOWED_EMAILS.push(newEmail);
  return newEmail;
}

export async function removeAllowedEmail(id: string): Promise<boolean> {
  await new Promise((r) => setTimeout(r, 300));
  const index = ALLOWED_EMAILS.findIndex((e) => e.id === id);
  if (index > -1) {
    ALLOWED_EMAILS.splice(index, 1);
    return true;
  }
  return false;
}

// =============================================================================
// DASHBOARD / METRICS API
// =============================================================================

export async function getMetrics(range: TimeRange): Promise<DashboardMetrics> {
  await new Promise((r) => setTimeout(r, 400));
  
  // Mock data based on range
  const multiplier = {
    "15m": 1,
    "1h": 4,
    "3h": 12,
    "6h": 24,
    "12h": 48,
    "16h": 64,
    "1d": 96,
    "2d": 192,
    "1w": 672,
    "1m": 2880,
  }[range] || 1;

  return {
    ingestEvents: {
      "15m": Math.floor(Math.random() * 50 * multiplier),
      "1h": Math.floor(Math.random() * 200 * multiplier),
      "6h": Math.floor(Math.random() * 1000 * multiplier),
      "12h": Math.floor(Math.random() * 2000 * multiplier),
      "24h": Math.floor(Math.random() * 4000 * multiplier),
    },
    activeEdges: Math.floor(Math.random() * 500 + 100),
    nodesByLockLevel: {
      level0: Math.floor(Math.random() * 300 + 50),
      level1: Math.floor(Math.random() * 100 + 20),
      level2: Math.floor(Math.random() * 50 + 10),
      level3: Math.floor(Math.random() * 30 + 5),
    },
    snapshots: {
      total: Math.floor(Math.random() * 200 + 50),
      active: Math.floor(Math.random() * 100 + 25),
      unpicked: Math.floor(Math.random() * 50 + 10),
    },
    cycleReservations: {
      RESERVED: Math.floor(Math.random() * 20 + 5),
      COMMIT_READY: Math.floor(Math.random() * 10 + 2),
      EXECUTED: Math.floor(Math.random() * 100 + 30),
      EXPIRED: Math.floor(Math.random() * 15 + 3),
      CANCELLED: Math.floor(Math.random() * 10 + 2),
    },
    lastUpdated: new Date().toISOString(),
  };
}

// =============================================================================
// SIMULATE API
// =============================================================================

export async function simulate(payload: SimulateRequest): Promise<SimulateResponse> {
  await new Promise((r) => setTimeout(r, 1500));

  return {
    success: true,
    run_id: generateUUID(),
    created_users: payload.users,
    created_nodes: payload.nodes,
    created_edges: payload.edges,
    created_scc_snapshots: Math.floor(payload.nodes / 10),
  };
}

// =============================================================================
// ENGINE TABLES API
// =============================================================================

// Nodes
export async function getNodes(
  filters: NodesFilter,
  pagination: PaginationParams
): Promise<PaginatedResponse<EngineNode>> {
  await new Promise((r) => setTimeout(r, 400));

  const total = 150;
  const nodes: EngineNode[] = Array.from({ length: pagination.pageSize }, (_, i) => ({
    node_id: generateUUID(),
    ready_state: Math.random() > 0.5,
    ready_updated_at: randomDate(7),
    lock_level: (Math.floor(Math.random() * 4) as 0 | 1 | 2 | 3),
    lock_updated_at: randomDate(3),
    notification_state: (Math.floor(Math.random() * 4) as 0 | 1 | 2 | 3),
    notification_updated_at: randomDate(5),
    is_active: Math.random() > 0.2,
    is_active_updated_at: randomDate(10),
    created_at: randomDate(30),
    updated_at: randomDate(7),
  }));

  return {
    data: nodes,
    total,
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalPages: Math.ceil(total / pagination.pageSize),
  };
}

// Edges
export async function getEdges(
  filters: EdgesFilter,
  pagination: PaginationParams
): Promise<PaginatedResponse<EngineEdge>> {
  await new Promise((r) => setTimeout(r, 400));

  const total = 300;
  const edges: EngineEdge[] = Array.from({ length: pagination.pageSize }, () => ({
    src_node_id: generateUUID(),
    dst_node_id: generateUUID(),
    is_active: Math.random() > 0.2,
    lock_level: (Math.floor(Math.random() * 4) as 0 | 1 | 2 | 3),
    lock_updated_at: randomDate(3),
    created_at: randomDate(30),
    updated_at: randomDate(7),
  }));

  return {
    data: edges,
    total,
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalPages: Math.ceil(total / pagination.pageSize),
  };
}

// Snapshots
export async function getSnapshots(
  filters: SnapshotsFilter,
  pagination: PaginationParams
): Promise<PaginatedResponse<SccSnapshot>> {
  await new Promise((r) => setTimeout(r, 400));

  const total = 80;
  const snapshots: SccSnapshot[] = Array.from({ length: pagination.pageSize }, (_, i) => ({
    id: pagination.page * pagination.pageSize + i + 1,
    scc_prefix: `scc_${Math.random().toString(36).substring(2, 8)}`,
    nodes: Array.from({ length: Math.floor(Math.random() * 5) + 2 }, () => generateUUID()),
    cycles: Array.from({ length: Math.floor(Math.random() * 3) + 1 }, () => ({
      cycle: Array.from({ length: Math.floor(Math.random() * 3) + 2 }, () => generateUUID()),
      cycle_length: Math.floor(Math.random() * 3) + 2,
      cycle_fingerprint: `fp_${Math.random().toString(36).substring(2, 12)}`,
    })),
    picked: Math.random() > 0.7,
    is_active: Math.random() > 0.2,
    created_at: randomDate(14),
  }));

  return {
    data: snapshots,
    total,
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalPages: Math.ceil(total / pagination.pageSize),
  };
}

// Reservations
export async function getReservations(
  filters: ReservationsFilter,
  pagination: PaginationParams
): Promise<PaginatedResponse<CycleReservation>> {
  await new Promise((r) => setTimeout(r, 400));

  const statuses: CycleReservation["status"][] = ["RESERVED", "COMMIT_READY", "EXECUTED", "EXPIRED", "CANCELLED"];
  const total = 60;
  const reservations: CycleReservation[] = Array.from({ length: pagination.pageSize }, (_, i) => {
    const nodeIds = Array.from({ length: Math.floor(Math.random() * 4) + 2 }, () => generateUUID());
    return {
      id: pagination.page * pagination.pageSize + i + 1,
      cycle_fingerprint: `fp_${Math.random().toString(36).substring(2, 12)}`,
      snapshot_id: Math.floor(Math.random() * 100) + 1,
      scc_prefix: `scc_${Math.random().toString(36).substring(2, 8)}`,
      cycle: nodeIds,
      node_ids: nodeIds,
      cycle_length: nodeIds.length,
      status: filters.status || statuses[Math.floor(Math.random() * statuses.length)],
      reserved_at: randomDate(7),
      expires_at: new Date(Date.now() + Math.random() * 86400000 * 3).toISOString(),
      updated_at: randomDate(3),
    };
  });

  return {
    data: reservations,
    total,
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalPages: Math.ceil(total / pagination.pageSize),
  };
}

// =============================================================================
// CONFIG API
// =============================================================================

let mockConfig: EngineConfig = {
  PHASE2_POLL_SECONDS: 5,
  MAX_PREFIX_PER_TICK: 10,
  RESERVATION_TTL_SECONDS: 300,
  RULESET1_STRATEGY: "FIFO",
  LOCK0_PREFERENCE: true,
  SHORTEST_CYCLE_TIEBREAK: true,
};

export async function getConfig(): Promise<EngineConfig> {
  await new Promise((r) => setTimeout(r, 300));
  return { ...mockConfig };
}

export async function updateConfig(config: Partial<EngineConfig>): Promise<EngineConfig> {
  await new Promise((r) => setTimeout(r, 500));
  mockConfig = { ...mockConfig, ...config };
  return { ...mockConfig };
}

// =============================================================================
// SQL QUERY API
// =============================================================================

export async function runSqlQuery(request: SqlQueryRequest): Promise<SqlQueryResponse> {
  await new Promise((r) => setTimeout(r, 800));

  const sql = request.sql.toLowerCase();

  // Block non-engine queries
  if (sql.includes("application.") || (!sql.includes("engine.") && !sql.includes("from engine"))) {
    return {
      success: false,
      error: "Only engine.* schema queries are allowed. Access to application.* schema is blocked.",
    };
  }

  // Mock response based on query type
  if (sql.includes("select") && sql.includes("engine.nodes")) {
    return {
      success: true,
      columns: ["node_id", "lock_level", "ready_state", "is_active"],
      rows: Array.from({ length: 5 }, () => ({
        node_id: generateUUID(),
        lock_level: Math.floor(Math.random() * 4),
        ready_state: Math.random() > 0.5,
        is_active: Math.random() > 0.2,
      })),
      rowCount: 5,
      executionTime: Math.floor(Math.random() * 100) + 10,
    };
  }

  if (sql.includes("select") && sql.includes("engine.edges")) {
    return {
      success: true,
      columns: ["src_node_id", "dst_node_id", "is_active"],
      rows: Array.from({ length: 5 }, () => ({
        src_node_id: generateUUID(),
        dst_node_id: generateUUID(),
        is_active: Math.random() > 0.2,
      })),
      rowCount: 5,
      executionTime: Math.floor(Math.random() * 100) + 10,
    };
  }

  if (sql.includes("count")) {
    return {
      success: true,
      columns: ["count"],
      rows: [{ count: Math.floor(Math.random() * 500) + 50 }],
      rowCount: 1,
      executionTime: Math.floor(Math.random() * 50) + 5,
    };
  }

  return {
    success: true,
    columns: ["result"],
    rows: [{ result: "Query executed successfully" }],
    rowCount: 1,
    executionTime: Math.floor(Math.random() * 100) + 10,
  };
}

// =============================================================================
// TICKETS API
// =============================================================================

const mockTickets: Ticket[] = [
  {
    id: "tkt-001",
    source: "login_issue",
    status: "open",
    priority: "high",
    subject: "Cannot login with Google",
    description: "User reports Google OAuth not working on mobile Safari",
    user_email: "user1@example.com",
    created_at: randomDate(2),
    updated_at: randomDate(1),
  },
  {
    id: "tkt-002",
    source: "feedback",
    status: "in_progress",
    priority: "medium",
    subject: "Feature request: Dark mode toggle",
    description: "Would like ability to switch between dark and light mode",
    user_email: "user2@example.com",
    created_at: randomDate(5),
    updated_at: randomDate(3),
  },
  {
    id: "tkt-003",
    source: "product_review",
    status: "open",
    priority: "medium",
    subject: "New product needs review",
    description: "User created new product: iPhone 15 Pro Max - needs image and specs",
    product_id: "prod-123",
    user_email: "seller@example.com",
    created_at: randomDate(1),
    updated_at: randomDate(1),
  },
  {
    id: "tkt-004",
    source: "complaint",
    status: "resolved",
    priority: "low",
    subject: "Slow loading times",
    description: "App takes too long to load products on mobile",
    user_email: "user3@example.com",
    created_at: randomDate(10),
    updated_at: randomDate(7),
    resolved_at: randomDate(7),
    resolved_by: "admin@project-x.com",
    notes: "Performance optimizations deployed",
  },
];

export async function getTickets(
  filters: TicketsFilter,
  pagination: PaginationParams
): Promise<PaginatedResponse<Ticket>> {
  await new Promise((r) => setTimeout(r, 400));

  let filtered = [...mockTickets];

  if (filters.source) {
    filtered = filtered.filter((t) => t.source === filters.source);
  }
  if (filters.status) {
    filtered = filtered.filter((t) => t.status === filters.status);
  }
  if (filters.priority) {
    filtered = filtered.filter((t) => t.priority === filters.priority);
  }
  if (filters.search) {
    const search = filters.search.toLowerCase();
    filtered = filtered.filter(
      (t) =>
        t.subject.toLowerCase().includes(search) ||
        t.description.toLowerCase().includes(search) ||
        t.user_email?.toLowerCase().includes(search)
    );
  }

  const total = filtered.length;
  const start = (pagination.page - 1) * pagination.pageSize;
  const data = filtered.slice(start, start + pagination.pageSize);

  return {
    data,
    total,
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalPages: Math.ceil(total / pagination.pageSize),
  };
}

export async function getTicketById(id: string): Promise<Ticket | null> {
  await new Promise((r) => setTimeout(r, 300));
  return mockTickets.find((t) => t.id === id) || null;
}

export async function updateTicketStatus(
  id: string,
  status: Ticket["status"],
  notes?: string
): Promise<Ticket | null> {
  await new Promise((r) => setTimeout(r, 400));
  const ticket = mockTickets.find((t) => t.id === id);
  if (ticket) {
    ticket.status = status;
    ticket.updated_at = new Date().toISOString();
    if (notes) ticket.notes = notes;
    if (status === "resolved") {
      ticket.resolved_at = new Date().toISOString();
      ticket.resolved_by = "admin@project-x.com";
    }
  }
  return ticket || null;
}

// =============================================================================
// PRODUCT REVIEW API
// =============================================================================

const mockProductsForReview: ProductForReview[] = [
  {
    product_id: "prod-001",
    title: "iPhone 15 Pro Max",
    category: "Goods",
    subcategory: "Smartphones",
    brand: "Apple",
    model: "iPhone 15 Pro Max",
    image_url: undefined,
    product_info: {},
    review_status: "pending",
    needs_review: true,
    created_at: randomDate(3),
    updated_at: randomDate(2),
  },
  {
    product_id: "prod-002",
    title: "Samsung Galaxy S24 Ultra",
    category: "Goods",
    subcategory: "Smartphones",
    brand: "Samsung",
    model: "Galaxy S24 Ultra",
    image_url: "/placeholder.svg",
    product_info: { "Storage": "256GB", "Color": "Black" },
    review_status: "in_review",
    needs_review: true,
    created_at: randomDate(5),
    updated_at: randomDate(1),
  },
  {
    product_id: "prod-003",
    title: "MacBook Pro 16",
    category: "Goods",
    subcategory: "Laptops",
    brand: "Apple",
    model: "MacBook Pro 16 M3",
    image_url: "/placeholder.svg",
    product_info: { "RAM": "32GB", "Storage": "1TB SSD", "Chip": "M3 Pro" },
    review_status: "approved",
    needs_review: false,
    reviewed_by: "admin@project-x.com",
    reviewed_at: randomDate(10),
    created_at: randomDate(20),
    updated_at: randomDate(10),
  },
];

export async function getProductsForReview(
  status?: ProductReviewStatus,
  pagination?: PaginationParams
): Promise<PaginatedResponse<ProductForReview>> {
  await new Promise((r) => setTimeout(r, 400));

  let filtered = [...mockProductsForReview];
  if (status) {
    filtered = filtered.filter((p) => p.review_status === status);
  }

  const pag = pagination || { page: 1, pageSize: 20 };
  const total = filtered.length;
  const start = (pag.page - 1) * pag.pageSize;
  const data = filtered.slice(start, start + pag.pageSize);

  return {
    data,
    total,
    page: pag.page,
    pageSize: pag.pageSize,
    totalPages: Math.ceil(total / pag.pageSize),
  };
}

export async function getProductForReview(productId: string): Promise<ProductForReview | null> {
  await new Promise((r) => setTimeout(r, 300));
  return mockProductsForReview.find((p) => p.product_id === productId) || null;
}

export async function updateProductImage(productId: string, imageUrl: string): Promise<boolean> {
  await new Promise((r) => setTimeout(r, 500));
  const product = mockProductsForReview.find((p) => p.product_id === productId);
  if (product) {
    product.image_url = imageUrl;
    product.updated_at = new Date().toISOString();
    return true;
  }
  return false;
}

export async function updateProductInfo(request: UpdateProductInfoRequest): Promise<ProductForReview | null> {
  await new Promise((r) => setTimeout(r, 500));
  const product = mockProductsForReview.find((p) => p.product_id === request.product_id);
  if (product) {
    product.product_info = request.product_info;
    if (request.review_status) product.review_status = request.review_status;
    if (request.review_note) product.review_note = request.review_note;
    product.updated_at = new Date().toISOString();
    if (request.review_status === "approved" || request.review_status === "rejected") {
      product.reviewed_by = "admin@project-x.com";
      product.reviewed_at = new Date().toISOString();
      product.needs_review = false;
    }
    return product;
  }
  return null;
}
