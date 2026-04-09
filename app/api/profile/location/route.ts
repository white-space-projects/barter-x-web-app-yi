import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db/postgres";

// POST /api/profile/location - Store user location after login
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      detected_country_id,
      detected_city_id,
      selected_country_id,
      selected_city_id,
    } = body;

    // Update user_profiles with location data
    await query(
      `UPDATE application.user_profiles 
       SET 
         detected_country_id = COALESCE($2, detected_country_id),
         detected_city_id = COALESCE($3, detected_city_id),
         detected_at = CASE WHEN $2 IS NOT NULL THEN NOW() ELSE detected_at END,
         country_id = COALESCE($4, country_id),
         city_id = COALESCE($5, city_id),
         updated_at = NOW()
       WHERE user_id = $1`,
      [
        session.userId,
        detected_country_id || null,
        detected_city_id || null,
        selected_country_id || null,
        selected_city_id || null,
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[v0] Profile location API error:", error);
    return NextResponse.json(
      { error: "Failed to update location" },
      { status: 500 }
    );
  }
}
