import { query } from "../postgres";

export interface Ticket {
  ticketId: string;
  userId: string | null;
  subject: string;
  description: string | null;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  category: "general" | "technical" | "billing" | "account" | "other";
  assignedTo: string | null;
  resolutionNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt: Date | null;
  // Joined fields
  userName?: string | null;
  userEmail?: string | null;
  assignedToName?: string | null;
}

interface DbTicket {
  ticket_id: string;
  user_id: string | null;
  subject: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  assigned_to: string | null;
  resolution_notes: string | null;
  created_at: Date;
  updated_at: Date;
  resolved_at: Date | null;
  user_name?: string;
  user_email?: string;
  assigned_to_name?: string;
}

function mapToTicket(row: DbTicket): Ticket {
  return {
    ticketId: row.ticket_id,
    userId: row.user_id,
    subject: row.subject,
    description: row.description,
    status: row.status as Ticket["status"],
    priority: row.priority as Ticket["priority"],
    category: row.category as Ticket["category"],
    assignedTo: row.assigned_to,
    resolutionNotes: row.resolution_notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    resolvedAt: row.resolved_at,
    userName: row.user_name,
    userEmail: row.user_email,
    assignedToName: row.assigned_to_name,
  };
}

export async function getTickets(options?: {
  status?: string;
  priority?: string;
  category?: string;
  assignedTo?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ tickets: Ticket[]; total: number }> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (options?.status) {
    conditions.push(`t.status = $${paramIndex++}`);
    params.push(options.status);
  }

  if (options?.priority) {
    conditions.push(`t.priority = $${paramIndex++}`);
    params.push(options.priority);
  }

  if (options?.category) {
    conditions.push(`t.category = $${paramIndex++}`);
    params.push(options.category);
  }

  if (options?.assignedTo) {
    conditions.push(`t.assigned_to = $${paramIndex++}`);
    params.push(options.assignedTo);
  }

  if (options?.search) {
    conditions.push(`(t.subject ILIKE $${paramIndex} OR t.description ILIKE $${paramIndex})`);
    params.push(`%${options.search}%`);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  // Get total count
  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM application.tickets t ${whereClause}`,
    params
  );
  const total = parseInt(countResult[0]?.count || "0", 10);

  // Get tickets with user info
  const limit = options?.limit || 50;
  const offset = options?.offset || 0;

  const ticketsResult = await query<DbTicket>(
    `SELECT 
      t.*,
      u.display_name as user_name,
      u.email as user_email,
      a.display_name as assigned_to_name
    FROM application.tickets t
    LEFT JOIN application.users u ON t.user_id = u.user_id
    LEFT JOIN application.users a ON t.assigned_to = a.user_id
    ${whereClause}
    ORDER BY 
      CASE t.priority 
        WHEN 'urgent' THEN 1 
        WHEN 'high' THEN 2 
        WHEN 'medium' THEN 3 
        WHEN 'low' THEN 4 
      END,
      t.created_at DESC
    LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    [...params, limit, offset]
  );

  return {
    tickets: ticketsResult.map(mapToTicket),
    total,
  };
}

export async function getTicketById(ticketId: string): Promise<Ticket | null> {
  const result = await query<DbTicket>(
    `SELECT 
      t.*,
      u.display_name as user_name,
      u.email as user_email,
      a.display_name as assigned_to_name
    FROM application.tickets t
    LEFT JOIN application.users u ON t.user_id = u.user_id
    LEFT JOIN application.users a ON t.assigned_to = a.user_id
    WHERE t.ticket_id = $1`,
    [ticketId]
  );

  return result[0] ? mapToTicket(result[0]) : null;
}

export async function updateTicket(
  ticketId: string,
  data: {
    status?: string;
    priority?: string;
    category?: string;
    assignedTo?: string | null;
    resolutionNotes?: string;
  }
): Promise<Ticket | null> {
  const updates: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (data.status !== undefined) {
    updates.push(`status = $${paramIndex++}`);
    params.push(data.status);
    
    // Set resolved_at when status changes to resolved or closed
    if (data.status === "resolved" || data.status === "closed") {
      updates.push(`resolved_at = NOW()`);
    }
  }

  if (data.priority !== undefined) {
    updates.push(`priority = $${paramIndex++}`);
    params.push(data.priority);
  }

  if (data.category !== undefined) {
    updates.push(`category = $${paramIndex++}`);
    params.push(data.category);
  }

  if (data.assignedTo !== undefined) {
    updates.push(`assigned_to = $${paramIndex++}`);
    params.push(data.assignedTo);
  }

  if (data.resolutionNotes !== undefined) {
    updates.push(`resolution_notes = $${paramIndex++}`);
    params.push(data.resolutionNotes);
  }

  updates.push(`updated_at = NOW()`);

  if (updates.length === 1) {
    return getTicketById(ticketId);
  }

  params.push(ticketId);

  await query(
    `UPDATE application.tickets 
     SET ${updates.join(", ")}
     WHERE ticket_id = $${paramIndex}`,
    params
  );

  return getTicketById(ticketId);
}

