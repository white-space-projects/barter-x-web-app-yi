/**
 * Hooks Repository
 * =================
 * Server-side data access for hooks from application schema.
 * Uses direct PostgreSQL connection.
 * 
 * Easy to replace with Laravel API calls later.
 */

import { query } from "../postgres";
import type { Hook, HookStatus, LockLevel } from "@/lib/types";

// DbHook interface - only columns that exist per config.yaml
interface DbHook {
  hook_id: string;
  source_offer_id: string;
  target_offer_id: string;
  lock_level: number;
  is_active: boolean;
  // Optional columns that may or may not exist
  correlation_id?: string | null;
  created_by_user_id?: string | null;
  status?: string;
  cycle_id?: string | null;
  created_at?: string;
  updated_at?: string;
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
 * Parse hook status from database
 */
function parseHookStatus(value: string | null): HookStatus {
  const validStatuses: HookStatus[] = ["searching", "cycle_found", "reserved", "processing", "exchanged", "expired"];
  if (value && validStatuses.includes(value as HookStatus)) {
    return value as HookStatus;
  }
  return "searching";
}

/**
 * Map database row to Hook type
 * Status is derived from lock_level per config.yaml
 */
function mapToHook(row: DbHook): Hook {
  // Map lock_level to status: 0=searching, 1=reserved, 2=processing, 3=exchanged
  const lockLevelToStatus: Record<number, HookStatus> = {
    0: "searching",
    1: "reserved",
    2: "processing",
    3: "exchanged",
  };
  
  return {
    hookId: row.hook_id,
    correlationId: row.correlation_id || "",
    fromOfferId: row.source_offer_id,
    toOfferId: row.target_offer_id,
    status: lockLevelToStatus[row.lock_level] || "searching",
    reservedCycleId: row.cycle_id || undefined,
    lockLevel: parseLockLevel(row.lock_level),
    isActive: row.is_active,
  };
}

export interface FetchHooksOptions {
  userId?: string;
  sourceOfferId?: string;
  targetOfferId?: string;
  limit?: number;
}

/**
 * Fetch hooks from application.hooks
 */
export async function fetchHooks(
  options: FetchHooksOptions = {}
): Promise<Hook[]> {
  const { userId, sourceOfferId, targetOfferId, limit = 200 } = options;

  // Build WHERE clause
  const conditions: string[] = ["h.is_active = true"];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (userId) {
    conditions.push(`h.created_by_user_id = $${paramIndex}`);
    params.push(userId);
    paramIndex++;
  }

  if (sourceOfferId) {
    conditions.push(`h.source_offer_id = $${paramIndex}`);
    params.push(sourceOfferId);
    paramIndex++;
  }

  if (targetOfferId) {
    conditions.push(`h.target_offer_id = $${paramIndex}`);
    params.push(targetOfferId);
    paramIndex++;
  }

  const whereClause = `WHERE ${conditions.join(" AND ")}`;

  const sql = `
    SELECT h.*
    FROM application.hooks h
    ${whereClause}
    ORDER BY h.created_at DESC
    LIMIT $${paramIndex}
  `;

  params.push(limit);

  console.log("[v0] Hooks query with params:", { userId, sourceOfferId, targetOfferId, limit });

  const hooks = await query<DbHook>(sql, params);

  console.log("[v0] Hooks fetched:", hooks.length);

  return hooks.map(mapToHook);
}

/**
 * Create a new hook
 * Note: Only using columns that exist in the database per config.yaml:
 * source_offer_id, target_offer_id, lock_level, is_active
 */
export async function createHook(data: {
  sourceOfferId: string;
  targetOfferId: string;
  userId?: string;
}): Promise<Hook> {
  const result = await query<DbHook>(
    `INSERT INTO application.hooks (
      source_offer_id, target_offer_id, lock_level, is_active
    ) VALUES (
      $1, $2, 0, true
    ) RETURNING *`,
    [
      data.sourceOfferId,
      data.targetOfferId,
    ]
  );

  if (!result[0]) {
    throw new Error("Failed to create hook");
  }

  return mapToHook(result[0]);
}

/**
 * Update a hook
 * Note: Only lock_level and is_active are confirmed to exist per config.yaml
 */
export async function updateHook(
  hookId: string,
  data: Partial<{
    lockLevel: LockLevel;
    isActive: boolean;
  }>
): Promise<Hook | null> {
  const updates: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (data.lockLevel !== undefined) {
    updates.push(`lock_level = $${paramIndex++}`);
    values.push(data.lockLevel);
  }
  if (data.isActive !== undefined) {
    updates.push(`is_active = $${paramIndex++}`);
    values.push(data.isActive);
  }

  if (updates.length === 0) {
    const result = await query<DbHook>(
      `SELECT * FROM application.hooks WHERE hook_id = $1`,
      [hookId]
    );
    return result[0] ? mapToHook(result[0]) : null;
  }
  values.push(hookId);

  const result = await query<DbHook>(
    `UPDATE application.hooks SET ${updates.join(", ")} WHERE hook_id = $${paramIndex} RETURNING *`,
    values
  );

  return result[0] ? mapToHook(result[0]) : null;
}

/**
 * Soft delete a hook (set is_active = false)
 */
export async function deleteHook(hookId: string): Promise<boolean> {
  await query(
    `UPDATE application.hooks SET is_active = false WHERE hook_id = $1`,
    [hookId]
  );
  return true;
}
