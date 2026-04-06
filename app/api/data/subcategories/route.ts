import { NextRequest, NextResponse } from "next/server";
import { fetchSubcategories } from "@/lib/db/repositories/subcategories";

/**
 * GET /api/data/subcategories
 * Fetch subcategories with optional filters
 * Query params: categoryId, barterTypeSlug
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId") || undefined;
    const barterTypeSlug = searchParams.get("barterTypeSlug") || undefined;
    const includeFields = searchParams.get("includeFields") === "true";

    const subcategories = await fetchSubcategories({
      categoryId,
      barterTypeSlug,
      includeFields,
    });

    return NextResponse.json({ subcategories });
  } catch (error) {
    console.error("[API] Subcategories fetch error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch subcategories" },
      { status: 500 }
    );
  }
}
