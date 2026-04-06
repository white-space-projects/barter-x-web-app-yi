/**
 * Products API Route
 * ==================
 * Fetches products directly from Supabase database using raw SQL.
 * Uses service role key to access the application schema.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Product, ProductType } from "@/lib/types";

// Create admin client with service role key for full schema access
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Products API: GET request received");
    
    // Get query params
    const searchParams = request.nextUrl.searchParams;
    const barterType = searchParams.get("barterType") as ProductType | null;
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    console.log("[v0] Products API: Fetching with params:", { barterType, limit, offset });

    // Build SQL query for application schema
    let sql = `
      SELECT 
        p.product_id,
        p.title,
        p.description,
        p.image_key,
        p.barter_type_id,
        p.category_id,
        p.subcategory_id,
        p.brand_id,
        p.model,
        p.product_info,
        p.is_active,
        p.created_at,
        p.updated_at,
        bt.slug as barter_type_slug,
        bt.name as barter_type_name,
        c.name as category_name,
        c.slug as category_slug,
        sc.name as subcategory_name,
        sc.slug as subcategory_slug,
        b.name as brand_name,
        b.slug as brand_slug
      FROM application.products p
      LEFT JOIN application.barter_types bt ON p.barter_type_id = bt.barter_type_id
      LEFT JOIN application.categories c ON p.category_id = c.category_id
      LEFT JOIN application.subcategories sc ON p.subcategory_id = sc.subcategory_id
      LEFT JOIN application.brands b ON p.brand_id = b.brand_id
      WHERE p.is_active = true
    `;
    
    if (barterType) {
      sql += ` AND bt.slug = '${barterType}'`;
    }
    
    sql += ` ORDER BY p.created_at DESC LIMIT ${limit} OFFSET ${offset}`;

    // Execute query using Supabase's SQL execution
    const { data: rawProducts, error } = await supabaseAdmin.rpc('exec_sql_query', { query_text: sql });
    
    // If RPC doesn't exist, try direct query on public schema view or fall back
    if (error) {
      console.log("[v0] RPC not available, trying schema query:", error.message);
      
      // Try using the schema() method as fallback
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
        const { data: btData } = await supabaseAdmin
          .schema("application")
          .from("barter_types")
          .select("barter_type_id")
          .eq("slug", barterType)
          .single();
        
        if (btData) {
          query = query.eq("barter_type_id", btData.barter_type_id);
        }
      }
      
      const { data: schemaProducts, error: schemaError, count } = await query;
      
      if (schemaError) {
        console.error("[v0] Schema query also failed:", schemaError);
        throw new Error(`Failed to fetch products: ${schemaError.message}`);
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
      
      console.log("[v0] Products API: Fetched", products.length, "products via schema query");
      
      return NextResponse.json({ 
        products, 
        total: count || products.length,
        limit,
        offset,
      });
    }

    // Map raw SQL results to Product type
    const products: Product[] = (rawProducts || []).map((p: any) => ({
      productId: p.product_id,
      name: p.title,
      title: p.title,
      description: p.description || "",
      imageUrl: p.image_key ? `https://mdytcwlxlwvmioizaidu.supabase.co/storage/v1/object/public/product-images/${p.image_key}` : "/placeholder.svg",
      barterType: (p.barter_type_slug || "goods") as ProductType,
      category: p.category_name || "",
      subcategory: p.subcategory_name || "",
      brand: p.brand_name || "",
      model: p.model || "",
      offerCount: 0,
      isActive: p.is_active,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }));

    console.log("[v0] Products API: Fetched", products.length, "products");

    return NextResponse.json({ 
      products, 
      total: products.length,
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
