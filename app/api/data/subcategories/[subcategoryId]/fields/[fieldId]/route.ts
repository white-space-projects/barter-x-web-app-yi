import { NextRequest, NextResponse } from "next/server";
import { updateField, deleteField, createFieldOption, deleteFieldOptions } from "@/lib/db/repositories/subcategories";

type RouteParams = { params: Promise<{ subcategoryId: string; fieldId: string }> };

/**
 * PUT /api/data/subcategories/[subcategoryId]/fields/[fieldId]
 * Update a field
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { fieldId } = await params;
    const body = await request.json();
    const { options, ...fieldData } = body;

    const field = await updateField(fieldId, fieldData);

    if (!field) {
      return NextResponse.json({ error: "Field not found" }, { status: 404 });
    }

    // Handle options for select/multiselect fields
    const fieldType = fieldData.fieldType || field.fieldType;
    if ((fieldType === "select" || fieldType === "multiselect") && Array.isArray(options)) {
      console.log("[v0] Updating options for field:", fieldId, "- deleting existing and creating", options.length, "new");
      // Delete existing options and create new ones
      await deleteFieldOptions(fieldId);
      for (const opt of options) {
        await createFieldOption({
          fieldId,
          optionValue: opt.optionValue,
          optionLabel: opt.optionLabel,
          sortOrder: opt.sortOrder ?? 0,
        });
      }
      console.log("[v0] Options updated successfully");
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
