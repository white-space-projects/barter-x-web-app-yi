/**
 * Login API Route
 * ================
 * Handles temporary login flow:
 * 1. Find or create user in application.users by email
 * 2. Create server-side session cookie
 * 3. Return user profile data
 * 
 * This is a temporary implementation without real OTP/OAuth validation.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { setSessionCookie, type UserSession } from "@/lib/auth";
import { generateGuid } from "@/lib/guid";

// Check if required env vars are set
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create admin client with service role key
const supabaseAdmin = SUPABASE_URL && SUPABASE_SERVICE_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null;

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

    // If Supabase is configured, find or create user in database
    if (supabaseAdmin) {
      console.log("[v0] Login API: Checking database for existing user");
      
      // Try to find existing user by email
      const { data: existingUser, error: findError } = await supabaseAdmin
        .schema("application")
        .from("users")
        .select(`
          user_id,
          email,
          display_name,
          is_admin,
          profile_country:countries!profile_country_id(name, country_code),
          profile_city:cities!profile_city_id(name)
        `)
        .eq("email", email.toLowerCase())
        .single();

      if (findError && findError.code !== "PGRST116") {
        console.error("[v0] Login API: Error finding user:", findError);
        // Continue with mock user if DB query fails
      }

      if (existingUser) {
        // User exists - use their data
        console.log("[v0] Login API: Found existing user:", existingUser.user_id);
        userId = existingUser.user_id;
        userName = existingUser.display_name || name || "User";
        isAdmin = existingUser.is_admin || isAdmin;
        userCity = existingUser.profile_city?.name || city || "";
        userCountry = existingUser.profile_country?.name || country || "";
        userCountryCode = existingUser.profile_country?.country_code || countryCode || "";
        
        // Update last login time
        await supabaseAdmin
          .schema("application")
          .from("users")
          .update({ last_login_at: new Date().toISOString() })
          .eq("user_id", userId);
      } else {
        // User doesn't exist - create new user
        console.log("[v0] Login API: Creating new user");
        userId = generateGuid();

        // Look up country and city IDs if provided
        let countryId = null;
        let cityId = null;

        if (country) {
          const { data: countryData } = await supabaseAdmin
            .schema("application")
            .from("countries")
            .select("country_id")
            .ilike("name", country)
            .single();
          
          if (countryData) {
            countryId = countryData.country_id;
            
            if (city) {
              const { data: cityData } = await supabaseAdmin
                .schema("application")
                .from("cities")
                .select("city_id")
                .eq("country_id", countryId)
                .ilike("name", city)
                .single();
              
              if (cityData) {
                cityId = cityData.city_id;
              }
            }
          }
        }

        // Insert new user
        const { data: newUser, error: insertError } = await supabaseAdmin
          .schema("application")
          .from("users")
          .insert({
            user_id: userId,
            email: email.toLowerCase(),
            display_name: name || null,
            is_admin: isAdmin,
            detected_country_id: countryId,
            detected_city_id: cityId,
            profile_country_id: countryId,
            profile_city_id: cityId,
            last_login_at: new Date().toISOString(),
            is_active: true,
          })
          .select("user_id")
          .single();

        if (insertError) {
          console.error("[v0] Login API: Error creating user:", insertError);
          // Continue with generated userId
        } else if (newUser) {
          userId = newUser.user_id;
        }
      }
    } else {
      // No Supabase - use generated ID (temporary session only)
      console.log("[v0] Login API: Supabase not configured, using temporary session");
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
