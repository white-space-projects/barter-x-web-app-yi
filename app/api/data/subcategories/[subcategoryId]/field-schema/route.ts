import { NextRequest, NextResponse } from "next/server";
import { getSubcategoryFieldSchema } from "@/lib/db/repositories/subcategories";

type RouteParams = { params: Promise<{ subcategoryId: string }> };

/**
 * GET /api/data/subcategories/[subcategoryId]/field-schema
 * Get just the field schema for a subcategory (used by frontend forms)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { subcategoryId } = await params;
    const schema = await getSubcategoryFieldSchema(subcategoryId);

    if (!schema) {
      return NextResponse.json({ error: "Subcategory not found" }, { status: 404 });
    }

    return NextResponse.json(schema);
  } catch (error) {
    console.error("[API] Field schema fetch error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch field schema" },
      { status: 500 }
    );
  }
}
