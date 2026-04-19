/**
 * ============================================================================
 * BACKOFFICE USERS API
 * ============================================================================
 * API for managing internal users (BO, F&F, Beta).
 * ADMIN ONLY - must verify caller has admin role.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getManagedUsers,
  createManagedUser,
  backofficeUserExists,
  type ManagedUserType,
} from "@/lib/db/repositories/backoffice-users";

/**
 * GET /api/backoffice/users
 * List all managed users (BO, F&F, Beta) - Admin only
 */
export async function GET() {
  try {
    // TODO: Add proper admin authentication check here
    // For now, relying on UI-level protection
    
    const users = await getManagedUsers();
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
 * Create/invite a new managed user (BO, F&F, or Beta) - Admin only
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Add proper admin authentication check here
    // For now, relying on UI-level protection
    
    const body = await request.json();
    const { email, displayName, userType, role, invitedBy } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Valid email is required" },
        { status: 400 }
      );
    }

    // Validate user type
    const validUserTypes: ManagedUserType[] = ["bo", "friends_family", "beta"];
    if (!validUserTypes.includes(userType)) {
      return NextResponse.json(
        { success: false, error: "Invalid user type. Must be: bo, friends_family, or beta" },
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
    const user = await createManagedUser({
      email,
      displayName,
      userType,
      role: userType === "bo" ? role : "viewer", // Only BO users can have different roles
      invitedBy,
    });

    // Generate magic link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://barter-x.com";
    const magicLink = `${baseUrl}/backoffice/verify?token=${user.inviteToken}`;

    // TODO: Send invite email when email service is configured
    console.log(`[Backoffice Users API] Invite created for ${email} (${userType}), magic link: ${magicLink}`);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        visibleUserId: user.visibleUserId,
        email: user.email,
        displayName: user.displayName,
        userType: user.userType,
        role: user.role,
        isActive: user.isActive,
        isVerified: user.isVerified,
        invitedAt: user.invitedAt,
        userReferenceId: user.userReferenceId,
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
