/**
 * ============================================================================
 * USE OFFERS HOOK
 * ============================================================================
 * SWR-based hook for fetching offers via API routes.
 * Uses server-side Supabase queries for proper auth/RLS handling.
 * ============================================================================
 */

import useSWR from "swr";
import type { Offer, OfferInfoFieldValue, LockLevel, NotificationState } from "@/lib/types";

// SWR fetcher using API route
async function offersFetcher(url: string): Promise<Offer[]> {
  console.log("[v0] offersFetcher calling:", url);
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Unknown error" }));
      console.error("[v0] Offers API error:", error);
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    
    const data = await response.json();
    console.log("[v0] Fetched offers count:", data.offers?.length || 0);
    
    return data.offers || [];
  } catch (error) {
    console.error("[v0] Error fetching offers:", error);
    throw error;
  }
}

// SWR fetcher for single offer
async function offerFetcher([, offerId]: [string, string]): Promise<Offer | null> {
  if (!offerId) return null;
  
  try {
    const response = await fetch(`/api/data/offers/${offerId}`);
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    return data.offer || null;
  } catch (error) {
    console.error("[v0] Error fetching single offer:", error);
    return null;
  }
}

// Hook for fetching all offers
export function useOffers(options?: { productId?: string; userId?: string }) {
  const params = new URLSearchParams();
  if (options?.productId) params.set("productId", options.productId);
  if (options?.userId) params.set("userId", options.userId);
  
  // Use the correct API route path
  const swrKey = `/api/data/offers?${params.toString()}`;

  const { data, error, isLoading, isValidating, mutate } = useSWR<Offer[]>(
    swrKey,
    offersFetcher,
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

// Hook for fetching offers by product
export function useOffersByProduct(productId: string | null) {
  return useOffers({ productId: productId || undefined });
}

// Hook for fetching user's offers
export function useMyOffers(userId: string | null) {
  return useOffers({ userId: userId || undefined });
}

// Hook for fetching a single offer
export function useOffer(offerId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    offerId ? ["offer", offerId] : null,
    offerFetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );

  return {
    data,
    error,
    isLoading,
    mutate,
  };
}

// Mutations - use API routes for proper auth
export async function createOfferMutation(offer: {
  productId: string;
  userId: string;
  title: string;
  description?: string;
  condition?: string;
  pickupCountryId?: string;
  pickupCityId?: string;
  pickupAddress?: string;
  offerInfo?: OfferInfoFieldValue[];
}): Promise<Offer> {
  const response = await fetch("/api/data/offers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(offer),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `Failed to create offer: HTTP ${response.status}`);
  }
  
  const data = await response.json();
  return data.offer;
}

export async function updateOfferMutation(
  offerId: string,
  updates: Partial<{
    title: string;
    description: string;
    condition: string;
    pickupCountryId: string;
    pickupCityId: string;
    pickupAddress: string;
    offerInfo: OfferInfoFieldValue[];
    readyState: boolean;
    escrowPaid: boolean;
    lockLevel: LockLevel;
    notificationState: NotificationState;
    isActive: boolean;
  }>
): Promise<Offer> {
  const response = await fetch("/api/data/offers", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ offerId, ...updates }),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `Failed to update offer: HTTP ${response.status}`);
  }
  
  const data = await response.json();
  return data.offer;
}

export async function deleteOfferMutation(offerId: string): Promise<void> {
  const response = await fetch(`/api/data/offers?offerId=${offerId}`, {
    method: "DELETE",
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `Failed to delete offer: HTTP ${response.status}`);
  }
}
