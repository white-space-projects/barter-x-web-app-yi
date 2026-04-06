/**
 * ============================================================================
 * USE PRODUCTS HOOK
 * ============================================================================
 * SWR-based hook for fetching products from Supabase.
 * Provides real-time data with caching, revalidation, and optimistic updates.
 * ============================================================================
 */

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { fetchProducts } from "@/lib/supabase/data-services";
import type { Product, ProductType } from "@/lib/types";

// SWR fetcher for products
async function productsFetcher(key: string): Promise<Product[]> {
  const supabase = createClient();
  
  // Parse options from key
  const url = new URL(key, "http://localhost");
  const barterTypeSlug = url.searchParams.get("barterType") as ProductType | null;
  
  const { products } = await fetchProducts(supabase, {
    barterTypeSlug: barterTypeSlug || undefined,
    limit: 100,
  });
  
  return products;
}

export function useProducts(options?: { barterType?: ProductType }) {
  const barterType = options?.barterType || "goods";
  const swrKey = `/api/products?barterType=${barterType}`;

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
