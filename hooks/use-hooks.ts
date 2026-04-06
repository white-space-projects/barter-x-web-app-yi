/**
 * ============================================================================
 * USE HOOKS HOOK
 * ============================================================================
 * SWR-based hook for fetching hooks (offer connections) via API routes.
 * Uses server-side Supabase queries for proper auth/RLS handling.
 * ============================================================================
 */

import useSWR from "swr";
import type { Hook, LockLevel } from "@/lib/types";

// SWR fetcher using API route
async function hooksFetcher(url: string): Promise<Hook[]> {
  console.log("[v0] hooksFetcher calling:", url);
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Unknown error" }));
      console.error("[v0] Hooks API error:", error);
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    
    const data = await response.json();
    console.log("[v0] Fetched hooks count:", data.hooks?.length || 0);
    
    return data.hooks || [];
  } catch (error) {
    console.error("[v0] Error fetching hooks:", error);
    throw error;
  }
}

// Hook for fetching all hooks
export function useHooks(options?: { 
  userId?: string; 
  sourceOfferId?: string; 
  targetOfferId?: string;
}) {
  const params = new URLSearchParams();
  if (options?.userId) params.set("userId", options.userId);
  if (options?.sourceOfferId) params.set("sourceOfferId", options.sourceOfferId);
  if (options?.targetOfferId) params.set("targetOfferId", options.targetOfferId);
  
  // Use the correct API route path
  const swrKey = `/api/data/hooks?${params.toString()}`;

  const { data, error, isLoading, isValidating, mutate } = useSWR<Hook[]>(
    swrKey,
    hooksFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
      fallbackData: [],
    }
  );

  return {
    data: data || [],
    error,
    isLoading,
    isValidating,
    mutate,
  };
}

// Hook for fetching user's hooks (where user owns source or target offer)
export function useMyHooks(userId: string | null) {
  return useHooks({ userId: userId || undefined });
}

// Hook for fetching hooks FROM a specific offer
export function useHooksFromOffer(offerId: string | null) {
  return useHooks({ sourceOfferId: offerId || undefined });
}

// Hook for fetching hooks TO a specific offer
export function useHooksToOffer(offerId: string | null) {
  return useHooks({ targetOfferId: offerId || undefined });
}

// Mutations - use API routes for proper auth
export async function createHookMutation(hook: {
  sourceOfferId: string;
  targetOfferId: string;
  correlationId?: string;
}): Promise<Hook> {
  const response = await fetch("/api/data/hooks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(hook),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `Failed to create hook: HTTP ${response.status}`);
  }
  
  const data = await response.json();
  return data.hook;
}

export async function updateHookMutation(
  hookId: string,
  updates: Partial<{
    status: Hook["status"];
    lockLevel: LockLevel;
    cycleId: string;
    isActive: boolean;
  }>
): Promise<Hook> {
  const response = await fetch("/api/data/hooks", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ hookId, ...updates }),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `Failed to update hook: HTTP ${response.status}`);
  }
  
  const data = await response.json();
  return data.hook;
}

export async function deleteHookMutation(hookId: string): Promise<void> {
  const response = await fetch(`/api/data/hooks?hookId=${hookId}`, {
    method: "DELETE",
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `Failed to delete hook: HTTP ${response.status}`);
  }
}
