/**
 * ============================================================================
 * BACKOFFICE USERS REPOSITORY
 * ============================================================================
 * Database operations for managed users (BO, F&F, Beta).
 * 
 * Architecture:
 * - BO users are stored in BOTH backoffice_users (for login compatibility)
 *   AND in users table (for unified management)
 * - F&F and Beta users are stored ONLY in users table
 * - App users are NOT managed here (they use separate auth flow)
 */

import { query } from "@/lib/db/postgres";

// User types that can be managed from backoffice
export type ManagedUserType = "bo" | "friends_family" | "beta";

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

// Extended interface for unified user management
export interface ManagedUser {
  id: string; // Can be backoffice_user_id or user_id depending on source
visibleUserId: string; // User reference ID for display
  email: string;
  displayName: string | null;
  fullName: string | null;
  userType: ManagedUserType;
  role: "admin" | "operator" | "viewer" | "user";
  isActive: boolean;
  isVerified: boolean;
  inviteToken: string | null;
  inviteTokenExpiresAt: Date | null;
  invitedAt: Date | null;
  invitedBy: string | null;
  verifiedAt: Date | null;
  referredBy: string | null;
  userReferenceId: string | null;
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
  user_type: string; // 'bo', 'friends_family', 'beta'
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
 * Note: invitedBy should be a backoffice_user_id (UUID) or email
 * If email is provided, we'll look up the UUID
 */
export async function createBackofficeUser(data: {
  email: string;
  displayName?: string;
  role?: "admin" | "operator" | "viewer";
  invitedBy?: string; // Can be UUID or email
  userType?: ManagedUserType; // Defaults to 'bo'
}): Promise<BackofficeUser> {
  // If invitedBy is an email, look up the backoffice_user_id
  let invitedByUuid: string | null = null;
  if (data.invitedBy) {
    // Check if it's already a UUID format
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.invitedBy);
    if (isUuid) {
      invitedByUuid = data.invitedBy;
    } else {
      // It's an email, look up the UUID
      const inviter = await getBackofficeUserByEmail(data.invitedBy);
      invitedByUuid = inviter?.backofficeUserId || null;
    }
  }
  
  const result = await query<DbBackofficeUser>(
    `INSERT INTO application.backoffice_users (
      email, display_name, role, invited_by, user_type
    ) VALUES ($1, $2, $3, $4, $5)
    RETURNING *`,
    [
      data.email.toLowerCase(),
      data.displayName || null,
      data.role || "operator",
      invitedByUuid,
      data.userType || "bo",
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

/**
 * Regenerate invite token AND update invited_at timestamp
 */
export async function regenerateInviteTokenWithTimestamp(backofficeUserId: string): Promise<BackofficeUser | null> {
  const result = await query<DbBackofficeUser>(
    `UPDATE application.backoffice_users 
     SET invite_token = gen_random_uuid(),
         invite_token_expires_at = NOW() + INTERVAL '7 days',
         invited_at = NOW()
     WHERE backoffice_user_id = $1 AND is_verified = false
     RETURNING *`,
    [backofficeUserId]
  );
  return result[0] ? mapToBackofficeUser(result[0]) : null;
}

/**
 * Enable/disable a backoffice user
 */
export async function setBackofficeUserStatus(
  backofficeUserId: string, 
  status: "verified" | "disabled"
): Promise<BackofficeUser | null> {
  const result = await query<DbBackofficeUser>(
    `UPDATE application.backoffice_users 
     SET status = $2
     WHERE backoffice_user_id = $1
     RETURNING *`,
    [backofficeUserId, status]
  );
  return result[0] ? mapToBackofficeUser(result[0]) : null;
}

// =============================================================================
// MANAGED USERS (BO, F&F, Beta) - Unified View
// =============================================================================
// These functions provide a unified view of all managed user types.
// Currently reads from backoffice_users table only (BO users).
// F&F and Beta users will be added when users table is extended.

/**
 * Get all managed users (BO, F&F, Beta) - excludes app users
 * Reads user_type from database to correctly identify each user
 */
export async function getManagedUsers(): Promise<ManagedUser[]> {
  const result = await query<DbBackofficeUser>(
    `SELECT * FROM application.backoffice_users ORDER BY created_at DESC`
  );
  
  return result.map((row): ManagedUser => {
    // Determine prefix based on user_type
    const userType = (row.user_type || 'bo') as ManagedUserType;
    let prefix = 'BO';
    if (userType === 'friends_family') prefix = 'FF';
    else if (userType === 'beta') prefix = 'BT';
    
    return {
      id: row.backoffice_user_id,
      visibleUserId: `${prefix}-${row.backoffice_user_id.substring(0, 8).toUpperCase()}`,
      email: row.email,
      displayName: row.display_name,
      fullName: row.display_name,
      userType: userType,
      role: row.role as ManagedUser["role"],
      isActive: row.status !== 'disabled',
      isVerified: row.is_verified,
      inviteToken: row.invite_token,
      inviteTokenExpiresAt: row.invite_token_expires_at ? new Date(row.invite_token_expires_at) : null,
      invitedAt: new Date(row.invited_at),
      invitedBy: row.invited_by,
      verifiedAt: row.verified_at ? new Date(row.verified_at) : null,
      referredBy: null,
      userReferenceId: `${prefix}-${row.backoffice_user_id.substring(0, 8).toUpperCase()}`,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      lastLoginAt: row.last_login_at ? new Date(row.last_login_at) : null,
    };
  });
}

/**
 * Create a managed user (BO, F&F, or Beta)
 * All user types are stored in backoffice_users table with user_type column
 */
export async function createManagedUser(data: {
  email: string;
  displayName?: string;
  userType: ManagedUserType;
  role?: "admin" | "operator" | "viewer";
  invitedBy?: string;
}): Promise<ManagedUser> {
  // All user types go to backoffice_users table with user_type column
  const boUser = await createBackofficeUser({
    email: data.email,
    displayName: data.displayName,
    role: data.userType === 'bo' ? data.role : 'viewer', // F&F/Beta default to viewer
    invitedBy: data.invitedBy,
    userType: data.userType,
  });
  
  // Determine prefix based on user type
  let prefix = 'BO';
  if (data.userType === 'friends_family') prefix = 'FF';
  else if (data.userType === 'beta') prefix = 'BT';
  
  return {
    id: boUser.backofficeUserId,
    visibleUserId: `${prefix}-${boUser.backofficeUserId.substring(0, 8).toUpperCase()}`,
    email: boUser.email,
    displayName: boUser.displayName,
    fullName: boUser.displayName,
    userType: data.userType,
    role: boUser.role,
    isActive: boUser.status !== 'disabled',
    isVerified: boUser.isVerified,
    inviteToken: boUser.inviteToken,
    inviteTokenExpiresAt: boUser.inviteTokenExpiresAt,
    invitedAt: boUser.invitedAt,
    invitedBy: boUser.invitedBy,
    verifiedAt: boUser.verifiedAt,
    referredBy: null,
    userReferenceId: `${prefix}-${boUser.backofficeUserId.substring(0, 8).toUpperCase()}`,
    createdAt: boUser.createdAt,
    updatedAt: boUser.updatedAt,
    lastLoginAt: boUser.lastLoginAt,
  };
}
