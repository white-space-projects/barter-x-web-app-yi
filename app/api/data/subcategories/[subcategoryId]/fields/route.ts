import { NextRequest, NextResponse } from "next/server";
import {
  createField,
  createFieldOption,
  fetchSubcategoryById,
} from "@/lib/db/repositories/subcategories";

type RouteParams = { params: Promise<{ subcategoryId: string }> };

/**
 * GET /api/data/subcategories/[subcategoryId]/fields
 * Fetch all fields for a subcategory
 * Query params:
 *   - scope: 'product' | 'offer' - filter by field_scope (optional, returns all if not specified)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { subcategoryId } = await params;
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope");
    
    const subcategory = await fetchSubcategoryById(subcategoryId);

    if (!subcategory) {
      return NextResponse.json({ error: "Subcategory not found" }, { status: 404 });
    }

    // subcategory object has productFields and offerFields as separate arrays
    const productFields = subcategory.productFields || [];
    const offerFields = subcategory.offerFields || [];
    const allFields = [...productFields, ...offerFields];
    
    // Debug log for offer field fetching
    console.log("[v0] Fields API - subcategoryId:", subcategoryId, "scope:", scope, "productFields:", productFields.length, "offerFields:", offerFields.length);
    
    // Filter by scope if specified
    if (scope === "offer") {
      console.log("[v0] Fields API - returning", offerFields.length, "offer fields (field_scope: offer)");
      return NextResponse.json({ offerFields, totalCount: offerFields.length });
    } else if (scope === "product") {
      return NextResponse.json({ productFields, totalCount: productFields.length });
    }
    
    // Return all fields if no scope filter
    return NextResponse.json({ fields: allFields, totalCount: allFields.length });
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
 * Required body: fieldLabel, fieldType, fieldScope
 * fieldKey is auto-generated from fieldLabel if not provided
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { subcategoryId } = await params;
    const body = await request.json();
    const { fieldKey, fieldLabel, fieldType, fieldScope, placeholder, helpText, dateMode, isRequired, isFilterable, sortOrder } = body;

    // fieldLabel, fieldType, and fieldScope are required; fieldKey is auto-generated
    if (!fieldLabel || !fieldType || !fieldScope) {
      return NextResponse.json(
        { error: "Missing required fields: fieldLabel, fieldType, fieldScope" },
        { status: 400 }
      );
    }

    // Validate fieldScope
    if (!["product", "offer"].includes(fieldScope)) {
      return NextResponse.json(
        { error: "fieldScope must be 'product' or 'offer'" },
        { status: 400 }
      );
    }

    // Validate dateMode if provided
    if (dateMode && !["month_year", "day_month_year", "year_only"].includes(dateMode)) {
      return NextResponse.json(
        { error: "dateMode must be 'month_year', 'day_month_year', or 'year_only'" },
        { status: 400 }
      );
    }

    // Auto-generate fieldKey from fieldLabel if not provided
    const generatedFieldKey = fieldKey || fieldLabel
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");

    const field = await createField({
      subcategoryId,
      fieldKey: generatedFieldKey,
      fieldLabel,
      fieldType,
      fieldScope,
      placeholder,
      helpText,
      dateMode,
      isRequired,
      isFilterable,
      sortOrder,
    });

    // Create options for select/multiselect fields
    const { options } = body;
    if ((fieldType === "select" || fieldType === "multiselect") && Array.isArray(options) && options.length > 0) {
      console.log("[v0] Creating", options.length, "options for field:", field.fieldId);
      for (const opt of options) {
        await createFieldOption({
          fieldId: field.fieldId,
          optionValue: opt.optionValue,
          optionLabel: opt.optionLabel,
          sortOrder: opt.sortOrder ?? 0,
        });
      }
      console.log("[v0] Options created successfully");
    }

    return NextResponse.json({ field }, { status: 201 });
  } catch (error) {
    console.error("[API] Field create error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create field" },
      { status: 500 }
    );
  }
}
