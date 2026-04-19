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
  console.log("[v0] Product detail API: Starting GET");
  try {
    const { productId } = await params;
    console.log("[v0] Product detail API: productId =", productId);
    
    const product = await fetchProductWithIds(productId);
    console.log("[v0] Product detail API: fetchProductWithIds returned", product ? "product" : "null");
    
    if (!product) {
      console.log("[v0] Product detail API: Product not found for ID:", productId);
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    
    console.log("[v0] Product detail API: Success, returning product:", product.title);
    return NextResponse.json({ product });
  } catch (error) {
    console.error("[v0] Product detail API: Error:", error);
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
      categoryId: body.categoryId,
      subcategoryId: body.subcategoryId,
      brandId: body.brandId,
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

/**
 * PUT /api/data/products/[productId]
 * Update product fields (same as PATCH, for compatibility)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { productId } = await params;
    const body = await request.json();
    
    const product = await updateProduct(productId, {
      title: body.title,
      description: body.description,
      productInfo: body.productInfo,
      imageKey: body.imageKey,
      categoryId: body.categoryId,
      subcategoryId: body.subcategoryId,
      brandId: body.brandId,
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
