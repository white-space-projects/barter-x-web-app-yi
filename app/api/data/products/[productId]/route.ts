/**
 * Product Detail API Route
 * ========================
 * GET: Fetch single product with full details (including entity IDs for assets)
 * PATCH: Update product (image, product_info, etc.)
 */

import { NextRequest, NextResponse } from "next/server";
import { fetchProductWithIds, updateProduct } from "@/lib/db/repositories/products";

type RouteParams = {
  params: Promise<{ productId: string }>;
};

/**
 * GET /api/data/products/[productId]
 * Fetch product with all details including entity IDs
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { productId } = await params;
    console.log("[v0] Product detail API: GET request for productId:", productId);
    
    const product = await fetchProductWithIds(productId);
    console.log("[v0] Product detail API: fetchProductWithIds result:", product ? "found" : "not found");
    
    if (!product) {
      console.log("[v0] Product detail API: Product not found for productId:", productId);
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    
    return NextResponse.json({ product });
  } catch (error) {
    console.error("[v0] Product detail API: Error fetching product:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch product" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/data/products/[productId]
 * Update product fields (title, description, productInfo, imageKey)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { productId } = await params;
    const body = await request.json();
    
    const product = await updateProduct(productId, {
      title: body.title,
      description: body.description,
      productInfo: body.productInfo,
      imageKey: body.imageKey,
    });
    
    return NextResponse.json({ product });
  } catch (error) {
    console.error("[API] Product update error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update product" },
      { status: 500 }
    );
  }
}
