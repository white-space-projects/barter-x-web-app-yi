/**
 * Login API Route
 * ================
 * Handles user authentication and bootstrapping.
 * 
 * Flow:
 * 1. Find existing user by email in application.users
 * 2. If not found, create user in auth.users via Supabase Admin API
 * 3. Then create corresponding record in application.users
 * 4. Create user_profiles record if needed
 * 5. Return user data and session token
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateGuid } from "@/lib/guid";
import { setSessionCookie, type UserSession } from "@/lib/auth";
import { query } from "@/lib/db/postgres";
import { logLoginEvent } from "@/lib/analytics";

// Admin emails that should have admin privileges
const ADMIN_EMAILS = ["rakshith66@hotmail.com", "admin@barterx.com"];

// Create Supabase admin client for auth operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      email, name, city, cityId, country, countryId, countryCode,
      detectedCountryId, detectedCityId 
    } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const isAdmin = ADMIN_EMAILS.includes(normalizedEmail);
    
    console.log("[v0] Login API: Processing login for", normalizedEmail);

    let userId: string;
    let userName = name || "User";
    let userCity = city || "";
    let userCountry = country || "";
    let userCountryCode = countryCode || "";
    let isNewUser = false;

    try {
      // Step 1: Check if user exists in application.users
      const existingUsers = await query<{
        user_id: string;
        display_name: string | null;
        is_admin: boolean;
        profile_country_id: string | null;
        profile_city_id: string | null;
      }>(
        `SELECT user_id, display_name, is_admin, profile_country_id, profile_city_id 
         FROM application.users WHERE email = $1`,
        [normalizedEmail]
      );

      if (existingUsers.length > 0) {
        // User exists - use their data
        const existingUser = existingUsers[0];
        userId = existingUser.user_id;
        userName = existingUser.display_name || name || "User";
        
        console.log("[v0] Login API: Found existing user:", userId);

        // Get location data if available
        console.log("[v0] Login API: User profile_country_id:", existingUser.profile_country_id);
        
        if (existingUser.profile_country_id) {
          const locationData = await query<{
            country_name: string;
            country_code: string;
            city_name: string | null;
          }>(
            `SELECT 
              c.name as country_name, 
              c.country_code,
              ci.name as city_name
             FROM application.countries c
             LEFT JOIN application.cities ci ON ci.city_id = $2
             WHERE c.country_id = $1`,
            [existingUser.profile_country_id, existingUser.profile_city_id]
          );
          
          console.log("[v0] Login API: Location query result:", locationData);
          
          if (locationData.length > 0) {
            userCountry = locationData[0].country_name;
            userCountryCode = locationData[0].country_code;
            // Only use saved city if it exists - don't mix detected city with profile country
            userCity = locationData[0].city_name || "";
            console.log("[v0] Login API: Set location to:", { userCountry, userCountryCode, userCity });
          }
        }

        // Update last login
        await query(
          `UPDATE application.users SET last_login_at = NOW() WHERE user_id = $1`,
          [userId]
        );
      } else {
        // Step 2: User doesn't exist - create via Supabase Admin API
        console.log("[v0] Login API: Creating new user via Supabase Admin");
        isNewUser = true;

        // Check if user exists in auth.users using listUsers
        const { data: listData, error: lookupError } = await supabaseAdmin.auth.admin.listUsers();
        const existingAuthUser = listData?.users?.find(u => u.email?.toLowerCase() === normalizedEmail);
        
        if (existingAuthUser) {
          // User exists in auth but not in application.users - use their ID
          userId = existingAuthUser.id;
          console.log("[v0] Login API: Found existing auth user:", userId);
        } else {
          // Create new user in auth.users
          const { data: newAuthUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: normalizedEmail,
            email_confirm: true, // Auto-confirm for dev/demo purposes
            user_metadata: {
              name: name || "User",
              city: city,
              country: country,
            },
          });

          if (authError) {
            console.error("[v0] Login API: Failed to create auth user:", authError);
            throw new Error(`Failed to create user: ${authError.message}`);
          }

          userId = newAuthUser.user.id;
          console.log("[v0] Login API: Created new auth user:", userId);
        }

        // Step 3: Create record in application.users
        // Use passed IDs directly (from frontend that fetched from DB)
        const selectedCountryIdValue = countryId || null;
        const selectedCityIdValue = cityId || null;
        const detectedCountryIdValue = detectedCountryId || selectedCountryIdValue;
        const detectedCityIdValue = detectedCityId || selectedCityIdValue;

        // Insert into application.users
        await query(
          `INSERT INTO application.users (
            user_id, email, display_name, 
            detected_country_id, detected_city_id, detected_at,
            profile_country_id, profile_city_id,
            is_active, is_verified, is_admin,
            created_at, updated_at, last_login_at
          ) VALUES (
            $1, $2, $3, $4, $5, NOW(), $6, $7,
            true, false, $8, NOW(), NOW(), NOW()
          )
          ON CONFLICT (user_id) DO UPDATE SET
            last_login_at = NOW(),
            updated_at = NOW()`,
          [userId, normalizedEmail, name || null, detectedCountryIdValue, detectedCityIdValue, selectedCountryIdValue, selectedCityIdValue, isAdmin]
        );

        console.log("[v0] Login API: Created application.users record");

        // Step 4: Create user_profiles record with detected and selected locations
        await query(
          `INSERT INTO application.user_profiles (
            user_id, full_name, email,
            country_id, city_id,
            detected_country_id, detected_city_id, detected_at,
            selected_country_id, selected_city_id,
            email_connected, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, NOW(), $4, $5,
            true, NOW(), NOW()
          )
          ON CONFLICT (user_id) DO UPDATE SET
            country_id = COALESCE($4, application.user_profiles.country_id),
            city_id = COALESCE($5, application.user_profiles.city_id),
            selected_country_id = COALESCE($4, application.user_profiles.selected_country_id),
            selected_city_id = COALESCE($5, application.user_profiles.selected_city_id),
            updated_at = NOW()`,
          [userId, name || null, normalizedEmail, selectedCountryIdValue, selectedCityIdValue, detectedCountryIdValue, detectedCityIdValue]
        );

        console.log("[v0] Login API: Created user_profiles record");
      }

      // Generate session token
      const token = generateGuid();

      // Create server-side session
      const sessionUser: UserSession = {
        id: 0,
        user_id: userId,
        email: normalizedEmail,
        name: userName,
        access_token: token,
        region: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };

      await setSessionCookie(sessionUser);

      console.log("[v0] Login API: Login successful for", normalizedEmail, "userId:", userId);

      // Log analytics event
      await logLoginEvent("login_completed", {
        email: normalizedEmail,
        userId,
        countryId: countryId || null,
        cityId: cityId || null,
        detectedCountryId: detectedCountryId || countryId || null,
        detectedCityId: detectedCityId || cityId || null,
        metadata: { isNewUser },
      });

      return NextResponse.json({
        success: true,
        user: {
          userId,
          email: normalizedEmail,
          name: userName,
          isAdmin: isAdmin || existingUsers?.[0]?.is_admin || false,
          city: userCity,
          country: userCountry,
          countryCode: userCountryCode,
          // Include profileAddress for components that expect it
          profileAddress: userCity || userCountry ? {
            city: userCity,
            country: userCountry,
          } : undefined,
        },
        token,
        isNewUser,
      });
    } catch (dbError) {
      // Database error - log and return error
      console.error("[v0] Login API: Database error:", dbError);
      
      // Log analytics event for failure
      await logLoginEvent("login_failed", {
        email: normalizedEmail,
        errorType: "database_error",
        errorMessage: dbError instanceof Error ? dbError.message : "Unknown database error",
      });
      
      return NextResponse.json(
        { 
          success: false, 
          error: dbError instanceof Error ? dbError.message : "Database error" 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[v0] Login API: Error:", error);
    
    // Log analytics event for failure
    await logLoginEvent("login_failed", {
      errorType: "general_error",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });
    
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Login failed" },
      { status: 500 }
    );
  }
}
