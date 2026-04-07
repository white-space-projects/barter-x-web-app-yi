/**
 * Category Detail API Route
 * =========================
 * PATCH: Update category (icon, etc.)
 */

import { NextRequest, NextResponse } from "next/server";
import { updateCategoryIcon } from "@/lib/db/repositories/products";

type RouteParams = {
  params: Promise<{ categoryId: string }>;
};

/**
 * PATCH /api/data/categories/[categoryId]
 * Update category fields (iconKey)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { categoryId } = await params;
    const body = await request.json();
    
    if (body.iconKey !== undefined) {
      await updateCategoryIcon(categoryId, body.iconKey);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Category update error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update category" },
      { status: 500 }
    );
  }
}
