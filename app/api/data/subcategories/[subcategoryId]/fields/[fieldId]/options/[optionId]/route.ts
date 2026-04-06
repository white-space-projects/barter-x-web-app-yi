import { NextRequest, NextResponse } from "next/server";
import { updateFieldOption, deleteFieldOption } from "@/lib/db/repositories/subcategories";

type RouteParams = { params: Promise<{ subcategoryId: string; fieldId: string; optionId: string }> };

/**
 * PUT /api/data/subcategories/.../options/[optionId]
 * Update an option
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { optionId } = await params;
    const body = await request.json();

    const option = await updateFieldOption(optionId, body);

    if (!option) {
      return NextResponse.json({ error: "Option not found" }, { status: 404 });
    }

    return NextResponse.json({ option });
  } catch (error) {
    console.error("[API] Option update error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update option" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/data/subcategories/.../options/[optionId]
 * Delete an option
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { optionId } = await params;

    const deleted = await deleteFieldOption(optionId);

    if (!deleted) {
      return NextResponse.json({ error: "Option not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Option delete error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete option" },
      { status: 500 }
    );
  }
}
