import { NextRequest, NextResponse } from "next/server";
import {
  createField,
  fetchSubcategoryById,
} from "@/lib/db/repositories/subcategories";

type RouteParams = { params: Promise<{ subcategoryId: string }> };

/**
 * GET /api/data/subcategories/[subcategoryId]/fields
 * Fetch all fields for a subcategory
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { subcategoryId } = await params;
    const subcategory = await fetchSubcategoryById(subcategoryId);

    if (!subcategory) {
      return NextResponse.json({ error: "Subcategory not found" }, { status: 404 });
    }

    return NextResponse.json({ fields: subcategory.productFields });
  } catch (error) {
    console.error("[API] Fields fetch error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch fields" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/data/subcategories/[subcategoryId]/fields
 * Create a new field for the subcategory
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { subcategoryId } = await params;
    const body = await request.json();
    const { fieldKey, fieldLabel, fieldType, placeholder, helpText, isRequired, isFilterable, sortOrder } = body;

    if (!fieldKey || !fieldLabel || !fieldType) {
      return NextResponse.json(
        { error: "Missing required fields: fieldKey, fieldLabel, fieldType" },
        { status: 400 }
      );
    }

    const field = await createField({
      subcategoryId,
      fieldKey,
      fieldLabel,
      fieldType,
      placeholder,
      helpText,
      isRequired,
      isFilterable,
      sortOrder,
    });

    return NextResponse.json({ field }, { status: 201 });
  } catch (error) {
    console.error("[API] Field create error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create field" },
      { status: 500 }
    );
  }
}
