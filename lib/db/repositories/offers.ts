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
  product_id: string | null;
  temp_product_id: string | null;
  created_by_user_id: string;
  title: string | null;
  description: string | null;
  condition: string | null;
  pickup_country_id: string | null;
  pickup_city_id: string | null;
  pickup_address: Record<string, unknown> | null;  // JSONB - full address object
  pickup_notes: string | null;
  status: string | null;
  exchange_preferences: Record<string, unknown> | null;
  offer_info: Record<string, unknown> | null;  // JSONB - dynamic offer fields
  hook_status: string | null;
  expires_at: string | null;
  ready_state: boolean;
  ready_updated_at: string | null;
  lock_level: number;  // smallint in DB
  lock_updated_at: string | null;
  notification_state: number;  // smallint in DB
  notification_updated_at: string | null;
  is_active: boolean;
  is_active_updated_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  product_title?: string;
  product_image_key?: string;
  product_info?: Record<string, unknown> | null;  // JSONB from products table
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
 * Safely parse JSONB - handles both string and already-parsed object
 */
function parseJsonb<T>(value: unknown): T | null {
  if (!value) return null;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }
  return value as T;
}

/**
 * Map database row to Offer type
 * Note: Maps to existing Offer type from lib/types.ts
 */
function mapToOffer(row: DbOffer): Offer {
  // Parse pickup_address from JSONB (may be string or object depending on driver)
  const pickupAddr = parseJsonb<Record<string, string>>(row.pickup_address);
  
  // Parse offer_info from JSONB - supports both old { field_id: value } and new { field_id: { value, label } } format
  const offerInfoObj = parseJsonb<Record<string, unknown>>(row.offer_info);
  const offerInfoValues: OfferInfoFieldValue[] = offerInfoObj 
    ? Object.entries(offerInfoObj).map(([fieldId, fieldData]) => {
        // Check if new format { value, label } or old format (just value)
        const isNewFormat = fieldData && typeof fieldData === 'object' && 'value' in fieldData && 'label' in fieldData;
        if (isNewFormat) {
          const { value, label } = fieldData as { value: unknown; label: string };
          return {
            fieldId,
            fieldName: label,
            fieldType: "text" as const,
            value: value as string | string[],
          };
        } else {
          // Old format - use fieldId as fieldName (backward compatibility)
          return {
            fieldId,
            fieldName: fieldId,
            fieldType: "text" as const,
            value: fieldData as string | string[],
          };
        }
      })
    : [];
  
  // Parse product_info from JSONB
  const productInfoObj = parseJsonb<Record<string, unknown>>(row.product_info);

  return {
    offerId: row.offer_id,
    productId: row.product_id || "",
    tempProductId: row.temp_product_id || undefined,
    isPendingReview: !!row.temp_product_id && !row.product_id,
    ownerUserId: row.created_by_user_id,
    title: row.title || row.product_title || "",
    description: row.description || "",
    hookedCount: 0, // Not in current schema, would need to compute from hooks table
    outgoingHookCount: 0, // Not in current schema, would need to compute from hooks table
    readyForCommit: row.ready_state,
    // Pickup address from JSONB
    pickupAddress: pickupAddr ? {
      country: pickupAddr.country || "",
      city: pickupAddr.city || "",
      state: pickupAddr.state || "",
      postalCode: pickupAddr.postalCode || "",
      addressLine1: pickupAddr.addressLine1 || "",
      addressLine2: pickupAddr.addressLine2 || "",
    } : undefined,
    // Offer info from offer_info JSONB column
    offerInfo: offerInfoValues.length > 0 ? offerInfoValues : undefined,
    // Product info from joined products.product_info
    productInfo: productInfoObj || undefined,
    // Workflow fields
    readyState: row.ready_state,
    escrowPaid: false, // Not in current schema
    lockLevel: parseLockLevel(row.lock_level),
    notificationState: parseNotificationState(row.notification_state),
    isActive: row.is_active,
  };
}

/**
 * Fetch a single offer by ID
 * Includes offer_info, pickup_address, and product_info from joined products table
 */
