import { NextRequest, NextResponse } from "next/server";
import { getTickets, getTicketStats } from "@/lib/db/repositories/tickets";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status") || undefined;
    const priority = searchParams.get("priority") || undefined;
    const category = searchParams.get("category") || undefined;
    const assignedTo = searchParams.get("assignedTo") || undefined;
    const search = searchParams.get("search") || undefined;
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const includeStats = searchParams.get("includeStats") === "true";

    const { tickets, total } = await getTickets({
      status,
      priority,
      category,
      assignedTo,
      search,
      limit,
      offset,
    });

    let stats = null;
    if (includeStats) {
      stats = await getTicketStats();
    }

    return NextResponse.json({
      tickets,
      total,
      stats,
    });
  } catch (error) {
    console.error("[API] Tickets GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch tickets" },
      { status: 500 }
    );
  }
}
