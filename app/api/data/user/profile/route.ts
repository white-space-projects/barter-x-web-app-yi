/**
 * User Profile API Route
 * =======================
 * Get or update current user's profile using direct PostgreSQL.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db/postgres";

interface UserProfile {
  userId: string;
  email: string;
  name: string;
  phone?: string;
  city?: string;
  country?: string;
  countryCode?: string;
  state?: string;
  zip?: string;
  addressLine1?: string;
  addressLine2?: string;
  avatarUrl?: string;
  isAdmin: boolean;
}

interface DbUserWithLocation {
  user_id: string;
  email: string;
  phone: string | null;
  display_name: string | null;
  is_admin: boolean;
  avatar_image_key: string | null;
  // Detected location
  detected_country_name: string | null;
  detected_country_code: string | null;
  detected_city_name: string | null;
  // Profile location
  profile_country_name: string | null;
  profile_country_code: string | null;
  profile_city_name: string | null;
  profile_address_line1: string | null;
  profile_address_line2: string | null;
  profile_zip_code: string | null;
}

export async function GET(request: NextRequest) {
  try {
    // Get session from our JWT cookie
    const session = await getSession();
    
    // Fallback: Check for x-user-id header (sent by client when cookie fails)
    const headerUserId = request.headers.get("x-user-id");
    const userId = session?.user_id || headerUserId;
    
    console.log("[v0] Profile GET: Session:", session?.user_id || "none", "Header:", headerUserId || "none");
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("[v0] Getting user profile for:", userId);

    // Get user with location data using direct SQL
    const users = await query<DbUserWithLocation>(
      `SELECT 
        u.user_id,
        u.email,
        u.phone,
        u.display_name,
        u.is_admin,
        u.avatar_image_key,
        u.profile_address_line1,
        u.profile_address_line2,
        u.profile_zip_code,
        dc.name as detected_country_name,
        dc.country_code as detected_country_code,
        dci.name as detected_city_name,
        pc.name as profile_country_name,
        pc.country_code as profile_country_code,
        pci.name as profile_city_name
      FROM application.users u
      LEFT JOIN application.countries dc ON u.detected_country_id = dc.country_id
      LEFT JOIN application.cities dci ON u.detected_city_id = dci.city_id
      LEFT JOIN application.countries pc ON u.profile_country_id = pc.country_id
      LEFT JOIN application.cities pci ON u.profile_city_id = pci.city_id
      WHERE u.user_id = $1`,
      [userId]
    );

    const user = users[0];

    // If user doesn't exist in our DB yet, return session data
    if (!user) {
      console.log("[v0] User not in DB yet, returning session data");
      return NextResponse.json({
        profile: {
          userId: userId,
          email: session?.email || "",
          name: session?.name || "User",
          isAdmin: false,
        },
        fromSession: true,
      });
    }

    // Map DB user to profile - prefer profile location over detected
    const profile: UserProfile = {
      userId: user.user_id,
      email: user.email || session?.email || "",
      name: user.display_name || session?.name || "User",
      phone: user.phone || undefined,
      city: user.profile_city_name || user.detected_city_name || "",
      country: user.profile_country_name || user.detected_country_name || "",
      countryCode: user.profile_country_code || user.detected_country_code || "",
      addressLine1: user.profile_address_line1 || undefined,
      addressLine2: user.profile_address_line2 || undefined,
      zip: user.profile_zip_code || undefined,
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
    
    // Fallback: Check for x-user-id header (sent by client when cookie fails)
    const headerUserId = request.headers.get("x-user-id");
    const userId = session?.user_id || headerUserId;
    
    console.log("[v0] Profile PUT: Session:", session?.user_id || "none", "Header:", headerUserId || "none");
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, phone, city, country, addressLine1, addressLine2, zip, avatarUrl } = body;

    console.log("[v0] Updating user profile for:", userId, { name, city, country });

    // Look up country ID if country name provided
    let profileCountryId: string | null = null;
    let profileCityId: string | null = null;

    if (country) {
      const countries = await query<{ country_id: string }>(
        `SELECT country_id FROM application.countries WHERE LOWER(name) = LOWER($1) LIMIT 1`,
        [country]
      );
      
      if (countries[0]) {
        profileCountryId = countries[0].country_id;
        
        // Look up city ID if city name provided
        if (city) {
          const cities = await query<{ city_id: string }>(
            `SELECT city_id FROM application.cities 
             WHERE country_id = $1 AND LOWER(name) = LOWER($2) LIMIT 1`,
            [profileCountryId, city]
          );
          
          if (cities[0]) {
            profileCityId = cities[0].city_id;
          }
        }
      }
    }

    // Build dynamic UPDATE query
    const updateFields: string[] = ['updated_at = NOW()'];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updateFields.push(`display_name = $${paramIndex++}`);
      values.push(name);
    }
    if (phone !== undefined) {
      updateFields.push(`phone = $${paramIndex++}`);
      values.push(phone || null);
    }
    if (profileCountryId !== null) {
      updateFields.push(`profile_country_id = $${paramIndex++}`);
      values.push(profileCountryId);
    }
    if (profileCityId !== null) {
      updateFields.push(`profile_city_id = $${paramIndex++}`);
      values.push(profileCityId);
    }
    if (addressLine1 !== undefined) {
      updateFields.push(`profile_address_line1 = $${paramIndex++}`);
      values.push(addressLine1 || null);
    }
    if (addressLine2 !== undefined) {
      updateFields.push(`profile_address_line2 = $${paramIndex++}`);
      values.push(addressLine2 || null);
    }
    if (zip !== undefined) {
      updateFields.push(`profile_zip_code = $${paramIndex++}`);
      values.push(zip || null);
    }
    if (avatarUrl !== undefined) {
      updateFields.push(`avatar_image_key = $${paramIndex++}`);
      values.push(avatarUrl || null);
    }

    // Add user_id as the last parameter
    values.push(userId);

    // Update user
    const updateQuery = `
      UPDATE application.users 
      SET ${updateFields.join(', ')}
      WHERE user_id = $${paramIndex}
      RETURNING user_id
    `;

    console.log("[v0] Profile update query:", updateQuery, values);

    const updateResult = await query<{ user_id: string }>(updateQuery, values);

    if (!updateResult[0]) {
      console.error("[v0] User not found for update:", userId);
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Fetch updated profile
    const users = await query<DbUserWithLocation>(
      `SELECT 
        u.user_id,
        u.email,
        u.phone,
        u.display_name,
        u.is_admin,
        u.avatar_image_key,
        u.profile_address_line1,
        u.profile_address_line2,
        u.profile_zip_code,
        dc.name as detected_country_name,
        dc.country_code as detected_country_code,
        dci.name as detected_city_name,
        pc.name as profile_country_name,
        pc.country_code as profile_country_code,
        pci.name as profile_city_name
      FROM application.users u
      LEFT JOIN application.countries dc ON u.detected_country_id = dc.country_id
      LEFT JOIN application.cities dci ON u.detected_city_id = dci.city_id
      LEFT JOIN application.countries pc ON u.profile_country_id = pc.country_id
      LEFT JOIN application.cities pci ON u.profile_city_id = pci.city_id
      WHERE u.user_id = $1`,
      [userId]
    );

    const user = users[0];

    const profile: UserProfile = {
      userId: user.user_id,
      email: user.email || session?.email || "",
      name: user.display_name || session?.name || "User",
      phone: user.phone || undefined,
      city: user.profile_city_name || user.detected_city_name || "",
      country: user.profile_country_name || user.detected_country_name || "",
      countryCode: user.profile_country_code || user.detected_country_code || "",
      addressLine1: user.profile_address_line1 || undefined,
      addressLine2: user.profile_address_line2 || undefined,
      zip: user.profile_zip_code || undefined,
      avatarUrl: user.avatar_image_key || undefined,
      isAdmin: user.is_admin || false,
    };

    console.log("[v0] Profile updated successfully:", profile);

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("[v0] Profile update error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
