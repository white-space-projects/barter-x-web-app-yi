import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db/postgres";

// Public endpoint - no auth required for login page
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const countryId = searchParams.get("countryId");

    if (!countryId) {
      return NextResponse.json(
        { error: "countryId is required" },
        { status: 400 }
      );
    }

    const result = await query<{
      city_id: string;
      country_id: string;
      name: string;
    }>(
      `SELECT city_id, country_id, name 
       FROM application.cities 
       WHERE country_id = $1 AND is_active = true 
       ORDER BY name ASC`,
      [countryId]
    );

    const cities = result.map((row) => ({
      id: row.city_id,
      countryId: row.country_id,
      name: row.name,
    }));

    return NextResponse.json({ cities });
  } catch (error) {
    console.error("[v0] Cities API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch cities" },
      { status: 500 }
    );
  }
}
