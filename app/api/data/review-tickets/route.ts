/**
 * Product Review Tickets API Route
 * =================================
 * Admin workflow for reviewing custom product submissions.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  createReviewTicket,
  getPendingReviewTickets,
  getReviewTicket,
  resolveReviewTicket,
} from "@/lib/db/repositories/review-tickets";
import { updateTempProductStatus } from "@/lib/db/repositories/temp-products";
import { query } from "@/lib/db/postgres";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const ticketId = searchParams.get("ticketId");

    if (ticketId) {
      const ticket = await getReviewTicket(ticketId);
      if (!ticket) {
        return NextResponse.json(
          { error: "Review ticket not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ ticket });
    }

    // Default: get all pending tickets
    const tickets = await getPendingReviewTickets();
    return NextResponse.json({ tickets });
  } catch (error) {
    console.error("[API] Review tickets fetch error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch review tickets" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tempProductId, createdByUserId, duplicateSuggestionsJson } = body;

    if (!tempProductId || !createdByUserId) {
      return NextResponse.json(
        { error: "Missing required fields: tempProductId, createdByUserId" },
        { status: 400 }
      );
    }

    const ticket = await createReviewTicket({
      tempProductId,
      createdByUserId,
      duplicateSuggestionsJson,
    });

    return NextResponse.json({ ticket }, { status: 201 });
  } catch (error) {
    console.error("[API] Review ticket create error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create review ticket" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      ticketId,
      status,
      reviewerNotes,
      selectedBrandId,
      selectedProductId,
      actionTaken,
    } = body;

    if (!ticketId || !status) {
      return NextResponse.json(
        { error: "Missing required fields: ticketId, status" },
        { status: 400 }
      );
    }

    if (!["approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "Status must be 'approved' or 'rejected'" },
        { status: 400 }
      );
    }

    // Resolve the ticket
    const ticket = await resolveReviewTicket({
      ticketId,
      status,
      reviewerNotes,
      selectedBrandId,
      selectedProductId,
      actionTaken,
    });

    if (!ticket) {
      return NextResponse.json(
        { error: "Review ticket not found" },
        { status: 404 }
      );
    }

    // Also update the temp product status
    await updateTempProductStatus(
      ticket.tempProductId,
      status,
      selectedProductId
    );

    // If approved with a selected product, update any offers linked to this temp product
    if (status === "approved" && selectedProductId) {
      await query(
        `UPDATE application.offers 
         SET product_id = $1, temp_product_id = NULL
         WHERE temp_product_id = (
           SELECT temp_product_id FROM application.product_review_tickets WHERE ticket_id = $2
         )`,
        [selectedProductId, ticketId]
      );
    }

    return NextResponse.json({ ticket });
  } catch (error) {
    console.error("[API] Review ticket update error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update review ticket" },
      { status: 500 }
    );
  }
}
