/**
 * ============================================================================
 * BACK OFFICE API CLIENT
 * ============================================================================
 * Client-side API calls for backoffice functionality.
 * Uses real API endpoints backed by Supabase.
 */

import type { BackOfficeUser, LoginResponse } from "./types";

// =============================================================================
// AUTH API
// =============================================================================

const HARDCODED_OTP = "123456";

export async function loginWithOtp(email: string, otp: string): Promise<LoginResponse> {
  try {
    const response = await fetch("/api/backoffice/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp }),
    });
    
    const data = await response.json();
    
    if (data.success && data.user) {
      return {
        success: true,
        user: data.user as BackOfficeUser,
      };
    }
    
    return { success: false, error: data.error || "Login failed" };
  } catch (error) {
    console.error("[Backoffice API] Login error:", error);
    return { success: false, error: "An error occurred during login" };
  }
}

// =============================================================================
// MANAGED USERS API (BO, F&F, Beta)
// =============================================================================

export interface ManagedUserData {
  id: string;
  visibleUserId: string;
  email: string;
  displayName: string | null;
  fullName: string | null;
  userType: "bo" | "friends_family" | "beta";
  role: string;
  isActive: boolean;
  isVerified: boolean;
  inviteToken: string | null;
  inviteTokenExpiresAt: string | null;
  invitedAt: string | null;
  invitedBy: string | null;
  verifiedAt: string | null;
  referredBy: string | null;
  userReferenceId: string | null;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
}

/**
 * Get all managed users (BO, F&F, Beta)
 */
export async function getBackofficeUsers(): Promise<ManagedUserData[]> {
  try {
    const response = await fetch("/api/backoffice/users");
    const data = await response.json();
    
    if (data.success) {
      return data.users || [];
    }
    
    console.error("[Backoffice API] Failed to fetch users:", data.error);
    return [];
  } catch (error) {
    console.error("[Backoffice API] Error fetching users:", error);
    return [];
  }
}

/**
 * Invite a new managed user
 */
export async function inviteBackofficeUser(
  email: string,
  userType: "bo" | "friends_family" | "beta" = "bo",
  role: "admin" | "operator" | "viewer" = "operator",
  displayName?: string
): Promise<{ success: boolean; error?: string; magicLink?: string }> {
  try {
    const response = await fetch("/api/backoffice/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        userType,
        role,
        displayName,
      }),
    });
    
    const data = await response.json();
    
    if (data.success) {
      return { success: true, magicLink: data.magicLink };
    }
    
    return { success: false, error: data.error || "Failed to invite user" };
  } catch (error) {
    console.error("[Backoffice API] Error inviting user:", error);
    return { success: false, error: "An error occurred" };
  }
}

/**
 * Regenerate magic link for a user
 */
export async function regenerateMagicLink(
  userId: string
): Promise<{ success: boolean; error?: string; magicLink?: string }> {
  try {
    const response = await fetch(`/api/backoffice/users/${userId}/regenerate-token`, {
      method: "POST",
    });
    
    const data = await response.json();
    
    if (data.success) {
      return { success: true, magicLink: data.magicLink };
    }
    
    return { success: false, error: data.error || "Failed to regenerate link" };
  } catch (error) {
    console.error("[Backoffice API] Error regenerating link:", error);
    return { success: false, error: "An error occurred" };
  }
}

/**
 * Toggle user active/inactive status
 */
export async function toggleUserStatus(
  userId: string,
  active: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`/api/backoffice/users/${userId}/toggle-status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
    
    const data = await response.json();
    
    if (data.success) {
      return { success: true };
    }
    
    return { success: false, error: data.error || "Failed to toggle status" };
  } catch (error) {
    console.error("[Backoffice API] Error toggling status:", error);
    return { success: false, error: "An error occurred" };
  }
}

// =============================================================================
// LEGACY FUNCTIONS (kept for backward compatibility)
// =============================================================================

export interface AllowedEmail {
  id: string;
  email: string;
  role: "admin" | "operator" | "viewer";
  addedAt: string;
  addedBy: string;
}

export async function getAllowedEmails(): Promise<AllowedEmail[]> {
  // Legacy function - use getBackofficeUsers instead
  const users = await getBackofficeUsers();
  return users.map(u => ({
    id: u.id,
    email: u.email,
    role: u.role as "admin" | "operator" | "viewer",
    addedAt: u.createdAt,
    addedBy: u.invitedBy || "system",
  }));
}

export async function addAllowedEmail(
  email: string, 
  role: "admin" | "operator" | "viewer" = "operator"
): Promise<AllowedEmail> {
  // Legacy function - use inviteBackofficeUser instead
  const result = await inviteBackofficeUser(email, "bo", role);
  if (!result.success) {
    throw new Error(result.error);
  }
  return {
    id: crypto.randomUUID(),
    email,
    role,
    addedAt: new Date().toISOString(),
    addedBy: "admin",
  };
}

export async function removeAllowedEmail(id: string): Promise<boolean> {
  // Not implemented - users should be deactivated, not removed
  console.warn("[Backoffice API] removeAllowedEmail is deprecated. Use toggleUserStatus instead.");
  return false;
}
