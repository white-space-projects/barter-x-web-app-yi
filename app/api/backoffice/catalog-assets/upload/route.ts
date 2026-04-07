/**
 * Catalog Assets Upload API
 * =========================
 * Uploads images to Supabase storage for catalog assets
 * Supports: product images, category icons, subcategory icons, brand logos
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Create admin client for storage operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Storage bucket for catalog assets
const BUCKET_NAME = "product-images";

// Supported asset types and their path prefixes
const ASSET_PATHS: Record<string, string> = {
  product: "products",
  category: "categories",
  subcategory: "subcategories",
  brand: "brands",
};

/**
 * POST /api/backoffice/catalog-assets/upload
 * Upload an image to Supabase storage
 * 
 * FormData:
 * - file: File (required)
 * - assetType: "product" | "category" | "subcategory" | "brand" (required)
 * - entityId: string (required) - the ID of the entity being updated
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const assetType = formData.get("assetType") as string | null;
    const entityId = formData.get("entityId") as string | null;
    
    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }
    
    if (!assetType || !ASSET_PATHS[assetType]) {
      return NextResponse.json(
        { error: "Valid assetType is required (product, category, subcategory, brand)" },
        { status: 400 }
      );
    }
    
    if (!entityId) {
      return NextResponse.json({ error: "entityId is required" }, { status: 400 });
    }
    
    // Generate unique file key
    const ext = file.name.split(".").pop() || "jpg";
    const timestamp = Date.now();
    const fileKey = `${ASSET_PATHS[assetType]}/${entityId}/${timestamp}.${ext}`;
    
    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Upload to Supabase storage
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(fileKey, buffer, {
        contentType: file.type,
        upsert: true,
      });
    
    if (error) {
      console.error("[API] Upload error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileKey);
    
    return NextResponse.json({
      success: true,
      fileKey,
      publicUrl,
    });
  } catch (error) {
    console.error("[API] Catalog assets upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upload file" },
      { status: 500 }
    );
  }
}
