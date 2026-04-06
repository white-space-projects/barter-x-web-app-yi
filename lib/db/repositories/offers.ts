/**
 * Offers Repository
 * ==================
 * Server-side data access for offers from application schema.
 * Uses direct PostgreSQL connection.
 * 
 * Easy to replace with Laravel API calls later.
 */

import { query } from "../postgres";
import type { Offer, LockLevel, NotificationState, OfferInfoFieldValue } from "@/lib/types";

interface DbOffer {
  offer_id: string;
  product_id: string;
  created_by_user_id: string;
  title: string | null;
  description: string | null;
  condition: string | null;
  pickup_country_id: string | null;
  pickup_city_id: string | null;
  pickup_address: string | null;
  offer_info: OfferInfoFieldValue[] | null;
  ready_state: boolean;
  escrow_paid: boolean;
  lock_level: number;
  hooked_count: number;
  outgoing_hook_count: number;
  notification_state: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined fields
  product_title?: string;
  product_image_key?: string;
  user_display_name?: string;
}

/**
 * Parse lock level from database to LockLevel type
 */
function parseLockLevel(value: unknown): LockLevel {
  const num = typeof value === "number" ? value : parseInt(String(value), 10);
  if (num >= 0 && num <= 3) return num as LockLevel;
  return 0;
}

/**
 * Parse notification state from database to NotificationState type
 */
function parseNotificationState(value: unknown): NotificationState {
  const num = typeof value === "number" ? value : parseInt(String(value), 10);
  if (num >= 0 && num <= 3) return num as NotificationState;
  return 0;
}

/**
 * Map database row to Offer type
 * Note: Maps to existing Offer type from lib/types.ts
 */
function mapToOffer(row: DbOffer): Offer {
  return {
    offerId: row.offer_id,
    productId: row.product_id,
    ownerUserId: row.created_by_user_id,
    title: row.title || row.product_title || "",
    description: row.description || "",
    hookedCount: row.hooked_count || 0,
    outgoingHookCount: row.outgoing_hook_count || 0,
    readyForCommit: row.ready_state && row.escrow_paid,
    // Pickup address
    pickupAddress: row.pickup_address ? {
      country: "", // Would need to join with countries table
      city: "",    // Would need to join with cities table
      addressLine1: row.pickup_address,
    } : undefined,
    // Offer info
    offerInfo: row.offer_info || undefined,
    // Workflow fields
    readyState: row.ready_state,
    escrowPaid: row.escrow_paid,
    lockLevel: parseLockLevel(row.lock_level),
    notificationState: parseNotificationState(row.notification_state),
    isActive: row.is_active,
  };
}

export interface FetchOffersOptions {
  productId?: string;
  userId?: string;
  limit?: number;
  offset?: number;
}

/**
 * Fetch offers from application.offers
 */
