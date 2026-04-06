/**
 * Direct PostgreSQL Connection
 * ============================
 * Uses direct database connection to query application schema.
 * This bypasses PostgREST limitations and allows querying any schema.
 * 
 * Production-friendly: Easy for backend developer to replace with Laravel APIs.
 */

import postgres from "postgres";

// Connection string from Supabase - uses the direct connection URL
const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.warn("[DB] No POSTGRES_URL or DATABASE_URL environment variable set");
}

// Create postgres client with connection pooling
// Using transaction mode for serverless compatibility
export const sql = connectionString
  ? postgres(connectionString, {
      max: 10, // Max connections in pool
      idle_timeout: 20, // Close idle connections after 20 seconds
      connect_timeout: 10, // Connection timeout
    })
  : null;

/**
 * Execute a query and return results
 * Wrapper for easy migration to other backends later
 */
export async function query<T = Record<string, unknown>>(
  queryText: string,
  params?: unknown[]
): Promise<T[]> {
  if (!sql) {
    throw new Error("Database not configured - missing POSTGRES_URL");
  }
  
  try {
    // postgres library uses tagged template literals, but we need dynamic queries
    // Use unsafe for dynamic SQL (params are still escaped)
    const result = await sql.unsafe<T[]>(queryText, params);
    return result;
  } catch (error) {
    console.error("[DB] Query error:", error);
    throw error;
  }
}

/**
 * Check if database is connected
 */
export async function checkConnection(): Promise<boolean> {
  if (!sql) return false;
  
  try {
    await sql`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
