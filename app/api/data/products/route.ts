/**
 * Products API Route
 * ==================
 * Fetches products directly from application schema using direct PostgreSQL connection.
 * Bypasses PostgREST limitations to access application schema.
 * 
 * Easy for backend developer to replace with Laravel API calls.
 */

import { NextRequest, NextResponse } from "next/server";
import { fetchProducts, fetchProductsForCatalog, createProduct } from "@/lib/db/repositories/products";
import type { ProductType } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    // Get query params
    const searchParams = request.nextUrl.searchParams;
    const barterType = searchParams.get("barterType") as ProductType | null;
    const subcategoryId = searchParams.get("subcategoryId");
    const brandId = searchParams.get("brandId");
    const search = searchParams.get("search");
    const includeInactive = searchParams.get("includeInactive") === "true";
    const format = searchParams.get("format"); // "catalog" for back office
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const offset = (page - 1) * limit;

    // Use catalog function for back office (extended fields), regular function for app
    if (format === "catalog") {
      const { products, total } = await fetchProductsForCatalog({
        barterTypeSlug: barterType || undefined,
        subcategoryId: subcategoryId || undefined,
        brandId: brandId || undefined,
        search: search || undefined,
        includeInactive,
        limit,
        offset,
      });
      
      return NextResponse.json({ 
        products, 
        total,
        page,
        limit,
        offset,
      });
    }
    
    // Default: use regular fetchProducts for app (returns Product type)
    const { products, total } = await fetchProducts({
      barterTypeSlug: barterType || undefined,
      subcategoryId: subcategoryId || undefined,
      brandId: brandId || undefined,
      search: search || undefined,
      includeInactive,
      limit,
      offset,
    });
    
    return NextResponse.json({ 
      products, 
      total,
      page,
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
