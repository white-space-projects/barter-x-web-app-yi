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
    const searchParams = request.nextUrl.searchParams;
    const productId = searchParams.get("productId");
    const userId = searchParams.get("userId");
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const { offers, total } = await fetchOffers({
      productId: productId || undefined,
      userId: userId || undefined,
      limit,
      offset,
    });

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
    console.log("[v0] Offers API POST: Received body:", JSON.stringify(body, null, 2));
    
    const { 
      productId, 
      tempProductId, 
      userId, 
      title, 
      description, 
      condition, 
      exchangePreferences,
      offerInfo,
      pickupAddress,
    } = body;

    console.log("[v0] Offers API POST: Parsed fields:", { 
      productId, 
      tempProductId, 
      userId, 
      title,
      hasOfferInfo: !!offerInfo,
      hasPickupAddress: !!pickupAddress,
    });

    // Either productId or tempProductId is required, but not both required
    if (!userId || (!productId && !tempProductId)) {
      console.error("[v0] Offers API POST: Missing required fields", { userId, productId, tempProductId });
      return NextResponse.json(
        { error: "Missing required fields: userId and either productId or tempProductId" },
        { status: 400 }
      );
    }

    console.log("[v0] Offers API POST: Calling createOffer");
    
    const offer = await createOffer({
      productId: productId || null,
      tempProductId: tempProductId || null,
      userId,
      title,
      description,
      condition,
      exchangePreferences,
      offerInfo,
      pickupAddress,
    });

    console.log("[v0] Offers API POST: Offer created successfully", offer.offerId);

    return NextResponse.json({ offer }, { status: 201 });
  } catch (error) {
    console.error("[v0] Offers API POST: Error creating offer:", error);
    console.error("[v0] Offers API POST: Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
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