export async function fetchOffers(
  options: FetchOffersOptions = {}
): Promise<{ offers: Offer[]; total: number }> {
  const { productId, userId, limit = 100, offset = 0 } = options;

  // Build WHERE clause
  const conditions: string[] = ["o.is_active = true"];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (productId) {
    conditions.push(`o.product_id = $${paramIndex}`);
    params.push(productId);
    paramIndex++;
  }

  if (userId) {
    conditions.push(`o.created_by_user_id = $${paramIndex}`);
    params.push(userId);
    paramIndex++;
  }

  const whereClause = `WHERE ${conditions.join(" AND ")}`;

  // Count query
  const countSql = `
    SELECT COUNT(*) as total
    FROM application.offers o
    ${whereClause}
  `;

  // Data query
  const dataSql = `
    SELECT 
      o.*,
      p.title as product_title,
      p.image_key as product_image_key,
      u.display_name as user_display_name
    FROM application.offers o
    LEFT JOIN application.products p ON o.product_id = p.product_id
    LEFT JOIN application.users u ON o.created_by_user_id = u.user_id
    ${whereClause}
    ORDER BY o.created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  const countParams = params.slice(); // Copy params for count query
  params.push(limit, offset);

  console.log("[v0] Offers query with params:", { productId, userId, limit, offset });

  const [countResult, offers] = await Promise.all([
    query<{ total: string }>(countSql, countParams),
    query<DbOffer>(dataSql, params),
  ]);

  const total = parseInt(countResult[0]?.total || "0", 10);

  console.log("[v0] Offers fetched:", offers.length, "total:", total);

  return {
    offers: offers.map(mapToOffer),
    total,
  };
}

/**
 * Create a new offer
 */
export async function createOffer(data: {
  productId: string;
  userId: string;
  title?: string;
  description?: string;
  offerInfo?: OfferInfoFieldValue[];
}): Promise<Offer> {
  const result = await query<DbOffer>(
    `INSERT INTO application.offers (
      product_id, created_by_user_id, title, description, offer_info,
      ready_state, escrow_paid, lock_level, hooked_count, outgoing_hook_count,
      notification_state, is_active, created_at, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5,
      false, false, 0, 0, 0, 0, true, NOW(), NOW()
    ) RETURNING *`,
    [
      data.productId,
      data.userId,
      data.title || null,
      data.description || null,
      data.offerInfo ? JSON.stringify(data.offerInfo) : null,
    ]
  );

  if (!result[0]) {
    throw new Error("Failed to create offer");
  }

  return mapToOffer(result[0]);
}

/**
 * Update an offer
 */
export async function updateOffer(
  offerId: string,
  data: Partial<{
    title: string;
    description: string;
    offerInfo: OfferInfoFieldValue[];
    readyState: boolean;
    escrowPaid: boolean;
    lockLevel: LockLevel;
    notificationState: NotificationState;
    isActive: boolean;
  }>
): Promise<Offer | null> {
  const updates: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (data.title !== undefined) {
    updates.push(`title = $${paramIndex++}`);
    values.push(data.title);
  }
  if (data.description !== undefined) {
    updates.push(`description = $${paramIndex++}`);
    values.push(data.description);
  }
  if (data.offerInfo !== undefined) {
    updates.push(`offer_info = $${paramIndex++}`);
    values.push(JSON.stringify(data.offerInfo));
  }
  if (data.readyState !== undefined) {
    updates.push(`ready_state = $${paramIndex++}`);
    values.push(data.readyState);
  }
  if (data.escrowPaid !== undefined) {
    updates.push(`escrow_paid = $${paramIndex++}`);
    values.push(data.escrowPaid);
  }
  if (data.lockLevel !== undefined) {
    updates.push(`lock_level = $${paramIndex++}`);
    values.push(data.lockLevel);
  }
  if (data.notificationState !== undefined) {
    updates.push(`notification_state = $${paramIndex++}`);
    values.push(data.notificationState);
  }
  if (data.isActive !== undefined) {
    updates.push(`is_active = $${paramIndex++}`);
    values.push(data.isActive);
  }

  if (updates.length === 0) {
    // No updates, just fetch and return
    const result = await query<DbOffer>(
      `SELECT * FROM application.offers WHERE offer_id = $1`,
      [offerId]
    );
    return result[0] ? mapToOffer(result[0]) : null;
  }

  updates.push(`updated_at = NOW()`);
  values.push(offerId);

  const result = await query<DbOffer>(
    `UPDATE application.offers SET ${updates.join(", ")} WHERE offer_id = $${paramIndex} RETURNING *`,
    values
  );

  return result[0] ? mapToOffer(result[0]) : null;
}

/**
 * Soft delete an offer (set is_active = false)
 */
export async function deleteOffer(offerId: string): Promise<boolean> {
  await query(
    `UPDATE application.offers SET is_active = false, updated_at = NOW() WHERE offer_id = $1`,
    [offerId]
  );
  return true;
}
