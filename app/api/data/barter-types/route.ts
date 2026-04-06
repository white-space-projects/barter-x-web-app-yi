import { NextResponse } from "next/server";
import { query } from "@/lib/db/postgres";

interface DbBarterType {
  barter_type_id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
}

/**
 * GET /api/data/barter-types
 * Fetch all barter types
 */
export async function GET() {
  try {
    const sql = `
      SELECT barter_type_id, name, slug, description, is_active
      FROM application.barter_types
      WHERE is_active = true
      ORDER BY name ASC
    `;

    const rows = await query<DbBarterType>(sql);

    const barterTypes = rows.map((row) => ({
      barterTypeId: row.barter_type_id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      isActive: row.is_active,
    }));

    return NextResponse.json({ barterTypes });
  } catch (error) {
    console.error("[API] Barter types fetch error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch barter types" },
      { status: 500 }
    );
  }
}
