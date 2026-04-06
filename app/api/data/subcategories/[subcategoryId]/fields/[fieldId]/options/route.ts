import { NextRequest, NextResponse } from "next/server";
import { createFieldOption } from "@/lib/db/repositories/subcategories";

type RouteParams = { params: Promise<{ subcategoryId: string; fieldId: string }> };

/**
 * POST /api/data/subcategories/[subcategoryId]/fields/[fieldId]/options
 * Create a new option for a select field
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { fieldId } = await params;
    const body = await request.json();
    const { optionValue, optionLabel, sortOrder } = body;

    if (!optionValue || !optionLabel) {
      return NextResponse.json(
        { error: "Missing required fields: optionValue, optionLabel" },
        { status: 400 }
      );
    }

    const option = await createFieldOption({
      fieldId,
      optionValue,
      optionLabel,
      sortOrder,
    });

    return NextResponse.json({ option }, { status: 201 });
  } catch (error) {
    console.error("[API] Option create error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create option" },
      { status: 500 }
    );
  }
}
