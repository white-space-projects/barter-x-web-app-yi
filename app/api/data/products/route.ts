/**
 * Products API Route
 * ==================
 * Fetches products directly from application schema using direct PostgreSQL connection.
 * Bypasses PostgREST limitations to access application schema.
 * 
 * Easy for backend developer to replace with Laravel API calls.
 */

import { NextRequest, NextResponse } from "next/server";
import { fetchProducts } from "@/lib/db/repositories/products";
import type { ProductType } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Products API: GET request received");
    
    // Get query params
    const searchParams = request.nextUrl.searchParams;
    const barterType = searchParams.get("barterType") as ProductType | null;
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    console.log("[v0] Products API: Fetching with params:", { barterType, limit, offset });

    const { products, total } = await fetchProducts({
      barterTypeSlug: barterType || undefined,
      limit,
      offset,
    });
    
    console.log("[v0] Products API: Fetched", products.length, "products, total:", total);
    
    return NextResponse.json({ 
      products, 
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("[API] Products fetch error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch products", products: [], total: 0 },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // For now, product creation is not implemented via direct SQL
    // Products are typically created through the backoffice
    return NextResponse.json(
      { error: "Product creation is managed through the backoffice" },
      { status: 501 }
    );
  } catch (error) {
    console.error("[API] Product create error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create product" },
      { status: 500 }
    );
  }
}
