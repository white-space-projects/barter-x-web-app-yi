/**
 * Hooks API Route
 * ================
 * CRUD operations for hooks (offer connections) directly via Supabase database.
 * Uses service role key to access the application schema.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Hook } from "@/lib/types";

// Create admin client with service role key for full schema access
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Hooks API: GET request received");
    
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const sourceOfferId = searchParams.get("sourceOfferId");
    const targetOfferId = searchParams.get("targetOfferId");
    const limit = parseInt(searchParams.get("limit") || "200", 10);

    // Query hooks from application schema
    let query = supabaseAdmin
      .schema("application")
      .from("hooks")
      .select(`
        *,
        from_offer:offers!hooks_from_offer_id_fkey(offer_id, title, product_id),
        to_offer:offers!hooks_to_offer_id_fkey(offer_id, title, product_id)
      `)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(limit);
    
    if (userId) {
      query = query.eq("created_by_user_id", userId);
    }
    if (sourceOfferId) {
      query = query.eq("from_offer_id", sourceOfferId);
    }
    if (targetOfferId) {
      query = query.eq("to_offer_id", targetOfferId);
    }

    const { data: rawHooks, error } = await query;
    
    if (error) {
      console.error("[v0] Hooks query error:", error);
      throw new Error(`Failed to fetch hooks: ${error.message}`);
    }

    // Map to Hook type
    const hooks: Hook[] = (rawHooks || []).map((h: any) => ({
      hookId: h.hook_id,
      fromOfferId: h.from_offer_id,
      toOfferId: h.to_offer_id,
      correlationId: h.correlation_id,
      status: h.status || "pending",
      lockLevel: h.lock_level || "none",
      cycleId: h.cycle_id,
      isActive: h.is_active,
      createdAt: h.created_at,
      updatedAt: h.updated_at,
      fromOfferTitle: h.from_offer?.title || "",
      toOfferTitle: h.to_offer?.title || "",
    }));

    console.log("[v0] Hooks API: Fetched", hooks.length, "hooks");

    return NextResponse.json({ hooks });
  } catch (error) {
    console.error("[API] Hooks fetch error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch hooks" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sourceOfferId, targetOfferId, correlationId, userId } = body;

    if (!sourceOfferId || !targetOfferId) {
      return NextResponse.json(
        { error: "Missing required fields: sourceOfferId, targetOfferId" },
        { status: 400 }
      );
    }

    // Insert hook into application schema
    const { data: hook, error } = await supabaseAdmin
      .schema("application")
      .from("hooks")
      .insert({
        from_offer_id: sourceOfferId,
        to_offer_id: targetOfferId,
        correlation_id: correlationId || null,
        created_by_user_id: userId || null,
        status: "pending",
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error("[v0] Hook create error:", error);
      throw new Error(`Failed to create hook: ${error.message}`);
    }

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

    // Map frontend field names to database column names
    const dbUpdates: Record<string, any> = {};
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.lockLevel !== undefined) dbUpdates.lock_level = updates.lockLevel;
    if (updates.cycleId !== undefined) dbUpdates.cycle_id = updates.cycleId;
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
    dbUpdates.updated_at = new Date().toISOString();

    const { data: hook, error } = await supabaseAdmin
      .schema("application")
      .from("hooks")
      .update(dbUpdates)
      .eq("hook_id", hookId)
      .select()
      .single();

    if (error) {
      console.error("[v0] Hook update error:", error);
      throw new Error(`Failed to update hook: ${error.message}`);
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

    // Soft delete - set is_active to false
    const { error } = await supabaseAdmin
      .schema("application")
      .from("hooks")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("hook_id", hookId);

    if (error) {
      console.error("[v0] Hook delete error:", error);
      throw new Error(`Failed to delete hook: ${error.message}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Hook delete error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete hook" },
      { status: 500 }
    );
  }
}
