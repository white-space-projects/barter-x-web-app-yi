/**
 * ============================================================================
 * TOGGLE USER STATUS API
 * ============================================================================
 * Activate or deactivate a managed user.
 */

import { NextRequest, NextResponse } from "next/server";
import { setBackofficeUserStatus } from "@/lib/db/repositories/backoffice-users";

/**
 * POST /api/backoffice/users/[id]/toggle-status
 * Toggle user active/inactive status
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { active } = body;

    if (typeof active !== "boolean") {
      return NextResponse.json(
        { success: false, error: "active field must be a boolean" },
        { status: 400 }
      );
    }

    // Set status: 'verified' for active, 'disabled' for inactive
    const newStatus = active ? "verified" : "disabled";
    const user = await setBackofficeUserStatus(id, newStatus);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    console.log(`[Backoffice Users API] User ${user.email} status changed to ${newStatus}`);

    return NextResponse.json({
      success: true,
      user: {
        id: user.backofficeUserId,
        email: user.email,
        status: user.status,
        isActive: user.status !== "disabled",
      },
    });
  } catch (error) {
    console.error("[Backoffice Users API] Error toggling status:", error);
    return NextResponse.json(
      { success: false, error: "Failed to toggle status" },
      { status: 500 }
    );
  }
}
