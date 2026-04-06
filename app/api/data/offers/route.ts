/**
 * Offers API Route
 * =================
 * CRUD operations for offers directly via Supabase database.
 * Uses service role key to access the application schema.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Offer } from "@/lib/types";

// Create admin client with service role key for full schema access
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Offers API: GET request received");
    
    const searchParams = request.nextUrl.searchParams;
    const productId = searchParams.get("productId");
    const userId = searchParams.get("userId");
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    console.log("[v0] Offers API: Fetching with params:", { productId, userId, limit, offset });

    // Query offers from application schema
    let query = supabaseAdmin
      .schema("application")
      .from("offers")
      .select(`
        *,
        product:products(product_id, title, image_key),
        user:users(user_id, name, city, country)
      `, { count: "exact" })
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(limit);
    
    if (offset > 0) {
      query = query.range(offset, offset + limit - 1);
    }
    
    if (productId) {
      query = query.eq("product_id", productId);
    }
    
    if (userId) {
      query = query.eq("created_by_user_id", userId);
    }

    const { data: rawOffers, error, count } = await query;
    
    if (error) {
      console.error("[v0] Offers query error:", error);
      throw new Error(`Failed to fetch offers: ${error.message}`);
    }

    // Map to Offer type
    const offers: Offer[] = (rawOffers || []).map((o: any) => ({
      offerId: o.offer_id,
      productId: o.product_id,
      userId: o.created_by_user_id,
      title: o.title || o.product?.title || "",
      description: o.description || "",
      condition: o.condition || "good",
      pickupCountryId: o.pickup_country_id,
      pickupCityId: o.pickup_city_id,
      pickupAddress: o.pickup_address,
      offerInfo: o.offer_info || [],
      readyState: o.ready_state || false,
      escrowPaid: o.escrow_paid || false,
      lockLevel: o.lock_level || "none",
      hookedCount: o.hooked_count || 0,
      outgoingHookCount: o.outgoing_hook_count || 0,
      notificationState: o.notification_state || "none",
      isActive: o.is_active,
      createdAt: o.created_at,
      updatedAt: o.updated_at,
      productName: o.product?.title || "",
      productImage: o.product?.image_key 
        ? `https://mdytcwlxlwvmioizaidu.supabase.co/storage/v1/object/public/product-images/${o.product.image_key}` 
        : "/placeholder.svg",
      userName: o.user?.name || "",
      userCity: o.user?.city || "",
      userCountry: o.user?.country || "",
    }));

    console.log("[v0] Offers API: Fetched", offers.length, "offers, total:", count);

    return NextResponse.json({ 
      offers, 
      total: count || offers.length,
      limit,
      offset,
    });
  } catch (error) {
    console.error("[API] Offers fetch error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch offers" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, userId, title, description, condition, pickupCountryId, pickupCityId, pickupAddress, offerInfo } = body;

    if (!productId || !userId || !title) {
      return NextResponse.json(
        { error: "Missing required fields: productId, userId, title" },
        { status: 400 }
      );
    }

    // Insert offer into application schema
    const { data: offer, error } = await supabaseAdmin
      .schema("application")
      .from("offers")
      .insert({
        product_id: productId,
        created_by_user_id: userId,
        title,
        description,
        condition: condition || "good",
        pickup_country_id: pickupCountryId,
        pickup_city_id: pickupCityId,
        pickup_address: pickupAddress,
        offer_info: offerInfo || [],
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error("[v0] Offer create error:", error);
      throw new Error(`Failed to create offer: ${error.message}`);
    }

    return NextResponse.json({ offer }, { status: 201 });
  } catch (error) {
    console.error("[API] Offer create error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create offer" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { offerId, ...updates } = body;

    if (!offerId) {
      return NextResponse.json(
        { error: "Missing required field: offerId" },
        { status: 400 }
      );
    }

    // Map frontend field names to database column names
    const dbUpdates: Record<string, any> = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.condition !== undefined) dbUpdates.condition = updates.condition;
    if (updates.pickupCountryId !== undefined) dbUpdates.pickup_country_id = updates.pickupCountryId;
    if (updates.pickupCityId !== undefined) dbUpdates.pickup_city_id = updates.pickupCityId;
    if (updates.pickupAddress !== undefined) dbUpdates.pickup_address = updates.pickupAddress;
    if (updates.offerInfo !== undefined) dbUpdates.offer_info = updates.offerInfo;
    if (updates.readyState !== undefined) dbUpdates.ready_state = updates.readyState;
    if (updates.escrowPaid !== undefined) dbUpdates.escrow_paid = updates.escrowPaid;
    if (updates.lockLevel !== undefined) dbUpdates.lock_level = updates.lockLevel;
    if (updates.notificationState !== undefined) dbUpdates.notification_state = updates.notificationState;
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
    dbUpdates.updated_at = new Date().toISOString();

    const { data: offer, error } = await supabaseAdmin
      .schema("application")
      .from("offers")
      .update(dbUpdates)
      .eq("offer_id", offerId)
      .select()
      .single();

    if (error) {
      console.error("[v0] Offer update error:", error);
      throw new Error(`Failed to update offer: ${error.message}`);
    }

    return NextResponse.json({ offer });
  } catch (error) {
    console.error("[API] Offer update error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update offer" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const offerId = searchParams.get("offerId");

    if (!offerId) {
      return NextResponse.json(
        { error: "Missing required param: offerId" },
        { status: 400 }
      );
    }

    // Soft delete - set is_active to false
    const { error } = await supabaseAdmin
      .schema("application")
      .from("offers")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("offer_id", offerId);

    if (error) {
      console.error("[v0] Offer delete error:", error);
      throw new Error(`Failed to delete offer: ${error.message}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Offer delete error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete offer" },
      { status: 500 }
    );
  }
}
