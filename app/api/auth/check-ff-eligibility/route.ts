/**
 * F&F Eligibility Check API
 * ==========================
 * Validates if an email is eligible for Friends & Family app access.
 * 
 * Checks:
 * - User exists in application.backoffice_users
 * - user_type = 'friends_family'
 * - status != 'disabled' (active)
 */

import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db/postgres";

interface FFEligibilityResult {
  email: string;
  user_type: string;
  status: string;
  is_verified: boolean;
  display_name: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { eligible: false, error: "Email is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists in backoffice_users with user_type = 'friends_family' and is active
    const result = await query<FFEligibilityResult>(
      `SELECT email, user_type, status, is_verified, display_name
       FROM application.backoffice_users
       WHERE LOWER(email) = LOWER($1)
         AND user_type = 'friends_family'
         AND status != 'disabled'
       LIMIT 1`,
      [normalizedEmail]
    );

    if (result.length === 0) {
      // User not found or not eligible
      return NextResponse.json({
        eligible: false,
        reason: "not_ff_user",
      });
    }

    const user = result[0];

    // User is eligible for F&F access
    return NextResponse.json({
      eligible: true,
      user: {
        email: user.email,
        displayName: user.display_name,
        isVerified: user.is_verified,
      },
    });
  } catch (error) {
    console.error("[F&F Check] Error:", error);
    return NextResponse.json(
      { eligible: false, error: "Failed to check eligibility" },
      { status: 500 }
    );
  }
}
