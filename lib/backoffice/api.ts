/**
 * ============================================================================
 * BACK OFFICE API CLIENT (Minimal)
 * ============================================================================
 * Only auth-related functions are preserved.
 * Other modules have been removed for Backoffice cleanup.
 */

import type { BackOfficeUser, AllowedEmail, LoginResponse } from "./types";

// =============================================================================
// AUTH API
// =============================================================================

const ALLOWED_EMAILS: AllowedEmail[] = [
  { id: "1", email: "admin@barter-x.com", role: "admin", addedAt: "2024-01-01T00:00:00Z", addedBy: "system" },
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
    id: crypto.randomUUID(),
    email,
    role,
    addedAt: new Date().toISOString(),
    addedBy: "admin@barter-x.com",
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
// BACKOFFICE USERS API (for Users tab)
// =============================================================================

interface BackofficeUserData {
  id: string;
  email: string;
  role: string;
  addedAt: string;
  addedBy: string;
  isVerified: boolean;
  displayName?: string;
  status?: string;
  verifiedAt?: string;
}

export async function getBackofficeUsers(): Promise<BackofficeUserData[]> {
  await new Promise((r) => setTimeout(r, 300));
  return ALLOWED_EMAILS.map((e) => ({
    id: e.id,
    email: e.email,
    role: e.role,
    addedAt: e.addedAt,
    addedBy: e.addedBy,
    isVerified: true,
    status: "verified",
  }));
}

export async function inviteBackofficeUser(
  email: string,
  role: "admin" | "operator" | "viewer" = "operator"
): Promise<{ success: boolean; error?: string; magicLink?: string }> {
  await new Promise((r) => setTimeout(r, 300));
  
  const existing = ALLOWED_EMAILS.find((e) => e.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return { success: false, error: "Email already has access" };
  }
  
  const newUser: AllowedEmail = {
    id: crypto.randomUUID(),
    email,
    role,
    addedAt: new Date().toISOString(),
    addedBy: "admin@barter-x.com",
  };
  ALLOWED_EMAILS.push(newUser);
  
  const token = crypto.randomUUID();
  const magicLink = `/backoffice/verify?token=${token}`;
  
  return { success: true, magicLink };
}

export async function regenerateMagicLink(
  userId: string
): Promise<{ success: boolean; error?: string; magicLink?: string }> {
  await new Promise((r) => setTimeout(r, 300));
  
  const user = ALLOWED_EMAILS.find((e) => e.id === userId);
  if (!user) {
    return { success: false, error: "User not found" };
  }
  
  const token = crypto.randomUUID();
  const magicLink = `/backoffice/verify?token=${token}`;
  
  return { success: true, magicLink };
}
