import { NextRequest, NextResponse } from "next/server";
import { createSupportTicket } from "@/lib/db/repositories/tickets";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, email, phone, message } = body;

    if (!email || !message) {
      return NextResponse.json(
        { error: "Email and message are required" },
        { status: 400 }
      );
    }

    // Create ticket in database
    const result = await createSupportTicket({
      userId,
      email,
      phone,
      message,
    });

    return NextResponse.json({
      ticketId: result.ticketId,
      status: "created",
    });
  } catch (error) {
    console.error("[API] Create support ticket error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create ticket" },
      { status: 500 }
    );
  }
}
