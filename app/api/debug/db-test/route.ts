/**
 * Database Test Endpoint
 * ======================
 * Tests direct PostgreSQL connection to application schema.
 * This helps diagnose connection issues.
 */

import { NextResponse } from "next/server";
import { query, checkConnection } from "@/lib/db/postgres";

export async function GET() {
  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    env: {
      hasPostgresUrl: !!process.env.POSTGRES_URL,
      postgresUrlLength: process.env.POSTGRES_URL?.length || 0,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
    },
  };

  try {
    // Test basic connection
    const connected = await checkConnection();
    results.connected = connected;

    if (!connected) {
      results.error = "Database connection failed - POSTGRES_URL may be missing or invalid";
      return NextResponse.json(results, { status: 500 });
    }

    // Test query to application schema
    const productsCount = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM application.products`
    );
    results.productsCount = parseInt(productsCount[0]?.count || "0", 10);

    // Get sample products
    const sampleProducts = await query<{ product_id: string; title: string }>(
      `SELECT product_id, title FROM application.products LIMIT 3`
    );
    results.sampleProducts = sampleProducts;

    // Test users table
    const usersCount = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM application.users`
    );
    results.usersCount = parseInt(usersCount[0]?.count || "0", 10);

    // Test barter_types table
    const barterTypes = await query<{ slug: string; name: string }>(
      `SELECT slug, name FROM application.barter_types WHERE is_active = true`
    );
    results.barterTypes = barterTypes;

    results.success = true;
    return NextResponse.json(results);
  } catch (error) {
    results.error = error instanceof Error ? error.message : "Unknown error";
    results.errorStack = error instanceof Error ? error.stack : undefined;
    return NextResponse.json(results, { status: 500 });
  }
}
