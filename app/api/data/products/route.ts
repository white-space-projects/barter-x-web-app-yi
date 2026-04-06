/**
 * Products API Route
 * ==================
 * Fetches products directly from Supabase database.
 * Replaces external backend proxy for product data.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchProducts, createProduct } from "@/lib/supabase/data-services";
import type { ProductType } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Products API: GET request received");
    
    const supabase = await createClient();
    
    // Get query params
    const searchParams = request.nextUrl.searchParams;
    const barterType = searchParams.get("barterType") as ProductType | null;
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    console.log("[v0] Products API: Fetching with params:", { barterType, limit, offset });

    const { products, total } = await fetchProducts(supabase, {
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
      { error: error instanceof Error ? error.message : "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { barterTypeSlug, categoryName, subcategoryName, brandName, model, title, description, imageKey } = body;

    if (!barterTypeSlug || !categoryName || !subcategoryName || !title) {
      return NextResponse.json(
        { error: "Missing required fields: barterTypeSlug, categoryName, subcategoryName, title" },
        { status: 400 }
      );
    }

    const product = await createProduct(supabase, {
      barterTypeSlug,
      categoryName,
      subcategoryName,
      brandName,
      model,
      title,
      description,
      imageKey,
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
