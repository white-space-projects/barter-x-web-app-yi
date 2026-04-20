/**
 * Referrals API
 * POST: Create a new referral (invite a user)
 * 
 * This creates a record in application.backoffice_users
 * with user_type determined by current access control config.
 */

import { NextResponse } from "next/server";
import { query } from "@/lib/db/postgres";
import { backofficeUserExists, createManagedUser, type ManagedUserType } from "@/lib/db/repositories/backoffice-users";

interface AccessControl {
  allow_ff: boolean;
  allow_beta: boolean;
  allow_all: boolean;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, referredBy } = body;

    // Validate email
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Check if email already exists in backoffice_users
    const exists = await backofficeUserExists(email);
    if (exists) {
      return NextResponse.json(
        { error: "duplicate" },
        { status: 409 }
      );
    }

    // Fetch current access control config
    const accessResult = await query<AccessControl>(
      `SELECT allow_ff, allow_beta, allow_all 
       FROM application.app_access_control 
       LIMIT 1`
    );

    const accessControl = accessResult[0] || { allow_ff: true, allow_beta: false, allow_all: false };

    // Check if invitations are available (maintenance mode = all false)
    if (!accessControl.allow_ff && !accessControl.allow_beta && !accessControl.allow_all) {
      return NextResponse.json(
        { error: "Invitations are currently unavailable" },
        { status: 403 }
      );
    }

    // Determine user_type based on access control config
    let userType: ManagedUserType;
    
    if (accessControl.allow_all) {
      // Open access mode - default to beta for tracking
      userType = "beta";
    } else if (accessControl.allow_ff && accessControl.allow_beta) {
      // F&F + Beta mode - default to beta
      userType = "beta";
    } else if (accessControl.allow_ff) {
      // F&F only mode
      userType = "friends_family";
    } else if (accessControl.allow_beta) {
      // Beta only mode
      userType = "beta";
    } else {
      // Fallback (shouldn't reach here due to maintenance check above)
      userType = "beta";
    }

    // Create the user record
    // Note: referredBy can be an app user's userId - we'll store it in invited_by
    // The createManagedUser function will handle the lookup
    const newUser = await createManagedUser({
      email: email.toLowerCase(),
      userType,
      invitedBy: referredBy || undefined,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        userType: newUser.userType,
        inviteToken: newUser.inviteToken,
      },
    });
  } catch (error) {
    console.error("Error creating referral:", error);
    return NextResponse.json(
      { error: "Failed to create referral" },
      { status: 500 }
    );
  }
}
