/**
 * ============================================================================
 * BACKOFFICE USER VERIFICATION API
 * ============================================================================
 * Verify a backoffice user via invite token (magic link).
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getBackofficeUserByInviteToken,
  verifyBackofficeUser,
} from "@/lib/db/repositories/backoffice-users";

/**
 * POST /api/backoffice/users/verify
 * Verify a backoffice user with invite token
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Token is required" },
        { status: 400 }
      );
    }

    // Find user by token
    const user = await getBackofficeUserByInviteToken(token);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired invite link" },
        { status: 400 }
      );
    }

    // Verify the user
    const verifiedUser = await verifyBackofficeUser(user.backofficeUserId);
    if (!verifiedUser) {
      return NextResponse.json(
        { success: false, error: "Failed to verify user" },
        { status: 500 }
      );
    }

    console.log(`[Backoffice Users API] User verified: ${verifiedUser.email}`);

    return NextResponse.json({
      success: true,
      user: {
        email: verifiedUser.email,
        displayName: verifiedUser.displayName,
        role: verifiedUser.role,
        isVerified: verifiedUser.isVerified,
      },
    });
  } catch (error) {
    console.error("[Backoffice Users API] Error verifying user:", error);
    return NextResponse.json(
      { success: false, error: "Failed to verify user" },
      { status: 500 }
    );
  }
}
