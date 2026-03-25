import type { SimulateRequest, SimulateResponse } from "./simulate-types";

/**
 * Calls the /api/simulate endpoint to generate test data.
 * The backend will forward this to the Python trade engine service.
 */
export async function simulateData(
  payload: SimulateRequest
): Promise<SimulateResponse> {
  try {
    const response = await fetch("/api/simulate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        run_id: "",
        users_created: 0,
        offers_created: 0,
        hooks_created: 0,
        max_possible_hooks: 0,
        sample_user_ids: [],
        sample_offer_ids: [],
        sample_hook_pairs: [],
        note: "",
        status: "error",
        error: `HTTP ${response.status}: ${errorText || "Request failed"}`,
      };
    }

    const data = await response.json();
    return {
      ...data,
      status: data.status || "success",
    };
  } catch (err) {
    return {
      run_id: "",
      users_created: 0,
      offers_created: 0,
      hooks_created: 0,
      max_possible_hooks: 0,
      sample_user_ids: [],
      sample_offer_ids: [],
      sample_hook_pairs: [],
      note: "",
      status: "error",
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}
