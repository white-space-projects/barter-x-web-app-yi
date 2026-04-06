/**
 * Users Repository
 * =================
 * Server-side data access for users from application schema.
 * Uses direct PostgreSQL connection.
 * 
 * Matches actual application.users table structure:
 * - user_id, email, phone, first_name, last_name, display_name, bio, avatar_image_key
 * - detected_country_id, detected_city_id, profile_country_id, profile_city_id
 * - is_active, is_verified, is_admin, last_login_at, created_at, updated_at
 * 
 * Easy to replace with Laravel API calls later.
 */

import { query } from "../postgres";

export interface DbUser {
  user_id: string;
  email: string | null;
  phone: string | null;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_image_key: string | null;
  detected_country_id: string | null;
  detected_city_id: string | null;
  profile_country_id: string | null;
  profile_city_id: string | null;
  notification_settings: Record<string, unknown> | null;
  is_active: boolean;
  is_verified: boolean;
  is_admin: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbCountry {
  country_id: string;
  country_code: string;
  name: string;
}

export interface DbCity {
  city_id: string;
  country_id: string;
  name: string;
}

export interface UserWithLocation {
  userId: string;
  email: string | null;
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  bio: string | null;
  avatarImageKey: string | null;
  profileCountryId: string | null;
  profileCityId: string | null;
  countryName: string | null;
  countryCode: string | null;
  cityName: string | null;
  isActive: boolean;
  isVerified: boolean;
  isAdmin: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

/**
 * Find user by email
 */
export async function findUserByEmail(email: string): Promise<DbUser | null> {
  const result = await query<DbUser>(
    `SELECT * FROM application.users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
    [email]
  );
  return result[0] || null;
}

/**
 * Find user by ID
 */
export async function findUserById(userId: string): Promise<DbUser | null> {
  const result = await query<DbUser>(
    `SELECT * FROM application.users WHERE user_id = $1 LIMIT 1`,
    [userId]
  );
  return result[0] || null;
}

/**
 * Find user with joined location data
 */
export async function findUserWithLocation(userId: string): Promise<UserWithLocation | null> {
  const result = await query<DbUser & { 
    country_name: string | null; 
    country_code: string | null; 
    city_name: string | null 
  }>(
    `SELECT u.*, 
      c.name as country_name, 
      c.country_code,
      ci.name as city_name
    FROM application.users u
    LEFT JOIN application.countries c ON u.profile_country_id = c.country_id
    LEFT JOIN application.cities ci ON u.profile_city_id = ci.city_id
    WHERE u.user_id = $1 
    LIMIT 1`,
    [userId]
  );
  
  if (!result[0]) return null;
  
  const u = result[0];
  return {
    userId: u.user_id,
    email: u.email,
    phone: u.phone,
    firstName: u.first_name,
    lastName: u.last_name,
    displayName: u.display_name,
    bio: u.bio,
    avatarImageKey: u.avatar_image_key,
    profileCountryId: u.profile_country_id,
    profileCityId: u.profile_city_id,
    countryName: u.country_name,
    countryCode: u.country_code,
    cityName: u.city_name,
    isActive: u.is_active,
    isVerified: u.is_verified,
    isAdmin: u.is_admin,
    lastLoginAt: u.last_login_at,
    createdAt: u.created_at,
  };
}

/**
 * Create a new user
 * Note: user_id must be explicitly provided as it doesn't have a default
 */
export async function createUser(data: {
  email: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  detectedCountryId?: string;
  detectedCityId?: string;
  profileCountryId?: string;
  profileCityId?: string;
}): Promise<DbUser> {
  // Generate UUID using PostgreSQL's gen_random_uuid()
  const result = await query<DbUser>(
    `INSERT INTO application.users (
      user_id,
      email, display_name, first_name, last_name,
      detected_country_id, detected_city_id, detected_at,
      profile_country_id, profile_city_id,
      is_active, is_verified, is_admin, 
      created_at, updated_at, last_login_at
    ) VALUES (
      gen_random_uuid(),
      $1, $2, $3, $4, $5, $6, NOW(), $7, $8,
      true, false, false, NOW(), NOW(), NOW()
    ) RETURNING *`,
    [
      data.email.toLowerCase(),
      data.displayName || null,
      data.firstName || null,
      data.lastName || null,
      data.detectedCountryId || null,
      data.detectedCityId || null,
      data.profileCountryId || data.detectedCountryId || null,
      data.profileCityId || data.detectedCityId || null,
    ]
  );
  
  if (!result[0]) {
    throw new Error("Failed to create user");
  }
  
  return result[0];
}

/**
 * Update user's last login timestamp
 */
export async function updateLastLogin(userId: string): Promise<void> {
  await query(
    `UPDATE application.users SET last_login_at = NOW(), updated_at = NOW() WHERE user_id = $1`,
    [userId]
  );
}

/**
 * Update user profile data
 */
export async function updateUser(
  userId: string,
  data: {
    displayName?: string;
    firstName?: string;
    lastName?: string;
    bio?: string;
    avatarImageKey?: string;
    profileCountryId?: string;
    profileCityId?: string;
  }
): Promise<DbUser | null> {
  const updates: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (data.displayName !== undefined) {
    updates.push(`display_name = $${paramIndex++}`);
    values.push(data.displayName);
  }
  if (data.firstName !== undefined) {
    updates.push(`first_name = $${paramIndex++}`);
    values.push(data.firstName);
  }
  if (data.lastName !== undefined) {
    updates.push(`last_name = $${paramIndex++}`);
    values.push(data.lastName);
  }
  if (data.bio !== undefined) {
    updates.push(`bio = $${paramIndex++}`);
    values.push(data.bio);
  }
  if (data.avatarImageKey !== undefined) {
    updates.push(`avatar_image_key = $${paramIndex++}`);
    values.push(data.avatarImageKey);
  }
  if (data.profileCountryId !== undefined) {
    updates.push(`profile_country_id = $${paramIndex++}`);
    values.push(data.profileCountryId);
  }
  if (data.profileCityId !== undefined) {
    updates.push(`profile_city_id = $${paramIndex++}`);
    values.push(data.profileCityId);
  }

  if (updates.length === 0) {
    return findUserById(userId);
  }

  updates.push(`updated_at = NOW()`);
  values.push(userId);

  const result = await query<DbUser>(
    `UPDATE application.users SET ${updates.join(", ")} WHERE user_id = $${paramIndex} RETURNING *`,
    values
  );
  
  return result[0] || null;
}

/**
 * Find country by name or code
 */
export async function findCountry(nameOrCode: string): Promise<DbCountry | null> {
  const result = await query<DbCountry>(
    `SELECT country_id, country_code, name FROM application.countries 
     WHERE LOWER(name) = LOWER($1) OR LOWER(country_code) = LOWER($1) 
     LIMIT 1`,
    [nameOrCode]
  );
  return result[0] || null;
}

/**
 * Find city by name within a country
 */
export async function findCity(
  cityName: string,
  countryId?: string
): Promise<DbCity | null> {
  if (countryId) {
    const result = await query<DbCity>(
      `SELECT city_id, name, country_id FROM application.cities 
       WHERE LOWER(name) = LOWER($1) AND country_id = $2 
       LIMIT 1`,
      [cityName, countryId]
    );
    return result[0] || null;
  } else {
    const result = await query<DbCity>(
      `SELECT city_id, name, country_id FROM application.cities 
       WHERE LOWER(name) = LOWER($1) 
       LIMIT 1`,
      [cityName]
    );
    return result[0] || null;
  }
}

/**
 * Get all countries
 */
export async function getCountries(): Promise<DbCountry[]> {
  return query<DbCountry>(
    `SELECT country_id, country_code, name FROM application.countries 
     WHERE is_active = true ORDER BY sort_order, name`
  );
}

/**
 * Get cities for a country
 */
export async function getCities(countryId: string): Promise<DbCity[]> {
  return query<DbCity>(
    `SELECT city_id, name, country_id FROM application.cities 
     WHERE country_id = $1 AND is_active = true ORDER BY name`,
    [countryId]
  );
}
