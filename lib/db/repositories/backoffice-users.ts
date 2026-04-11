/**
 * ============================================================================
 * BACKOFFICE USERS REPOSITORY
 * ============================================================================
 * Database operations for internal backoffice users.
 * These are separate from app/customer users.
 */

import { query } from "@/lib/db/postgres";

export interface BackofficeUser {
  backofficeUserId: string;
  email: string;
  displayName: string | null;
  role: "admin" | "operator" | "viewer";
  status: "invited" | "verified" | "disabled";
  isVerified: boolean;
  inviteToken: string | null;
  inviteTokenExpiresAt: Date | null;
  invitedAt: Date;
  invitedBy: string | null;
  verifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
}

interface DbBackofficeUser {
  backoffice_user_id: string;
  email: string;
  display_name: string | null;
  role: string;
  status: string;
  is_verified: boolean;
  invite_token: string | null;
  invite_token_expires_at: string | null;
  invited_at: string;
  invited_by: string | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

function mapToBackofficeUser(row: DbBackofficeUser): BackofficeUser {
  return {
    backofficeUserId: row.backoffice_user_id,
    email: row.email,
    displayName: row.display_name,
    role: row.role as BackofficeUser["role"],
    status: row.status as BackofficeUser["status"],
    isVerified: row.is_verified,
    inviteToken: row.invite_token,
    inviteTokenExpiresAt: row.invite_token_expires_at ? new Date(row.invite_token_expires_at) : null,
    invitedAt: new Date(row.invited_at),
    invitedBy: row.invited_by,
    verifiedAt: row.verified_at ? new Date(row.verified_at) : null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    lastLoginAt: row.last_login_at ? new Date(row.last_login_at) : null,
  };
}

/**
 * Get all backoffice users
 */
export async function getBackofficeUsers(): Promise<BackofficeUser[]> {
  const result = await query<DbBackofficeUser>(
    `SELECT * FROM application.backoffice_users ORDER BY created_at DESC`
  );
  return result.map(mapToBackofficeUser);
}

/**
 * Get backoffice user by email
 */
export async function getBackofficeUserByEmail(email: string): Promise<BackofficeUser | null> {
  const result = await query<DbBackofficeUser>(
    `SELECT * FROM application.backoffice_users WHERE LOWER(email) = LOWER($1)`,
    [email]
  );
  return result[0] ? mapToBackofficeUser(result[0]) : null;
}

/**
 * Get backoffice user by invite token
 */
export async function getBackofficeUserByInviteToken(token: string): Promise<BackofficeUser | null> {
  const result = await query<DbBackofficeUser>(
    `SELECT * FROM application.backoffice_users 
     WHERE invite_token = $1 
     AND is_verified = false
     AND invite_token_expires_at > NOW()`,
    [token]
  );
  return result[0] ? mapToBackofficeUser(result[0]) : null;
}

/**
 * Create a new backoffice user (invite)
 */
export async function createBackofficeUser(data: {
  email: string;
  displayName?: string;
  role?: "admin" | "operator" | "viewer";
  invitedBy?: string;
}): Promise<BackofficeUser> {
  const result = await query<DbBackofficeUser>(
    `INSERT INTO application.backoffice_users (
      email, display_name, role, invited_by
    ) VALUES ($1, $2, $3, $4)
    RETURNING *`,
    [
      data.email.toLowerCase(),
      data.displayName || null,
      data.role || "operator",
      data.invitedBy || null,
    ]
  );
  return mapToBackofficeUser(result[0]);
}

/**
 * Verify a backoffice user (mark as verified)
 */
export async function verifyBackofficeUser(backofficeUserId: string): Promise<BackofficeUser | null> {
  const result = await query<DbBackofficeUser>(
    `UPDATE application.backoffice_users 
     SET is_verified = true, 
         status = 'verified', 
         verified_at = NOW(),
         invite_token = NULL,
         invite_token_expires_at = NULL
     WHERE backoffice_user_id = $1
     RETURNING *`,
    [backofficeUserId]
  );
  return result[0] ? mapToBackofficeUser(result[0]) : null;
}

/**
 * Update last login time
 */
export async function updateBackofficeUserLastLogin(backofficeUserId: string): Promise<void> {
  await query(
    `UPDATE application.backoffice_users SET last_login_at = NOW() WHERE backoffice_user_id = $1`,
    [backofficeUserId]
  );
}

/**
 * Regenerate invite token for a user
 */
export async function regenerateInviteToken(backofficeUserId: string): Promise<BackofficeUser | null> {
  const result = await query<DbBackofficeUser>(
    `UPDATE application.backoffice_users 
     SET invite_token = gen_random_uuid(),
         invite_token_expires_at = NOW() + INTERVAL '7 days'
     WHERE backoffice_user_id = $1 AND is_verified = false
     RETURNING *`,
    [backofficeUserId]
  );
  return result[0] ? mapToBackofficeUser(result[0]) : null;
}

/**
 * Disable a backoffice user
 */
export async function disableBackofficeUser(backofficeUserId: string): Promise<BackofficeUser | null> {
  const result = await query<DbBackofficeUser>(
    `UPDATE application.backoffice_users SET status = 'disabled' WHERE backoffice_user_id = $1 RETURNING *`,
    [backofficeUserId]
  );
  return result[0] ? mapToBackofficeUser(result[0]) : null;
}

/**
 * Check if email exists
 */
export async function backofficeUserExists(email: string): Promise<boolean> {
  const result = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM application.backoffice_users WHERE LOWER(email) = LOWER($1)`,
    [email]
  );
  return parseInt(result[0]?.count || "0") > 0;
}
