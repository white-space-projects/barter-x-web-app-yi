import { NextRequest, NextResponse } from "next/server";
import {
  fetchSubcategoryById,
  updateSubcategoryFields,
} from "@/lib/db/repositories/subcategories";

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

/**
 * PUT /api/data/subcategories/[subcategoryId]
 * Update subcategory field schemas
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { subcategoryId } = await params;
    const body = await request.json();
    const { productInfoFields, offerInfoFields } = body;

    // Validate field definitions structure
    if (productInfoFields && !Array.isArray(productInfoFields)) {
      return NextResponse.json(
        { error: "productInfoFields must be an array" },
        { status: 400 }
      );
    }

    if (offerInfoFields && !Array.isArray(offerInfoFields)) {
      return NextResponse.json(
        { error: "offerInfoFields must be an array" },
        { status: 400 }
      );
    }

    const subcategory = await updateSubcategoryFields(subcategoryId, {
      productInfoFields,
      offerInfoFields,
    });

    if (!subcategory) {
      return NextResponse.json({ error: "Subcategory not found" }, { status: 404 });
    }

    return NextResponse.json({ subcategory });
  } catch (error) {
    console.error("[API] Subcategory update error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update subcategory" },
      { status: 500 }
    );
  }
}
