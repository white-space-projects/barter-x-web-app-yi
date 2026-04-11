/**
 * ============================================================================
 * BACKOFFICE USERS API
 * ============================================================================
 * API for managing internal backoffice users (separate from app users).
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getBackofficeUsers,
  createBackofficeUser,
  backofficeUserExists,
} from "@/lib/db/repositories/backoffice-users";

/**
 * GET /api/backoffice/users
 * List all backoffice users
 */
export async function GET() {
  try {
    const users = await getBackofficeUsers();
    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error("[Backoffice Users API] Error fetching users:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/backoffice/users
 * Create/invite a new backoffice user
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, displayName, role, invitedBy } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Valid email is required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const exists = await backofficeUserExists(email);
    if (exists) {
      return NextResponse.json(
        { success: false, error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Create the user
    const user = await createBackofficeUser({
      email,
      displayName,
      role,
      invitedBy,
    });

    // Generate magic link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://barter-x.com";
    const magicLink = `${baseUrl}/backoffice/verify?token=${user.inviteToken}`;

    // TODO: Send invite email when email service is configured
    // For now, return the magic link for manual sharing
    console.log(`[Backoffice Users API] Invite created for ${email}, magic link: ${magicLink}`);

    return NextResponse.json({
      success: true,
      user: {
        backofficeUserId: user.backofficeUserId,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        status: user.status,
        isVerified: user.isVerified,
        invitedAt: user.invitedAt,
      },
      magicLink,
    });
  } catch (error) {
    console.error("[Backoffice Users API] Error creating user:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create user" },
      { status: 500 }
    );
  }
}
