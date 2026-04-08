import { NextResponse } from "next/server";
import { query } from "@/lib/db/postgres";

// Public endpoint - no auth required for login page
export async function GET() {
  try {
    const result = await query<{
      country_id: string;
      country_code: string;
      name: string;
    }>(
      `SELECT country_id, country_code, name 
       FROM application.countries 
       WHERE is_active = true 
       ORDER BY name ASC`
    );

    const countries = result.map((row) => ({
      id: row.country_id,
      code: row.country_code,
      name: row.name,
    }));

    return NextResponse.json({ countries });
  } catch (error) {
    console.error("[v0] Countries API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch countries" },
      { status: 500 }
    );
  }
}
