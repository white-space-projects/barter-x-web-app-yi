/**
 * Brand Detail API Route
 * ======================
 * PATCH: Update brand (logo, name, etc.)
 */

import { NextRequest, NextResponse } from "next/server";
import { updateBrandLogo, updateBrandName, updateBrandLogoData } from "@/lib/db/repositories/products";

type RouteParams = {
  params: Promise<{ brandId: string }>;
};

/**
 * PATCH /api/data/brands/[brandId]
 * Update brand fields (logoKey, logoData, name)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { brandId } = await params;
    const body = await request.json();
    
    // Update logo key (path reference)
    if (body.logoKey !== undefined) {
      await updateBrandLogo(brandId, body.logoKey);
    }
    
    // Update logo data (base64 image stored directly in DB)
    if (body.logoData !== undefined) {
      await updateBrandLogoData(brandId, body.logoData);
    }
    
    // Update brand name
    if (body.name !== undefined) {
      await updateBrandName(brandId, body.name);
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
