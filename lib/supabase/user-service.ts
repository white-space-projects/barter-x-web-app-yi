/**
 * ============================================================================
 * USER DATA SERVICE
 * ============================================================================
 * Handles user profile CRUD operations in Supabase.
 * Used after authentication to ensure user exists in application.users table.
 * ============================================================================
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { User } from "@/lib/types";

interface DbUser {
  user_id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_image_key: string | null;
  detected_country_id: string | null;
  detected_city_id: string | null;
  profile_country_id: string | null;
  profile_city_id: string | null;
  profile_address_line1: string | null;
  profile_address_line2: string | null;
  profile_zip_code: string | null;
  is_active: boolean;
  is_verified: boolean;
  is_admin: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  detected_country?: { name: string; country_code: string } | null;
  detected_city?: { name: string } | null;
  profile_country?: { name: string; country_code: string } | null;
  profile_city?: { name: string } | null;
}

function mapDbUserToUser(db: DbUser): User {
  return {
    userId: db.user_id,
    name: db.display_name || db.first_name || "User",
    email: db.email || "",
    isAdmin: db.is_admin,
    city: db.detected_city?.name || db.profile_city?.name || "",
    country: db.detected_country?.name || db.profile_country?.name || "",
    countryCode: db.detected_country?.country_code || db.profile_country?.country_code || "",
    avatarUrl: db.avatar_image_key || undefined,
  };
}

/**
 * Get user by ID from application.users
 */
export async function getUserById(
  supabase: SupabaseClient,
  userId: string
): Promise<User | null> {
  console.log("[v0] getUserById called for:", userId);
  
  const { data, error } = await supabase
    .schema("application")
    .from("users")
    .select(`
      *,
      detected_country:countries!detected_country_id(name, country_code),
      detected_city:cities!detected_city_id(name),
      profile_country:countries!profile_country_id(name, country_code),
      profile_city:cities!profile_city_id(name)
    `)
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      console.log("[v0] User not found:", userId);
      return null; // Not found
    }
    console.error("[v0] Error fetching user:", error);
    throw new Error(`Failed to fetch user: ${error.message}`);
  }

  console.log("[v0] Found user:", data);
  return mapDbUserToUser(data);
}

/**
 * Get user by email from application.users
 */
export async function getUserByEmail(
  supabase: SupabaseClient,
  email: string
): Promise<User | null> {
  console.log("[v0] getUserByEmail called for:", email);
  
  const { data, error } = await supabase
    .schema("application")
    .from("users")
    .select(`
      *,
      detected_country:countries!detected_country_id(name, country_code),
      detected_city:cities!detected_city_id(name),
      profile_country:countries!profile_country_id(name, country_code),
      profile_city:cities!profile_city_id(name)
    `)
    .eq("email", email.toLowerCase())
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      console.log("[v0] User not found by email:", email);
      return null;
    }
    console.error("[v0] Error fetching user by email:", error);
    throw new Error(`Failed to fetch user: ${error.message}`);
  }

  console.log("[v0] Found user by email:", data);
  return mapDbUserToUser(data);
}

/**
 * Create or update user in application.users
 * Uses upsert to handle both new and existing users
 */
export async function upsertUser(
  supabase: SupabaseClient,
  userData: {
    userId: string;
    email: string;
    name?: string;
    city?: string;
    country?: string;
    countryCode?: string;
    isAdmin?: boolean;
  }
): Promise<User> {
  console.log("[v0] upsertUser called with:", userData);
  
  // First, try to find country and city IDs
  let detectedCountryId: string | null = null;
  let detectedCityId: string | null = null;

  if (userData.country) {
    const { data: countryData } = await supabase
      .schema("application")
      .from("countries")
      .select("country_id")
      .ilike("name", userData.country)
      .single();
    
    detectedCountryId = countryData?.country_id || null;
    console.log("[v0] Found country ID:", detectedCountryId, "for", userData.country);

    if (detectedCountryId && userData.city) {
      const { data: cityData } = await supabase
        .schema("application")
        .from("cities")
        .select("city_id")
        .eq("country_id", detectedCountryId)
        .ilike("name", userData.city)
        .single();
      
      detectedCityId = cityData?.city_id || null;
      console.log("[v0] Found city ID:", detectedCityId, "for", userData.city);
    }
  }

  // Upsert the user
  const { data, error } = await supabase
    .schema("application")
    .from("users")
    .upsert({
      user_id: userData.userId,
      email: userData.email.toLowerCase(),
      display_name: userData.name || null,
      detected_country_id: detectedCountryId,
      detected_city_id: detectedCityId,
      detected_at: new Date().toISOString(),
      is_admin: userData.isAdmin || false,
      last_login_at: new Date().toISOString(),
    }, {
      onConflict: "user_id",
      ignoreDuplicates: false,
    })
    .select(`
      *,
      detected_country:countries!detected_country_id(name, country_code),
      detected_city:cities!detected_city_id(name),
      profile_country:countries!profile_country_id(name, country_code),
      profile_city:cities!profile_city_id(name)
    `)
    .single();

  if (error) {
    console.error("[v0] Error upserting user:", error);
    throw new Error(`Failed to create/update user: ${error.message}`);
  }

  console.log("[v0] Upserted user:", data);
  return mapDbUserToUser(data);
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  supabase: SupabaseClient,
  userId: string,
  updates: {
    name?: string;
    city?: string;
    country?: string;
    avatarUrl?: string;
  }
): Promise<User> {
  console.log("[v0] updateUserProfile called for:", userId, updates);
  
  const updateData: Record<string, unknown> = {};
  
  if (updates.name !== undefined) {
    updateData.display_name = updates.name;
  }
  
  if (updates.avatarUrl !== undefined) {
    updateData.avatar_image_key = updates.avatarUrl;
  }

  // Handle location updates
  if (updates.country) {
    const { data: countryData } = await supabase
      .schema("application")
      .from("countries")
      .select("country_id")
      .ilike("name", updates.country)
      .single();
    
    if (countryData) {
      updateData.profile_country_id = countryData.country_id;
      
      if (updates.city) {
        const { data: cityData } = await supabase
          .schema("application")
          .from("cities")
          .select("city_id")
          .eq("country_id", countryData.country_id)
          .ilike("name", updates.city)
          .single();
        
        if (cityData) {
          updateData.profile_city_id = cityData.city_id;
        }
      }
    }
  }

  const { data, error } = await supabase
    .schema("application")
    .from("users")
    .update(updateData)
    .eq("user_id", userId)
    .select(`
      *,
      detected_country:countries!detected_country_id(name, country_code),
      detected_city:cities!detected_city_id(name),
      profile_country:countries!profile_country_id(name, country_code),
      profile_city:cities!profile_city_id(name)
    `)
    .single();

  if (error) {
    console.error("[v0] Error updating user profile:", error);
    throw new Error(`Failed to update user profile: ${error.message}`);
  }

  console.log("[v0] Updated user profile:", data);
  return mapDbUserToUser(data);
}
