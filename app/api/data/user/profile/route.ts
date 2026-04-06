/**
 * User Profile API Route
 * =======================
 * Get or update current user's profile from Supabase.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSession } from "@/lib/auth";

// Use service role to bypass RLS for profile operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface UserProfile {
  userId: string;
  email: string;
  name: string;
  city?: string;
  country?: string;
  countryCode?: string;
  avatarUrl?: string;
  isAdmin: boolean;
}

export async function GET() {
  try {
    // Get session from our JWT cookie
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("[v0] Getting user profile for:", session.user_id);

    // Try to get user from application.users
    const { data: user, error } = await supabaseAdmin
      .schema("application")
      .from("users")
      .select(`
        user_id,
        email,
        display_name,
        is_admin,
        detected_country:countries!detected_country_id(name, country_code),
        detected_city:cities!detected_city_id(name),
        profile_country:countries!profile_country_id(name, country_code),
        profile_city:cities!profile_city_id(name),
        avatar_image_key
      `)
      .eq("user_id", session.user_id)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("[v0] Error fetching user profile:", error);
      return NextResponse.json(
        { error: "Failed to fetch profile" },
        { status: 500 }
      );
    }

    // If user doesn't exist in our DB yet, return session data
    if (!user) {
      console.log("[v0] User not in DB yet, returning session data");
      return NextResponse.json({
        profile: {
          userId: session.user_id,
          email: session.email,
          name: session.name || "User",
          isAdmin: false,
        },
        fromSession: true,
      });
    }

    // Map DB user to profile
    const profile: UserProfile = {
      userId: user.user_id,
      email: user.email || session.email,
      name: user.display_name || session.name || "User",
      city: user.profile_city?.name || user.detected_city?.name || "",
      country: user.profile_country?.name || user.detected_country?.name || "",
      countryCode: user.profile_country?.country_code || user.detected_country?.country_code || "",
      avatarUrl: user.avatar_image_key || undefined,
      isAdmin: user.is_admin || false,
    };

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("[v0] Profile API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, city, country, avatarUrl } = body;

    console.log("[v0] Updating user profile for:", session.user_id, body);

    // Build update object
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.display_name = name;
    if (avatarUrl !== undefined) updateData.avatar_image_key = avatarUrl;

    // Handle location updates
    if (country) {
      const { data: countryData } = await supabaseAdmin
        .schema("application")
        .from("countries")
        .select("country_id")
        .ilike("name", country)
        .single();
      
      if (countryData) {
        updateData.profile_country_id = countryData.country_id;
        
        if (city) {
          const { data: cityData } = await supabaseAdmin
            .schema("application")
            .from("cities")
            .select("city_id")
            .eq("country_id", countryData.country_id)
            .ilike("name", city)
            .single();
          
          if (cityData) {
            updateData.profile_city_id = cityData.city_id;
          }
        }
      }
    }

    // Upsert user in database
    const { data: user, error } = await supabaseAdmin
      .schema("application")
      .from("users")
      .upsert({
        user_id: session.user_id,
        email: session.email,
        ...updateData,
        last_login_at: new Date().toISOString(),
      }, {
        onConflict: "user_id",
      })
      .select(`
        user_id,
        email,
        display_name,
        is_admin,
        detected_country:countries!detected_country_id(name, country_code),
        detected_city:cities!detected_city_id(name),
        profile_country:countries!profile_country_id(name, country_code),
        profile_city:cities!profile_city_id(name),
        avatar_image_key
      `)
      .single();

    if (error) {
      console.error("[v0] Error updating user profile:", error);
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      );
    }

    const profile: UserProfile = {
      userId: user.user_id,
      email: user.email || session.email,
      name: user.display_name || session.name || "User",
      city: user.profile_city?.name || user.detected_city?.name || "",
      country: user.profile_country?.name || user.detected_country?.name || "",
      countryCode: user.profile_country?.country_code || user.detected_country?.country_code || "",
      avatarUrl: user.avatar_image_key || undefined,
      isAdmin: user.is_admin || false,
    };

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("[v0] Profile update error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