// Create a login issue ticket (for anonymous users having trouble logging in)
export async function createLoginIssueTicket(data: {
  email: string;
  description: string;
  metadata?: {
    errorType?: string;
    errorMessage?: string;
    source?: string;
    context?: string;
    userAgent?: string;
    platform?: string;
  };
}): Promise<{ ticketId: string }> {
  // Include metadata in description since metadata column doesn't exist in table
  const fullDescription = data.metadata 
    ? `${data.description}\n\n---\nEmail: ${data.email}\nError Type: ${data.metadata.errorType || 'N/A'}\nReported At: ${new Date().toISOString()}`
    : data.description;

  const result = await query<{ ticket_id: string }>(
    `INSERT INTO application.tickets (
      user_id,
      subject,
      description,
      status,
      priority,
      category,
      created_at,
      updated_at
    ) VALUES (
      NULL,
      $1,
      $2,
      'open',
      'medium',
      'technical',
      NOW(),
      NOW()
    )
    RETURNING ticket_id`,
    [
      `Login Issue: ${data.email}`,
      fullDescription,
    ]
  );

  return { ticketId: result[0].ticket_id };
}

// Create a general support ticket (for logged-in users)
export async function createSupportTicket(data: {
  userId?: string;
  email: string;
  phone?: string;
  message: string;
}): Promise<{ ticketId: string }> {
  const fullDescription = `${data.message}\n\n---\nContact Email: ${data.email}${data.phone ? `\nPhone: ${data.phone}` : ''}\nSubmitted At: ${new Date().toISOString()}`;

  const result = await query<{ ticket_id: string }>(
    `INSERT INTO application.tickets (
      user_id,
      subject,
      description,
      status,
      priority,
      category,
      created_at,
      updated_at
    ) VALUES (
      $1,
      $2,
      $3,
      'open',
      'medium',
      'general',
      NOW(),
      NOW()
    )
    RETURNING ticket_id`,
    [
      data.userId || null,
      `Support Request: ${data.email}`,
      fullDescription,
    ]
  );

  return { ticketId: result[0].ticket_id };
}

// Create a product review ticket when user creates a new brand/model
// This is called AFTER the temp product is created in the database
export async function createProductReviewTicket(data: {
  userId?: string;
  userEmail?: string;
  tempProductId: string; // Required - links ticket to the temp product
  barterType: string;
  category: string;
  subcategory: string;
  brand: string;
  model: string;
}): Promise<{ ticketId: string }> {
  const description = `
New Product Submission - Requires Review

**Temp Product ID:** ${data.tempProductId}
**Barter Type:** ${data.barterType}
**Category:** ${data.category}
**Subcategory:** ${data.subcategory}
**Brand:** ${data.brand}
**Model/Title:** ${data.model}

---
User ID: ${data.userId || 'N/A'}
User Email: ${data.userEmail || 'N/A'}
Submitted At: ${new Date().toISOString()}

**Action Required:**
1. Review the temp product in Product Catalog > Pending Review
2. Approve/reject the new product entry
3. Add product specifications and image if approved
`.trim();

  const result = await query<{ ticket_id: string }>(
    `INSERT INTO application.tickets (
      user_id,
      subject,
      description,
      status,
      priority,
      category,
      created_at,
      updated_at
    ) VALUES (
      $1,
      $2,
      $3,
      'open',
      'high',
      'product_review',
      NOW(),
      NOW()
    )
    RETURNING ticket_id`,
    [
      data.userId || null,
      `New Product Review: ${data.brand} - ${data.model}`,
      description,
    ]
  );

  return { ticketId: result[0].ticket_id };
}

export async function getTicketStats(): Promise<{
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  urgent: number;
  high: number;
}> {
  const result = await query<{
    total: string;
    open: string;
    in_progress: string;
    resolved: string;
    closed: string;
    urgent: string;
    high: string;
  }>(
    `SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'open') as open,
      COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
      COUNT(*) FILTER (WHERE status = 'resolved') as resolved,
      COUNT(*) FILTER (WHERE status = 'closed') as closed,
      COUNT(*) FILTER (WHERE priority = 'urgent') as urgent,
      COUNT(*) FILTER (WHERE priority = 'high') as high
    FROM application.tickets`
  );

  const stats = result[0];
  return {
    total: parseInt(stats?.total || "0", 10),
    open: parseInt(stats?.open || "0", 10),
    inProgress: parseInt(stats?.in_progress || "0", 10),
    resolved: parseInt(stats?.resolved || "0", 10),
    closed: parseInt(stats?.closed || "0", 10),
    urgent: parseInt(stats?.urgent || "0", 10),
    high: parseInt(stats?.high || "0", 10),
  };
}
