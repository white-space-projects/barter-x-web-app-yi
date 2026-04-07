/**
 * Offers API Route
 * =================
 * CRUD operations for offers using direct PostgreSQL connection.
 * Bypasses PostgREST limitations to access application schema.
 * 
 * Easy for backend developer to replace with Laravel API calls.
 */

import { NextRequest, NextResponse } from "next/server";
import { fetchOffers, createOffer, updateOffer, deleteOffer } from "@/lib/db/repositories/offers";

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Offers API: GET request received");
    
    const searchParams = request.nextUrl.searchParams;
    const productId = searchParams.get("productId");
    const userId = searchParams.get("userId");
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    console.log("[v0] Offers API: Fetching with params:", { productId, userId, limit, offset });

    const { offers, total } = await fetchOffers({
      productId: productId || undefined,
      userId: userId || undefined,
      limit,
      offset,
    });

    console.log("[v0] Offers API: Fetched", offers.length, "offers, total:", total);

    return NextResponse.json({ 
      offers, 
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("[API] Offers fetch error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch offers", offers: [], total: 0 },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      productId, 
      tempProductId, 
      userId, 
      title, 
      description, 
      condition, 
      exchangePreferences,
      offerInfo,      // Dynamic offer info fields as JSONB object { field_key: value }
      pickupAddress,  // Full address object as JSONB
    } = body;

    console.log("[v0] Offers API POST: Creating offer", { 
      productId, 
      tempProductId, 
      userId, 
      title,
      hasOfferInfo: !!offerInfo && Object.keys(offerInfo).length > 0,
      hasPickupAddress: !!pickupAddress,
    });

    // Either productId or tempProductId is required, but not both required
    if (!userId || (!productId && !tempProductId)) {
      return NextResponse.json(
        { error: "Missing required fields: userId and either productId or tempProductId" },
        { status: 400 }
      );
    }

    const offer = await createOffer({
      productId: productId || null,
      tempProductId: tempProductId || null,
      userId,
      title,
      description,
      condition,
      exchangePreferences,
      offerInfo,       // Pass offer_info JSONB to repository
      pickupAddress,   // Pass pickup_address JSONB to repository
    });

    console.log("[v0] Offers API POST: Offer created successfully", offer.offerId);

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

    const offer = await updateOffer(offerId, updates);

    if (!offer) {
      return NextResponse.json(
        { error: "Offer not found" },
        { status: 404 }
      );
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

    await deleteOffer(offerId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Offer delete error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete offer" },
      { status: 500 }
    );
  }
}
