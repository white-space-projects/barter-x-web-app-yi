/**
 * ============================================================================
 * BACK OFFICE TYPES (Minimal)
 * ============================================================================
 * Only auth-related types are preserved.
 * Other types have been removed for Backoffice cleanup.
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
