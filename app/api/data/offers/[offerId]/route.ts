/**
 * Offers Dynamic API Route
 * =========================
 * CRUD operations for a specific offer by ID.
 */

import { NextRequest, NextResponse } from "next/server";
import { updateOffer, deleteOffer, fetchOfferById } from "@/lib/db/repositories/offers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ offerId: string }> }
) {
  try {
    const { offerId } = await params;
    
    console.log("[v0] Offers API GET by ID:", offerId);
    
    const offer = await fetchOfferById(offerId);

    if (!offer) {
      return NextResponse.json(
        { error: "Offer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ offer });
  } catch (error) {
    console.error("[API] Offer fetch error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch offer" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ offerId: string }> }
) {
  try {
    const { offerId } = await params;
    const body = await request.json();

    console.log("[v0] Offers API PUT:", offerId, body);

    const offer = await updateOffer(offerId, body);

    if (!offer) {
      return NextResponse.json(
        { error: "Offer not found" },
        { status: 404 }
      );
    }

    console.log("[v0] Offers API PUT: Updated successfully", offerId);

    return NextResponse.json({ offer });
  } catch (error) {
    console.error("[API] Offer update error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update offer" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ offerId: string }> }
) {
  try {
    const { offerId } = await params;

    console.log("[v0] Offers API DELETE:", offerId);

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
