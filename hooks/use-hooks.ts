/**
 * ============================================================================
 * USE HOOKS HOOK
 * ============================================================================
 * SWR-based hook for fetching hooks (offer connections) from Supabase.
 * Provides real-time data with caching, revalidation, and optimistic updates.
 * ============================================================================
 */

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { fetchHooks, createHook, updateHook, deleteHook } from "@/lib/supabase/data-services";
import type { Hook, LockLevel } from "@/lib/types";

// SWR fetcher for hooks
async function hooksFetcher(key: string): Promise<Hook[]> {
  const supabase = createClient();
  
  const url = new URL(key, "http://localhost");
  const userId = url.searchParams.get("userId");
  const sourceOfferId = url.searchParams.get("sourceOfferId");
  const targetOfferId = url.searchParams.get("targetOfferId");
  
  return fetchHooks(supabase, {
    userId: userId || undefined,
    sourceOfferId: sourceOfferId || undefined,
    targetOfferId: targetOfferId || undefined,
    limit: 200,
  });
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
  
  const swrKey = `/api/hooks?${params.toString()}`;

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

// Mutations
export async function createHookMutation(hook: {
  sourceOfferId: string;
  targetOfferId: string;
  correlationId?: string;
}): Promise<Hook> {
  const supabase = createClient();
  return createHook(supabase, hook);
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
  const supabase = createClient();
  return updateHook(supabase, hookId, updates);
}

export async function deleteHookMutation(hookId: string): Promise<void> {
  const supabase = createClient();
  return deleteHook(supabase, hookId);
}
