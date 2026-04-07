/**
 * Products API Route
 * ==================
 * Fetches products directly from application schema using direct PostgreSQL connection.
 * Bypasses PostgREST limitations to access application schema.
 * 
 * Easy for backend developer to replace with Laravel API calls.
 */

import { NextRequest, NextResponse } from "next/server";
import { fetchProducts, createProduct } from "@/lib/db/repositories/products";
import type { ProductType } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    // Get query params
    const searchParams = request.nextUrl.searchParams;
    const barterType = searchParams.get("barterType") as ProductType | null;
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const { products, total } = await fetchProducts({
      barterTypeSlug: barterType || undefined,
      limit,
      offset,
    });
    
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

/**
 * POST /api/data/products
 * Create a new product (used by Back Office Catalog Assets)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.title || !body.barterTypeId) {
      return NextResponse.json(
        { error: "title and barterTypeId are required" },
        { status: 400 }
      );
    }
    
    const product = await createProduct({
      title: body.title,
      barterTypeId: body.barterTypeId,
      categoryId: body.categoryId,
      subcategoryId: body.subcategoryId,
      brandId: body.brandId,
      model: body.model,
      description: body.description,
      productInfo: body.productInfo,
      imageKey: body.imageKey,
    });
    
    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error("[API] Product create error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create product" },
      { status: 500 }
    );
  }
}
