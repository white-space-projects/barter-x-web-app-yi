import { NextRequest, NextResponse } from "next/server";
import { getTicketById, updateTicket } from "@/lib/db/repositories/tickets";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const { ticketId } = await params;
    const ticket = await getTicketById(ticketId);

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    return NextResponse.json({ ticket });
  } catch (error) {
    console.error("[API] Ticket GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch ticket" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const { ticketId } = await params;
    const body = await request.json();
    const { status, priority, category, assignedTo, resolutionNotes } = body;

    const ticket = await updateTicket(ticketId, {
      status,
      priority,
      category,
      assignedTo,
      resolutionNotes,
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    return NextResponse.json({ ticket });
  } catch (error) {
    console.error("[API] Ticket PATCH error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update ticket" },
      { status: 500 }
    );
  }
}
