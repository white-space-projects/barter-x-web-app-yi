/**
 * Debug API Route - Check products directly from Supabase
 * This bypasses client-side issues to verify database connectivity
 */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Check if env vars are set
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Use service role key to bypass RLS for debugging
const supabaseAdmin = SUPABASE_URL && SUPABASE_SERVICE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null;

export async function GET() {
  try {
    console.log("[v0] Debug: Checking products in Supabase...");
    
    // Check env vars
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !supabaseAdmin) {
      return NextResponse.json({
        status: "error",
        error: "Supabase not configured",
        envCheck: {
          hasUrl: !!SUPABASE_URL,
          hasServiceKey: !!SUPABASE_SERVICE_KEY,
        }
      }, { status: 500 });
    }
    
    // 1. Check barter_types
    const { data: barterTypes, error: btError } = await supabaseAdmin
      .schema("application")
      .from("barter_types")
      .select("*");
    
    console.log("[v0] Barter types:", barterTypes?.length, "error:", btError);
    
    // 2. Check products count
    const { count: productCount, error: countError } = await supabaseAdmin
      .schema("application")
      .from("products")
      .select("*", { count: "exact", head: true });
    
    console.log("[v0] Product count:", productCount, "error:", countError);
    
    // 3. Get sample products
    const { data: products, error: productsError } = await supabaseAdmin
      .schema("application")
      .from("products")
      .select(`
        product_id,
        title,
        is_active,
        barter_type_id,
        category_id,
        subcategory_id,
        brand_id
      `)
      .limit(10);
    
    console.log("[v0] Products sample:", products?.length, "error:", productsError);
    
    // 4. Check offers count
    const { count: offerCount, error: offerError } = await supabaseAdmin
      .schema("application")
      .from("offers")
      .select("*", { count: "exact", head: true });
    
    console.log("[v0] Offer count:", offerCount, "error:", offerError);
    
    // 5. Check users count
    const { count: userCount, error: userError } = await supabaseAdmin
      .schema("application")
      .from("users")
      .select("*", { count: "exact", head: true });
    
    console.log("[v0] User count:", userCount, "error:", userError);

    return NextResponse.json({
      status: "ok",
      barterTypes: {
        count: barterTypes?.length || 0,
        data: barterTypes,
        error: btError?.message || null,
      },
      products: {
        count: productCount || 0,
        sample: products,
        error: productsError?.message || null,
      },
      offers: {
        count: offerCount || 0,
        error: offerError?.message || null,
      },
      users: {
        count: userCount || 0,
        error: userError?.message || null,
      },
    });
  } catch (error) {
    console.error("[v0] Debug API error:", error);
    return NextResponse.json({ 
      status: "error", 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}
