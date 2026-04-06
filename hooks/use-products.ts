/**
 * ============================================================================
 * USE PRODUCTS HOOK
 * ============================================================================
 * SWR-based hook for fetching products from the API route.
 * Uses server-side Supabase queries for proper auth/RLS handling.
 * ============================================================================
 */

import useSWR from "swr";
import type { Product, ProductType } from "@/lib/types";

// SWR fetcher using API route (server-side Supabase)
async function productsFetcher(url: string): Promise<Product[]> {
  console.log("[v0] productsFetcher calling:", url);
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Unknown error" }));
      console.error("[v0] API error:", error);
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    
    const data = await response.json();
    console.log("[v0] Fetched products count:", data.products?.length || 0);
    
    if (data.products?.length > 0) {
      console.log("[v0] Sample product:", data.products[0]);
    }
    
    return data.products || [];
  } catch (error) {
    console.error("[v0] Error fetching products:", error);
    throw error;
  }
}

export function useProducts(options?: { barterType?: ProductType }) {
  const barterType = options?.barterType;
  // Use the API route that fetches from Supabase server-side
  const swrKey = barterType 
    ? `/api/data/products?barterType=${barterType}` 
    : `/api/data/products`;

  const { data, error, isLoading, isValidating, mutate } = useSWR<Product[]>(
    swrKey,
    productsFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
      fallbackData: [], // Start with empty array to prevent undefined
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

// Hook for fetching a single product
export function useProduct(productId: string | null) {
  const { data: products } = useProducts();
  
  return {
    data: productId ? products.find(p => p.productId === productId) : undefined,
    isLoading: false,
  };
}
