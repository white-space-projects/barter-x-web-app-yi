import { NextRequest, NextResponse } from "next/server";
import { fetchSubcategoryById } from "@/lib/db/repositories/subcategories";

type RouteParams = { params: Promise<{ subcategoryId: string }> };

/**
 * GET /api/data/subcategories/[subcategoryId]
 * Fetch a single subcategory with its field schemas
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { subcategoryId } = await params;
    const subcategory = await fetchSubcategoryById(subcategoryId);

    if (!subcategory) {
      return NextResponse.json({ error: "Subcategory not found" }, { status: 404 });
    }

    return NextResponse.json({ subcategory });
  } catch (error) {
    console.error("[API] Subcategory fetch error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch subcategory" },
      { status: 500 }
    );
  }
}
