/**
 * ============================================================================
 * USE OFFERS HOOK
 * ============================================================================
 * SWR-based hook for fetching offers from Supabase.
 * Provides real-time data with caching, revalidation, and optimistic updates.
 * ============================================================================
 */

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { fetchOffers, fetchOfferById, createOffer, updateOffer, deleteOffer } from "@/lib/supabase/data-services";
import type { Offer, OfferInfoFieldValue, LockLevel, NotificationState } from "@/lib/types";

// SWR fetcher for all offers
async function offersFetcher(key: string): Promise<Offer[]> {
  const supabase = createClient();
  
  const url = new URL(key, "http://localhost");
  const productId = url.searchParams.get("productId");
  const userId = url.searchParams.get("userId");
  
  const { offers } = await fetchOffers(supabase, {
    productId: productId || undefined,
    userId: userId || undefined,
    status: "active",
    limit: 100,
  });
  
  return offers;
}

// SWR fetcher for single offer
async function offerFetcher([, offerId]: [string, string]): Promise<Offer | null> {
  if (!offerId) return null;
  const supabase = createClient();
  return fetchOfferById(supabase, offerId);
}

// Hook for fetching all offers
export function useOffers(options?: { productId?: string; userId?: string }) {
  const params = new URLSearchParams();
  if (options?.productId) params.set("productId", options.productId);
  if (options?.userId) params.set("userId", options.userId);
  
  const swrKey = `/api/offers?${params.toString()}`;

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

// Mutations
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
  const supabase = createClient();
  return createOffer(supabase, offer);
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
  const supabase = createClient();
  return updateOffer(supabase, offerId, updates);
}

export async function deleteOfferMutation(offerId: string): Promise<void> {
  const supabase = createClient();
  return deleteOffer(supabase, offerId);
}
