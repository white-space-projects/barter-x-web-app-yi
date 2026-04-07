import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

interface DbOption {
  option_id: string;
  option_label: string;
  option_value: string;
  field_id: string;
  field_label: string;
  subcategory_name: string;
}

/**
 * GET /api/data/field-options/search
 * Search existing options across all fields (case-insensitive)
 * Query params:
 *   - q: search query (required, min 1 char)
 *   - limit: max results (default 20)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get("q") || "";
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

    if (!searchQuery.trim()) {
      return NextResponse.json({ options: [], message: "Search query required" });
    }

    // Search for distinct option labels (case-insensitive)
    // Returns unique option labels with their usage context
    const sql = `
      SELECT DISTINCT ON (LOWER(o.option_label))
        o.option_id,
        o.option_label,
        o.option_value,
        o.field_id,
        f.field_label,
        s.name as subcategory_name
      FROM application.subcategory_product_field_options o
      JOIN application.subcategory_product_fields f ON o.field_id = f.field_id
      JOIN application.subcategories s ON f.subcategory_id = s.subcategory_id
      WHERE LOWER(o.option_label) LIKE LOWER($1)
        AND o.is_active = true
        AND f.is_active = true
      ORDER BY LOWER(o.option_label), o.option_label
      LIMIT $2
    `;

    const results = await query<DbOption>(sql, [`%${searchQuery}%`, limit]);

    const options = results.map((row) => ({
      optionId: row.option_id,
      optionLabel: row.option_label,
      optionValue: row.option_value,
      fieldId: row.field_id,
      fieldLabel: row.field_label,
      subcategoryName: row.subcategory_name,
    }));

    return NextResponse.json({ 
      options, 
      count: options.length,
      searchQuery: searchQuery.trim()
    });
  } catch (error) {
    console.error("[API] Option search error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to search options" },
      { status: 500 }
    );
  }
}
