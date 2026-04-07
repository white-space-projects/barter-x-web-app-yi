/**
 * Brands API Route
 * ================
 * GET: Fetch all brands
 */

import { NextResponse } from "next/server";
import { fetchBrands } from "@/lib/db/repositories/products";

/**
 * GET /api/data/brands
 * Fetch all active brands
 */
export async function GET() {
  try {
    const brands = await fetchBrands();
    return NextResponse.json({ brands });
  } catch (error) {
    console.error("[API] Brands fetch error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch brands" },
      { status: 500 }
    );
  }
}
