import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db/postgres";

/**
 * GET /api/data/fields/labels
 * Get field labels by field IDs
 * Query param: fieldIds (comma-separated UUIDs)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fieldIdsParam = searchParams.get("fieldIds");
    
    if (!fieldIdsParam) {
      return NextResponse.json({ labels: {} });
    }
    
    const fieldIds = fieldIdsParam.split(",").filter(id => id.trim());
    
    if (fieldIds.length === 0) {
      return NextResponse.json({ labels: {} });
    }
    
    // Query subcategory_product_fields table to get labels
    const placeholders = fieldIds.map((_, i) => `$${i + 1}`).join(", ");
    const sql = `
      SELECT field_id, field_label 
      FROM application.subcategory_product_fields 
      WHERE field_id IN (${placeholders})
    `;
    
    const result = await query<{ field_id: string; field_label: string }>(sql, fieldIds);
    
    // Build label map
    const labels: Record<string, string> = {};
    result.forEach(row => {
      labels[row.field_id] = row.field_label;
    });
    
    return NextResponse.json({ labels });
  } catch (error) {
    console.error("[API] Field labels fetch error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch field labels", labels: {} },
      { status: 500 }
    );
  }
}
