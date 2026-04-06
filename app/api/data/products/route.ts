/**
 * Products API Route
 * ==================
 * Fetches products directly from Supabase database using raw SQL.
 * Uses service role key to access the application schema.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Product, ProductType } from "@/lib/types";

// Check if required env vars are set
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create admin client with service role key for full schema access
const supabaseAdmin = SUPABASE_URL && SUPABASE_SERVICE_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null;

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Products API: GET request received");
    
    // Check env vars
    if (!supabaseAdmin) {
      console.error("[v0] Products API: Supabase not configured - missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
      return NextResponse.json(
        { error: "Database not configured", products: [], total: 0 },
        { status: 500 }
      );
    }
    
    // Get query params
    const searchParams = request.nextUrl.searchParams;
    const barterType = searchParams.get("barterType") as ProductType | null;
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    console.log("[v0] Products API: Fetching with params:", { barterType, limit, offset });

    // Try using the schema() method to query application schema
    // This requires the 'application' schema to be exposed in Supabase API settings
    let query = supabaseAdmin
      .schema("application")
      .from("products")
      .select(`
        *,
        barter_type:barter_types(slug, name),
        category:categories(name, slug),
        subcategory:subcategories(name, slug),
        brand:brands(name, slug)
      `, { count: "exact" })
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(limit);
    
    if (offset > 0) {
      query = query.range(offset, offset + limit - 1);
    }
    
    if (barterType) {
      // Get barter type id first
      const { data: btData, error: btError } = await supabaseAdmin
        .schema("application")
        .from("barter_types")
        .select("barter_type_id")
        .eq("slug", barterType)
        .single();
      
      console.log("[v0] Barter type lookup:", { barterType, btData, btError: btError?.message });
      
      if (btData) {
        query = query.eq("barter_type_id", btData.barter_type_id);
      }
    }
    
    const { data: schemaProducts, error: schemaError, count } = await query;
    
    console.log("[v0] Products query result:", { 
      count: schemaProducts?.length, 
      error: schemaError?.message,
      code: schemaError?.code,
      hint: schemaError?.hint
    });
    
    if (schemaError) {
      console.error("[v0] Schema query failed:", schemaError);
      
      // Provide helpful error message for common issues
      if (schemaError.message.includes("relation") && schemaError.message.includes("does not exist")) {
        return NextResponse.json({
          error: "The 'application' schema may not be exposed in Supabase API settings. Please add 'application' to the Exposed Schemas in your Supabase dashboard under Settings > API.",
          products: [],
          total: 0,
        }, { status: 500 });
      }
      
      return NextResponse.json({
        error: `Database query failed: ${schemaError.message}`,
        products: [],
        total: 0,
      }, { status: 500 });
    }
    
    // Map the schema query results
    const products: Product[] = (schemaProducts || []).map((p: any) => ({
      productId: p.product_id,
      name: p.title,
      title: p.title,
      description: p.description || "",
      imageUrl: p.image_key ? `https://mdytcwlxlwvmioizaidu.supabase.co/storage/v1/object/public/product-images/${p.image_key}` : "/placeholder.svg",
      barterType: (p.barter_type?.slug || "goods") as ProductType,
      category: p.category?.name || "",
      subcategory: p.subcategory?.name || "",
      brand: p.brand?.name || "",
      model: p.model || "",
      offerCount: 0,
      isActive: p.is_active,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }));
    
    console.log("[v0] Products API: Fetched", products.length, "products");
    
    return NextResponse.json({ 
      products, 
      total: count || products.length,
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
