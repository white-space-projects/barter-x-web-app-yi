/**
 * Login API Route
 * ================
 * Handles temporary login flow using direct PostgreSQL connection:
 * 1. Find or create user in application.users by email
 * 2. Create server-side session cookie
 * 3. Return user profile data
 * 
 * Easy for backend developer to replace with Laravel API calls.
 */

import { NextRequest, NextResponse } from "next/server";
import { setSessionCookie, type UserSession } from "@/lib/auth";
import { generateGuid } from "@/lib/guid";
import { 
  findUserByEmail, 
  updateLastLogin, 
  findUserWithLocation 
} from "@/lib/db/repositories/users";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, city, country, countryCode } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    console.log("[v0] Login API: Processing login for", email);

    let userId: string;
    let userName: string = name || "User";
    let isAdmin = false;
    let userCity = city || "";
    let userCountry = country || "";
    let userCountryCode = countryCode || "";

    // Check admin emails from environment
    const adminEmails = JSON.parse(process.env.NEXT_PUBLIC_ADMIN_EMAILS || "[]");
    isAdmin = adminEmails.includes(email.toLowerCase());

    try {
      // Try to find existing user by email in application.users
      // Note: application.users.user_id has FK to auth.users, so we can only
      // find users who were created via Supabase Auth
      const existingUser = await findUserByEmail(email);

      if (existingUser) {
        // User exists in DB - use their data
        console.log("[v0] Login API: Found existing user:", existingUser.user_id);
        userId = existingUser.user_id;
        userName = existingUser.display_name || name || "User";
        isAdmin = existingUser.is_admin || isAdmin;
        
        // Get location data
        const userWithLocation = await findUserWithLocation(userId);
        if (userWithLocation) {
          userCity = userWithLocation.cityName || city || "";
          userCountry = userWithLocation.countryName || country || "";
          userCountryCode = userWithLocation.countryCode || countryCode || "";
        }
        
        // Update last login time
        await updateLastLogin(userId);
      } else {
        // User doesn't exist in application.users
        // Cannot create because user_id must reference auth.users (Supabase Auth)
        // Use temporary client-side session instead
        console.log("[v0] Login API: User not found in DB, using temporary session");
        userId = generateGuid();
        userName = name || "Guest User";
        userCity = city || "";
        userCountry = country || "";
        userCountryCode = countryCode || "";
      }
    } catch (dbError) {
      // Database not available - use temporary session
      console.warn("[v0] Login API: Database error, using temporary session:", dbError);
      userId = generateGuid();
    }

    // Create server-side session
    const sessionUser: UserSession = {
      id: 0, // Legacy field
      user_id: userId,
      email: email.toLowerCase(),
      name: userName,
      access_token: generateGuid(), // Temporary token
      region: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };

    await setSessionCookie(sessionUser);

    console.log("[v0] Login API: Session created for user:", userId);

    // Return user data for client-side store
    return NextResponse.json({
      success: true,
      user: {
        userId,
        email: email.toLowerCase(),
        name: userName,
        isAdmin,
        city: userCity,
        country: userCountry,
        countryCode: userCountryCode,
      },
      token: sessionUser.access_token,
    });
  } catch (error) {
    console.error("[v0] Login API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Login failed" },
      { status: 500 }
    );
  }
}
