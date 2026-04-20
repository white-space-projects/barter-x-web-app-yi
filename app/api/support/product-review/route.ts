import { NextRequest, NextResponse } from "next/server";
import { createProductReviewTicket } from "@/lib/db/repositories/tickets";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, userEmail, tempProductId, barterType, category, subcategory, brand, model } = body;

    // Validate required fields - tempProductId is required to link the ticket
    if (!tempProductId || !barterType || !brand || !model) {
      return NextResponse.json(
        { error: "Missing required fields: tempProductId, barterType, brand, model" },
        { status: 400 }
      );
    }

    const result = await createProductReviewTicket({
      userId,
      userEmail,
      tempProductId,
      barterType,
      category: category || "",
      subcategory: subcategory || "",
      brand,
      model,
    });

    return NextResponse.json({ 
      success: true, 
      ticketId: result.ticketId,
      message: "Product review ticket created successfully"
    }, { status: 201 });
  } catch (error) {
    console.error("[API] Product review ticket error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create product review ticket" },
      { status: 500 }
    );
  }
}
