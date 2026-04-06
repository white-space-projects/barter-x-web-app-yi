import { NextRequest, NextResponse } from "next/server";
import { updateField, deleteField } from "@/lib/db/repositories/subcategories";

type RouteParams = { params: Promise<{ subcategoryId: string; fieldId: string }> };

/**
 * PUT /api/data/subcategories/[subcategoryId]/fields/[fieldId]
 * Update a field
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { fieldId } = await params;
    const body = await request.json();

    const field = await updateField(fieldId, body);

    if (!field) {
      return NextResponse.json({ error: "Field not found" }, { status: 404 });
    }

    return NextResponse.json({ field });
  } catch (error) {
    console.error("[API] Field update error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update field" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/data/subcategories/[subcategoryId]/fields/[fieldId]
 * Delete a field
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { fieldId } = await params;

    const deleted = await deleteField(fieldId);

    if (!deleted) {
      return NextResponse.json({ error: "Field not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Field delete error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete field" },
      { status: 500 }
    );
  }
}
