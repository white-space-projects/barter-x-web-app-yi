/**
 * Brand Detail API Route
 * ======================
 * PATCH: Update brand (logo, etc.)
 */

import { NextRequest, NextResponse } from "next/server";
import { updateBrandLogo } from "@/lib/db/repositories/products";

type RouteParams = {
  params: Promise<{ brandId: string }>;
};

/**
 * PATCH /api/data/brands/[brandId]
 * Update brand fields (logoKey)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { brandId } = await params;
    const body = await request.json();
    
    if (body.logoKey !== undefined) {
      await updateBrandLogo(brandId, body.logoKey);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Brand update error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update brand" },
      { status: 500 }
    );
  }
}
