import { NextRequest, NextResponse } from "next/server";
import { createLoginIssueTicket } from "@/lib/db/repositories/tickets";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, errorType, errorMessage, userMessage, timestamp, deviceInfo } = body;

    if (!email || !userMessage) {
      return NextResponse.json(
        { error: "Email and description are required" },
        { status: 400 }
      );
    }

    // Create ticket in database
    const result = await createLoginIssueTicket({
      email,
      description: userMessage,
      metadata: {
        errorType,
        errorMessage,
        source: "login_otp",
        context: "otp_failure",
        userAgent: deviceInfo?.userAgent,
        platform: deviceInfo?.platform,
      },
    });

    return NextResponse.json({
      ticketId: result.ticketId,
      status: "created",
    });
  } catch (error) {
    console.error("[API] Create login issue ticket error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create ticket" },
      { status: 500 }
    );
  }
}
