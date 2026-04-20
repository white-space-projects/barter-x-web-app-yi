/**
 * Hooks API Route
 * ================
 * CRUD operations for hooks using direct PostgreSQL connection.
 * Bypasses PostgREST limitations to access application schema.
 * 
 * Easy for backend developer to replace with Laravel API calls.
 */

import { NextRequest, NextResponse } from "next/server";
import { fetchHooks, createHook, updateHook, deleteHook } from "@/lib/db/repositories/hooks";

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Hooks API: GET request received");
    
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const sourceOfferId = searchParams.get("sourceOfferId");
    const targetOfferId = searchParams.get("targetOfferId");
    const limit = parseInt(searchParams.get("limit") || "200", 10);

    const hooks = await fetchHooks({
      userId: userId || undefined,
      sourceOfferId: sourceOfferId || undefined,
      targetOfferId: targetOfferId || undefined,
      limit,
    });

    console.log("[v0] Hooks API: Fetched", hooks.length, "hooks");

    return NextResponse.json({ hooks });
  } catch (error) {
    console.error("[API] Hooks fetch error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch hooks", hooks: [] },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sourceOfferId, targetOfferId } = body;

    if (!sourceOfferId || !targetOfferId) {
      return NextResponse.json(
        { error: "Missing required fields: sourceOfferId, targetOfferId" },
        { status: 400 }
      );
    }

    const hook = await createHook({
      sourceOfferId,
      targetOfferId,
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
    const body = await request.json();
    const { hookId, ...updates } = body;

    if (!hookId) {
      return NextResponse.json(
        { error: "Missing required field: hookId" },
        { status: 400 }
      );
    }

    const hook = await updateHook(hookId, updates);

    if (!hook) {
      return NextResponse.json(
        { error: "Hook not found" },
        { status: 404 }
      );
    }

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
    const searchParams = request.nextUrl.searchParams;
    const hookId = searchParams.get("hookId");

    if (!hookId) {
      return NextResponse.json(
        { error: "Missing required param: hookId" },
        { status: 400 }
      );
    }

    await deleteHook(hookId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Hook delete error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete hook" },
      { status: 500 }
    );
  }
}
