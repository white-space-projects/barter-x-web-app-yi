/**
 * Dashboard Stats API Route
 * ==========================
 * Fetches dashboard statistics directly from Supabase database.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchDashboardStats } from "@/lib/supabase/data-services";

export async function GET() {
  try {
    const supabase = await createClient();
    const stats = await fetchDashboardStats(supabase);

    return NextResponse.json({ stats });
  } catch (error) {
    console.error("[API] Stats fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
