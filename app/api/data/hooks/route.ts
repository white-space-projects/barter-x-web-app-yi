/**
 * Hooks API Route
 * ================
 * CRUD operations for hooks (offer connections) directly via Supabase database.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchHooks, createHook, updateHook, deleteHook } from "@/lib/supabase/data-services";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const sourceOfferId = searchParams.get("sourceOfferId");
    const targetOfferId = searchParams.get("targetOfferId");
    const limit = parseInt(searchParams.get("limit") || "200", 10);

    const hooks = await fetchHooks(supabase, {
      userId: userId || undefined,
      sourceOfferId: sourceOfferId || undefined,
      targetOfferId: targetOfferId || undefined,
      limit,
    });

    return NextResponse.json({ hooks });
  } catch (error) {
    console.error("[API] Hooks fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch hooks" },
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
    const { sourceOfferId, targetOfferId, correlationId } = body;

    if (!sourceOfferId || !targetOfferId) {
      return NextResponse.json(
        { error: "Missing required fields: sourceOfferId, targetOfferId" },
        { status: 400 }
      );
    }

    const hook = await createHook(supabase, {
      sourceOfferId,
      targetOfferId,
      correlationId,
    });

    return NextResponse.json({ hook }, { status: 201 });
  } catch (error) {
    console.error("[API] Hook create error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create hook" },
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
    const { hookId, ...updates } = body;

    if (!hookId) {
      return NextResponse.json(
        { error: "Missing required field: hookId" },
        { status: 400 }
      );
    }

    const hook = await updateHook(supabase, hookId, updates);

    return NextResponse.json({ hook });
  } catch (error) {
    console.error("[API] Hook update error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update hook" },
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
    const hookId = searchParams.get("hookId");

    if (!hookId) {
      return NextResponse.json(
        { error: "Missing required param: hookId" },
        { status: 400 }
      );
    }

    await deleteHook(supabase, hookId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Hook delete error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete hook" },
      { status: 500 }
    );
  }
}
