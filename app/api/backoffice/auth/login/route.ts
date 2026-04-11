/**
 * ============================================================================
 * BACKOFFICE AUTH LOGIN API
 * ============================================================================
 * Authenticate backoffice users from the database.
 * Only verified backoffice_users can login.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getBackofficeUserByEmail,
  updateBackofficeUserLastLogin,
} from "@/lib/db/repositories/backoffice-users";

const HARDCODED_OTP = "123456";

/**
 * POST /api/backoffice/auth/login
 * Authenticate a backoffice user
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, otp } = body;

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, error: "Email and OTP are required" },
        { status: 400 }
      );
    }

    // Check OTP
    if (otp !== HARDCODED_OTP) {
      return NextResponse.json(
        { success: false, error: "Invalid OTP code" },
        { status: 401 }
      );
    }

    // Find user in database
    const user = await getBackofficeUserByEmail(email);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Email not authorized for Back Office access" },
        { status: 401 }
      );
    }

    // Check if user is verified
    if (!user.isVerified) {
      return NextResponse.json(
        { success: false, error: "Please verify your account first using the invite link" },
        { status: 401 }
      );
    }

    // Check if user is disabled
    if (user.status === "disabled") {
      return NextResponse.json(
        { success: false, error: "Your account has been disabled" },
        { status: 401 }
      );
    }

    // Update last login
    await updateBackofficeUserLastLogin(user.backofficeUserId);

    return NextResponse.json({
      success: true,
      user: {
        email: user.email,
        role: user.role,
        loggedInAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[Backoffice Auth API] Login error:", error);
    return NextResponse.json(
      { success: false, error: "Authentication failed" },
      { status: 500 }
    );
  }
}
