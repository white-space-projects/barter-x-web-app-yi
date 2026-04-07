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
    
    const product = await fetchProductWithIds(productId);
    
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    
    return NextResponse.json({ product });
  } catch (error) {
    console.error("[API] Product fetch error:", error);
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
