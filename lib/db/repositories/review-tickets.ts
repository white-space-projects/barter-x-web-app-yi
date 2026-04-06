/**
 * Product Review Tickets Repository
 * ==================================
 * Handles admin workflow for reviewing custom product submissions.
 */

import { query } from "../postgres";

export interface ReviewTicket {
  ticketId: string;
  tempProductId: string;
  createdByUserId: string;
  assignedToUserId?: string;
  status: "pending" | "in_review" | "approved" | "rejected";
  duplicateSuggestionsJson: Record<string, unknown>;
  reviewerNotes?: string;
  selectedBrandId?: string;
  selectedProductId?: string;
  actionTaken?: "reuse_existing" | "create_new_product" | "create_new_brand_and_product";
  createdAt: string;
  updatedAt: string;
  // Joined fields
  tempProduct?: {
    title: string;
    brandName?: string;
    modelName?: string;
    description?: string;
    barterTypeId: string;
  };
  createdByUser?: {
    displayName: string;
    email: string;
  };
}

interface CreateTicketInput {
  tempProductId: string;
  createdByUserId: string;
  duplicateSuggestionsJson?: Record<string, unknown>;
}

/**
 * Create a review ticket for a temp product
 */
export async function createReviewTicket(input: CreateTicketInput): Promise<ReviewTicket> {
  const result = await query<{
    ticket_id: string;
    temp_product_id: string;
    created_by_user_id: string;
    assigned_to_user_id: string | null;
    status: string;
    duplicate_suggestions_json: Record<string, unknown>;
    reviewer_notes: string | null;
    selected_brand_id: string | null;
    selected_product_id: string | null;
    action_taken: string | null;
    created_at: string;
    updated_at: string;
  }>(
    `INSERT INTO application.product_review_tickets 
     (temp_product_id, created_by_user_id, duplicate_suggestions_json)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [
      input.tempProductId,
      input.createdByUserId,
      JSON.stringify(input.duplicateSuggestionsJson || {}),
    ]
  );

  const row = result[0];
  return mapRowToTicket(row);
}

/**
 * Get all pending review tickets with temp product details
 */
export async function getPendingReviewTickets(): Promise<ReviewTicket[]> {
  const result = await query<{
    ticket_id: string;
    temp_product_id: string;
    created_by_user_id: string;
    assigned_to_user_id: string | null;
    status: string;
    duplicate_suggestions_json: Record<string, unknown>;
    reviewer_notes: string | null;
    selected_brand_id: string | null;
    selected_product_id: string | null;
    action_taken: string | null;
    created_at: string;
    updated_at: string;
    temp_title: string;
    temp_brand_name: string | null;
    temp_model_name: string | null;
    temp_description: string | null;
    temp_barter_type_id: string;
    user_display_name: string | null;
    user_email: string;
  }>(
    `SELECT t.*, 
            tp.title as temp_title, 
            tp.brand_name as temp_brand_name,
            tp.model_name as temp_model_name,
            tp.description as temp_description,
            tp.barter_type_id as temp_barter_type_id,
            u.display_name as user_display_name,
            u.email as user_email
     FROM application.product_review_tickets t
     JOIN application.temp_products tp ON t.temp_product_id = tp.temp_product_id
     JOIN application.users u ON t.created_by_user_id = u.user_id
     WHERE t.status IN ('pending', 'in_review')
     ORDER BY t.created_at ASC`
  );

  return result.map((row) => ({
    ...mapRowToTicket(row),
    tempProduct: {
      title: row.temp_title,
      brandName: row.temp_brand_name || undefined,
      modelName: row.temp_model_name || undefined,
      description: row.temp_description || undefined,
      barterTypeId: row.temp_barter_type_id,
    },
    createdByUser: {
      displayName: row.user_display_name || row.user_email,
      email: row.user_email,
    },
  }));
}

/**
 * Get a single review ticket by ID
 */
export async function getReviewTicket(ticketId: string): Promise<ReviewTicket | null> {
  const result = await query<{
    ticket_id: string;
    temp_product_id: string;
    created_by_user_id: string;
    assigned_to_user_id: string | null;
    status: string;
    duplicate_suggestions_json: Record<string, unknown>;
    reviewer_notes: string | null;
    selected_brand_id: string | null;
    selected_product_id: string | null;
    action_taken: string | null;
    created_at: string;
    updated_at: string;
    temp_title: string;
    temp_brand_name: string | null;
    temp_model_name: string | null;
    temp_description: string | null;
    temp_barter_type_id: string;
  }>(
    `SELECT t.*, 
            tp.title as temp_title, 
            tp.brand_name as temp_brand_name,
            tp.model_name as temp_model_name,
            tp.description as temp_description,
            tp.barter_type_id as temp_barter_type_id
     FROM application.product_review_tickets t
     JOIN application.temp_products tp ON t.temp_product_id = tp.temp_product_id
     WHERE t.ticket_id = $1`,
    [ticketId]
  );

  if (result.length === 0) return null;

  const row = result[0];
  return {
    ...mapRowToTicket(row),
    tempProduct: {
      title: row.temp_title,
      brandName: row.temp_brand_name || undefined,
      modelName: row.temp_model_name || undefined,
      description: row.temp_description || undefined,
      barterTypeId: row.temp_barter_type_id,
    },
  };
}

interface ResolveTicketInput {
  ticketId: string;
  status: "approved" | "rejected";
  reviewerNotes?: string;
  selectedBrandId?: string;
  selectedProductId?: string;
  actionTaken?: "reuse_existing" | "create_new_product" | "create_new_brand_and_product";
}

/**
 * Resolve a review ticket (approve or reject)
 */
export async function resolveReviewTicket(input: ResolveTicketInput): Promise<ReviewTicket | null> {
  const result = await query<{
    ticket_id: string;
    temp_product_id: string;
    created_by_user_id: string;
    assigned_to_user_id: string | null;
    status: string;
    duplicate_suggestions_json: Record<string, unknown>;
    reviewer_notes: string | null;
    selected_brand_id: string | null;
    selected_product_id: string | null;
    action_taken: string | null;
    created_at: string;
    updated_at: string;
  }>(
    `UPDATE application.product_review_tickets 
     SET status = $2, 
         reviewer_notes = $3, 
         selected_brand_id = $4, 
         selected_product_id = $5, 
         action_taken = $6,
         updated_at = NOW()
     WHERE ticket_id = $1
     RETURNING *`,
    [
      input.ticketId,
      input.status,
      input.reviewerNotes || null,
      input.selectedBrandId || null,
      input.selectedProductId || null,
      input.actionTaken || null,
    ]
  );

  if (result.length === 0) return null;

  return mapRowToTicket(result[0]);
}

function mapRowToTicket(row: {
  ticket_id: string;
  temp_product_id: string;
  created_by_user_id: string;
  assigned_to_user_id: string | null;
  status: string;
  duplicate_suggestions_json: Record<string, unknown>;
  reviewer_notes: string | null;
  selected_brand_id: string | null;
  selected_product_id: string | null;
  action_taken: string | null;
  created_at: string;
  updated_at: string;
}): ReviewTicket {
  return {
    ticketId: row.ticket_id,
    tempProductId: row.temp_product_id,
    createdByUserId: row.created_by_user_id,
    assignedToUserId: row.assigned_to_user_id || undefined,
    status: row.status as ReviewTicket["status"],
    duplicateSuggestionsJson: row.duplicate_suggestions_json,
    reviewerNotes: row.reviewer_notes || undefined,
    selectedBrandId: row.selected_brand_id || undefined,
    selectedProductId: row.selected_product_id || undefined,
    actionTaken: row.action_taken as ReviewTicket["actionTaken"],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
