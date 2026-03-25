import { NextResponse } from "next/server";
import type { SimulateRequest, SimulateResponse } from "@/lib/simulate-types";
import { generateGuid } from "@/lib/guid";

// Mock implementation - replace with actual Python service call
export async function POST(request: Request) {
  try {
    const body: SimulateRequest = await request.json();

    // Validate inputs
    if (
      typeof body.users !== "number" ||
      typeof body.offers !== "number" ||
      typeof body.hooks !== "number" ||
      typeof body.max_out !== "number" ||
      typeof body.seed !== "number"
    ) {
      return NextResponse.json(
        {
          status: "error",
          error: "Invalid input: all fields must be numbers",
        },
        { status: 400 }
      );
    }

    // Calculate max possible hooks
    const maxPossibleHooks = body.offers * body.max_out;

    // Mock response - in production, forward to Python trade engine
    // Example: const pythonResponse = await fetch(process.env.TRADE_ENGINE_URL + "/simulate", { ... })

    // Simulate processing delay
    await new Promise((r) => setTimeout(r, 1500));

    // If dry_run, don't "create" anything, just return what would be created
    const isDryRun = body.dry_run === true;

    // Generate proper UUID for run_id
    const runId = generateGuid();

    // Generate sample UUIDs for users
    const sampleUserIds = Array.from({ length: Math.min(5, body.users) }, () =>
      generateGuid()
    );

    // Generate sample UUIDs for offers
    const sampleOfferIds = Array.from({ length: Math.min(5, body.offers) }, () =>
      generateGuid()
    );

    // Generate sample hook pairs using the generated offer UUIDs
    const sampleHookPairs: [string, string][] = Array.from(
      { length: Math.min(5, body.hooks) },
      (_, i) => [
        sampleOfferIds[i % sampleOfferIds.length] || generateGuid(),
        sampleOfferIds[(i + 1) % sampleOfferIds.length] || generateGuid(),
      ]
    );

    const response: SimulateResponse = {
      run_id: runId,
      users_created: isDryRun ? 0 : body.users,
      offers_created: isDryRun ? 0 : body.offers,
      hooks_created: isDryRun ? 0 : Math.min(body.hooks, maxPossibleHooks),
      max_possible_hooks: maxPossibleHooks,
      sample_user_ids: sampleUserIds,
      sample_offer_ids: sampleOfferIds,
      sample_hook_pairs: sampleHookPairs,
      note: isDryRun
        ? `Dry run complete. Would create ${body.users} users, ${body.offers} offers, and up to ${Math.min(body.hooks, maxPossibleHooks)} hooks.`
        : `Simulation complete. Created ${body.users} users, ${body.offers} offers, and ${Math.min(body.hooks, maxPossibleHooks)} hooks.`,
      status: "success",
    };

    return NextResponse.json(response);
  } catch (err) {
    return NextResponse.json(
      {
        status: "error",
        error: err instanceof Error ? err.message : "Server error",
      },
      { status: 500 }
    );
  }
}
