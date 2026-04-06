/**
 * Offers API Route
 * =================
 * CRUD operations for offers directly via Supabase database.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchOffers, createOffer, updateOffer, deleteOffer } from "@/lib/supabase/data-services";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const searchParams = request.nextUrl.searchParams;
    const productId = searchParams.get("productId");
    const userId = searchParams.get("userId");
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const { offers, total } = await fetchOffers(supabase, {
      productId: productId || undefined,
      userId: userId || undefined,
      status: "active",
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
      { error: "Failed to fetch offers" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { productId, title, description, condition, pickupCountryId, pickupCityId, pickupAddress, offerInfo } = body;

    if (!productId || !title) {
      return NextResponse.json(
        { error: "Missing required fields: productId, title" },
        { status: 400 }
      );
    }

    const offer = await createOffer(supabase, {
      productId,
      userId: user.id,
      title,
      description,
      condition,
      pickupCountryId,
      pickupCityId,
      pickupAddress,
      offerInfo,
    });

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
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { offerId, ...updates } = body;

    if (!offerId) {
      return NextResponse.json(
        { error: "Missing required field: offerId" },
        { status: 400 }
      );
    }

    const offer = await updateOffer(supabase, offerId, updates);

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
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const offerId = searchParams.get("offerId");

    if (!offerId) {
      return NextResponse.json(
        { error: "Missing required param: offerId" },
        { status: 400 }
      );
    }

    await deleteOffer(supabase, offerId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Offer delete error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete offer" },
      { status: 500 }
    );
  }
}
