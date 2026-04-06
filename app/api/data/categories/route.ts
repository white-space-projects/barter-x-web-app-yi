import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db/postgres";

interface DbCategory {
  category_id: string;
  barter_type_id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  barter_type_name: string | null;
}

/**
 * GET /api/data/categories
 * Fetch all categories, optionally filtered by barter type
 * Query params:
 *   - barterTypeId: Filter by barter type
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const barterTypeId = searchParams.get("barterTypeId");

    const conditions: string[] = ["c.is_active = true"];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (barterTypeId) {
      conditions.push(`c.barter_type_id = $${paramIndex}`);
      params.push(barterTypeId);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const sql = `
      SELECT 
        c.category_id,
        c.barter_type_id,
        c.name,
        c.slug,
        c.description,
        c.icon,
        c.sort_order,
        c.is_active,
        bt.name as barter_type_name
      FROM application.categories c
      LEFT JOIN application.barter_types bt ON c.barter_type_id = bt.barter_type_id
      ${whereClause}
      ORDER BY c.sort_order ASC, c.name ASC
    `;

    const rows = await query<DbCategory>(sql, params);

    const categories = rows.map((row) => ({
      categoryId: row.category_id,
      barterTypeId: row.barter_type_id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      icon: row.icon,
      sortOrder: row.sort_order,
      isActive: row.is_active,
      barterTypeName: row.barter_type_name,
    }));

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("[API] Categories fetch error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
