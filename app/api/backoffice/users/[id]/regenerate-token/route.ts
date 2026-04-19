/**
 * ============================================================================
 * REGENERATE INVITE TOKEN API
 * ============================================================================
 * Regenerate magic link for an unverified user.
 * Also updates invited_at timestamp for tracking resends.
 */

import { NextRequest, NextResponse } from "next/server";
import { regenerateInviteTokenWithTimestamp } from "@/lib/db/repositories/backoffice-users";

/**
 * POST /api/backoffice/users/[id]/regenerate-token
 * Regenerate invite token for unverified user and update invited_at
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Use the new function that also updates invited_at
    const user = await regenerateInviteTokenWithTimestamp(id);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found or already verified" },
        { status: 404 }
      );
    }

    // Generate magic link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://barter-x.com";
    const magicLink = `${baseUrl}/backoffice/verify?token=${user.inviteToken}`;

    console.log(`[Backoffice Users API] Invite resent for ${user.email}, invited_at updated`);

    return NextResponse.json({
      success: true,
      magicLink,
      invitedAt: user.invitedAt,
    });
  } catch (error) {
    console.error("[Backoffice Users API] Error regenerating token:", error);
    return NextResponse.json(
      { success: false, error: "Failed to regenerate token" },
      { status: 500 }
    );
  }
}