export async function fetchOfferById(offerId: string): Promise<Offer | null> {
  const sql = `
    SELECT 
      o.*,
      p.title as product_title,
      p.image_key as product_image_key,
      p.product_info as product_info,
      u.display_name as user_display_name
    FROM application.offers o
    LEFT JOIN application.products p ON o.product_id = p.product_id
    LEFT JOIN application.users u ON o.created_by_user_id = u.user_id
    WHERE o.offer_id = $1
  `;

  const result = await query<DbOffer>(sql, [offerId]);
  
  if (result.length === 0) {
    return null;
  }
  
  return mapToOffer(result[0]);
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

  // Data query - includes offer_info, pickup_address, and product_info
  const dataSql = `
    SELECT 
      o.*,
      p.title as product_title,
      p.image_key as product_image_key,
      p.product_info as product_info,
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
 * Note: offer_id must be explicitly generated as there's no default
 * Supports both regular products (productId) and temp products (tempProductId)
 * Saves offer_info and pickup_address as JSONB
 */
export async function createOffer(data: {
  productId: string | null;
  tempProductId?: string | null;
  userId: string;
  title?: string;
  description?: string;
  condition?: string;
  exchangePreferences?: Record<string, unknown>;
  offerInfo?: Record<string, unknown>;  // Dynamic offer fields { field_key: value }
  pickupAddress?: Record<string, unknown>;  // Full address object
}): Promise<Offer> {
  console.log("[v0] Creating offer with data:", { 
    productId: data.productId, 
    tempProductId: data.tempProductId, 
    userId: data.userId,
    hasOfferInfo: !!data.offerInfo,
    hasPickupAddress: !!data.pickupAddress,
  });
  
  const result = await query<DbOffer>(
    `INSERT INTO application.offers (
      offer_id,
      product_id, 
      temp_product_id,
      created_by_user_id, 
      title, 
      description, 
      condition,
      exchange_preferences,
      offer_info,
      pickup_address,
      status,
      ready_state, 
      lock_level, 
      notification_state, 
      is_active, 
      created_at, 
      updated_at
    ) VALUES (
      gen_random_uuid(),
      $1, $2, $3, $4, $5, $6, $7, $8, $9,
      'active',
      false, 0, 0, true, NOW(), NOW()
    ) RETURNING *`,
    [
      data.productId || null,
      data.tempProductId || null,
      data.userId,
      data.title || null,
      data.description || null,
      data.condition || 'good',
      data.exchangePreferences ? JSON.stringify(data.exchangePreferences) : null,
      data.offerInfo ? JSON.stringify(data.offerInfo) : null,
      data.pickupAddress ? JSON.stringify(data.pickupAddress) : null,
    ]
  );

  if (!result[0]) {
    throw new Error("Failed to create offer");
  }

  console.log("[v0] Offer created:", result[0].offer_id);
  return mapToOffer(result[0]);
}

/**
 * Update an offer
 * Supports updating offer_info and pickup_address JSONB fields
 */
export async function updateOffer(
  offerId: string,
  data: Partial<{
    title: string;
    description: string;
    condition: string;
    exchangePreferences: Record<string, unknown>;
    offerInfo: Record<string, unknown>;  // Dynamic offer fields { field_key: value }
    pickupAddress: Record<string, unknown>;  // Full address object
    readyState: boolean;
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
  if (data.condition !== undefined) {
    updates.push(`condition = $${paramIndex++}`);
    values.push(data.condition);
  }
  if (data.exchangePreferences !== undefined) {
    updates.push(`exchange_preferences = $${paramIndex++}`);
    values.push(JSON.stringify(data.exchangePreferences));
  }
  if (data.offerInfo !== undefined) {
    updates.push(`offer_info = $${paramIndex++}`);
    values.push(JSON.stringify(data.offerInfo));
  }
  if (data.pickupAddress !== undefined) {
    updates.push(`pickup_address = $${paramIndex++}`);
    values.push(JSON.stringify(data.pickupAddress));
  }
  if (data.readyState !== undefined) {
    updates.push(`ready_state = $${paramIndex++}, ready_updated_at = NOW()`);
    values.push(data.readyState);
  }
  if (data.lockLevel !== undefined) {
    updates.push(`lock_level = $${paramIndex++}, lock_updated_at = NOW()`);
    values.push(data.lockLevel);
  }
  if (data.notificationState !== undefined) {
    updates.push(`notification_state = $${paramIndex++}, notification_updated_at = NOW()`);
    values.push(data.notificationState);
  }
  if (data.isActive !== undefined) {
    updates.push(`is_active = $${paramIndex++}, is_active_updated_at = NOW()`);
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
