/**
 * App Access Eligibility Check API
 * =================================
 * Validates if an email is eligible to access the app based on:
 * 1. Global access control settings (allow_ff, allow_beta, allow_all)
 * 2. User's status in backoffice_users table
 * 
 * Access Modes:
 * - Maintenance: all flags false → no one can access
 * - Open Access: allow_all = true → everyone can access
 * - F&F Only: allow_ff = true, others false → F&F + BO users only
 * - F&F + Beta: allow_ff + allow_beta = true → F&F + Beta + BO users
 */

import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db/postgres";

interface AccessControl {
  allow_ff: boolean;
  allow_beta: boolean;
  allow_all: boolean;
}

interface BackofficeUser {
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

    // 1. Fetch access control settings
    const accessControlResult = await query<AccessControl>(
      `SELECT allow_ff, allow_beta, allow_all 
       FROM application.app_access_control 
       LIMIT 1`
    );

    // Default to F&F only if no config exists
    const accessControl: AccessControl = accessControlResult[0] || {
      allow_ff: true,
      allow_beta: false,
      allow_all: false,
    };

    // 2. Determine access mode
    const isMaintenanceMode = !accessControl.allow_ff && !accessControl.allow_beta && !accessControl.allow_all;
    const isOpenAccess = accessControl.allow_all;
    const isFfPlusBeta = accessControl.allow_ff && accessControl.allow_beta && !accessControl.allow_all;
    const isFfOnly = accessControl.allow_ff && !accessControl.allow_beta && !accessControl.allow_all;

    // 3. Handle maintenance mode - no one can access
    if (isMaintenanceMode) {
      return NextResponse.json({
        eligible: false,
        reason: "maintenance",
        accessMode: "maintenance",
      });
    }

    // 4. Handle open access - everyone can log in
    if (isOpenAccess) {
      return NextResponse.json({
        eligible: true,
        reason: "open_access",
        accessMode: "all",
      });
    }

    // 5. For restricted modes (F&F only or F&F+Beta), check user in backoffice_users
    const userResult = await query<BackofficeUser>(
      `SELECT email, user_type, status, is_verified, display_name
       FROM application.backoffice_users
       WHERE LOWER(email) = $1
       AND status != 'disabled'`,
      [normalizedEmail]
    );

    // User not found in backoffice_users
    if (userResult.length === 0) {
      return NextResponse.json({
        eligible: false,
        reason: isFfOnly ? "ff_only" : "beta_only",
        accessMode: isFfOnly ? "ff" : "ff_beta",
      });
    }

    const user = userResult[0];
    const userType = user.user_type;

    // 6. BO users can always access (except maintenance mode - already handled above)
    if (userType === "bo") {
      return NextResponse.json({
        eligible: true,
        reason: "bo_user",
        userType: "bo",
        displayName: user.display_name,
        accessMode: isFfOnly ? "ff" : "ff_beta",
      });
    }

    // 7. F&F Only mode
    if (isFfOnly) {
      if (userType === "friends_family") {
        return NextResponse.json({
          eligible: true,
          reason: "ff_user",
          userType: "friends_family",
          displayName: user.display_name,
          accessMode: "ff",
        });
      } else {
        // Beta users blocked in F&F-only mode
        return NextResponse.json({
          eligible: false,
          reason: "ff_only",
          accessMode: "ff",
        });
      }
    }

    // 8. F&F + Beta mode
    if (isFfPlusBeta) {
      if (userType === "friends_family" || userType === "beta") {
        return NextResponse.json({
          eligible: true,
          reason: userType === "friends_family" ? "ff_user" : "beta_user",
          userType: userType,
          displayName: user.display_name,
          accessMode: "ff_beta",
        });
      } else {
        return NextResponse.json({
          eligible: false,
          reason: "beta_only",
          accessMode: "ff_beta",
        });
      }
    }

    // Fallback - should not reach here
    return NextResponse.json({
      eligible: false,
      reason: "unknown",
    });

  } catch (error) {
    console.error("[Eligibility Check] Error:", error);
    return NextResponse.json(
      { eligible: false, error: "Failed to check eligibility" },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch current access mode (for maintenance screen check)
export async function GET() {
  try {
    const accessControlResult = await query<AccessControl>(
      `SELECT allow_ff, allow_beta, allow_all 
       FROM application.app_access_control 
       LIMIT 1`
    );

    const accessControl: AccessControl = accessControlResult[0] || {
      allow_ff: true,
      allow_beta: false,
      allow_all: false,
    };

    const isMaintenanceMode = !accessControl.allow_ff && !accessControl.allow_beta && !accessControl.allow_all;
    
    let accessMode = "ff"; // default
    if (isMaintenanceMode) accessMode = "maintenance";
    else if (accessControl.allow_all) accessMode = "all";
    else if (accessControl.allow_ff && accessControl.allow_beta) accessMode = "ff_beta";
    else if (accessControl.allow_ff) accessMode = "ff";

    return NextResponse.json({
      accessMode,
      allowFf: accessControl.allow_ff,
      allowBeta: accessControl.allow_beta,
      allowAll: accessControl.allow_all,
    });
  } catch (error) {
    console.error("[Access Mode Check] Error:", error);
    return NextResponse.json(
      { error: "Failed to check access mode" },
      { status: 500 }
    );
  }
}
