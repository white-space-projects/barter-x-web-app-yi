/**
 * ============================================================================
 * REGENERATE INVITE TOKEN API
 * ============================================================================
 * Regenerate magic link for an unverified backoffice user.
 */

import { NextRequest, NextResponse } from "next/server";
import { regenerateInviteToken } from "@/lib/db/repositories/backoffice-users";

/**
 * POST /api/backoffice/users/[id]/regenerate-token
 * Regenerate invite token for unverified user
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const user = await regenerateInviteToken(id);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found or already verified" },
        { status: 404 }
      );
    }

    // Generate magic link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://barter-x.com";
    const magicLink = `${baseUrl}/backoffice/verify?token=${user.inviteToken}`;

    return NextResponse.json({
      success: true,
      magicLink,
    });
  } catch (error) {
    console.error("[Backoffice Users API] Error regenerating token:", error);
    return NextResponse.json(
      { success: false, error: "Failed to regenerate token" },
      { status: 500 }
    );
  }
}
