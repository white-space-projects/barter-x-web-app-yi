/**
 * ============================================================================
 * DATA PROVIDER - SWR-powered data layer
 * ============================================================================
 * 
 * This provider wraps the SWR hooks to provide centralized data fetching
 * with automatic caching, revalidation, and real-time updates from Supabase.
 * 
 * Components can use:
 * - useBarterData() for read access to products, offers, hooks
 * - useBarterActions() for mutations (create, update, delete)
 * - useBarterStore() for local state (auth, filters, conversations)
 * 
 * ============================================================================
 */

"use client";

import React, { createContext, useContext, useMemo, useCallback, type ReactNode } from "react";
import { SWRConfig } from "swr";
import { useProducts } from "@/hooks/use-products";
import { 
  useOffers, 
  createOfferMutation, 
  updateOfferMutation, 
  deleteOfferMutation 
} from "@/hooks/use-offers";
import { 
  useHooks, 
  createHookMutation, 
  updateHookMutation, 
  deleteHookMutation 
} from "@/hooks/use-hooks";
import { createClient } from "@/lib/supabase/client";
import { createProduct as createProductService, fetchDashboardStats } from "@/lib/supabase/data-services";
import type { 
  Product, 
  Offer, 
  Hook, 
  ProductType,
  DashboardStats,
  OfferInfoFieldValue,
  LockLevel,
  NotificationState,
} from "@/lib/types";

// ============================================================================
// CONTEXT TYPES
// ============================================================================

interface DataContextValue {
  // Products
  products: Product[];
  productsLoading: boolean;
  productsError: Error | undefined;
  refreshProducts: () => Promise<Product[] | undefined>;
  getProductById: (productId: string) => Product | undefined;

  // Offers
  offers: Offer[];
  offersLoading: boolean;
  offersError: Error | undefined;
  refreshOffers: () => Promise<Offer[] | undefined>;
  getOfferById: (offerId: string) => Offer | undefined;
  getOffersByProduct: (productId: string) => Offer[];

  // Hooks
  hooks: Hook[];
  hooksLoading: boolean;
  hooksError: Error | undefined;
  refreshHooks: () => Promise<Hook[] | undefined>;
  getHooksByFromOffer: (offerId: string) => Hook[];
  getHooksToOffer: (offerId: string) => Hook[];

  // Dashboard stats
  dashboardStats: DashboardStats;
  refreshDashboardStats: () => Promise<void>;
}

interface ActionsContextValue {
  // Product actions
  createProduct: (product: {
    barterTypeSlug: ProductType;
    categoryName: string;
    subcategoryName: string;
    brandName?: string;
    model?: string;
    title: string;
    description?: string;
    imageKey?: string;
  }) => Promise<Product>;

  // Offer actions
  createOffer: (offer: {
    productId: string;
    userId: string;
    title: string;
    description?: string;
    condition?: string;
    pickupCountryId?: string;
    pickupCityId?: string;
    pickupAddress?: string;
    offerInfo?: OfferInfoFieldValue[];
  }) => Promise<Offer>;
  updateOffer: (offerId: string, updates: Partial<{
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
  }>) => Promise<Offer>;
  deleteOffer: (offerId: string) => Promise<void>;

  // Hook actions
  createHook: (hook: {
    sourceOfferId: string;
    targetOfferId: string;
    correlationId?: string;
  }) => Promise<Hook>;
  updateHook: (hookId: string, updates: Partial<{
    status: Hook["status"];
    lockLevel: LockLevel;
    cycleId: string;
    isActive: boolean;
  }>) => Promise<Hook>;
  deleteHook: (hookId: string) => Promise<void>;
}

// ============================================================================
// CONTEXTS
// ============================================================================

const DataContext = createContext<DataContextValue | null>(null);
const ActionsContext = createContext<ActionsContextValue | null>(null);

// ============================================================================
// DEFAULT STATS
// ============================================================================

const DEFAULT_STATS: DashboardStats = {
  totalUsers: 0,
  activeOffers: 0,
  activeHooks: 0,
  reservedCycles: 0,
  committedOffers: 0,
  totalProducts: 0,
};

// ============================================================================
// INNER PROVIDER (uses SWR hooks)
// ============================================================================

function DataProviderInner({ children }: { children: ReactNode }) {
  // SWR hooks for data fetching
  const { 
    data: products, 
    error: productsError, 
    isLoading: productsLoading, 
    mutate: refreshProducts 
  } = useProducts();

  const { 
    data: offers, 
    error: offersError, 
    isLoading: offersLoading, 
    mutate: refreshOffers 
  } = useOffers();

  const { 
    data: hooks, 
    error: hooksError, 
    isLoading: hooksLoading, 
    mutate: refreshHooks 
  } = useHooks();

  // Dashboard stats (fetched separately, not via SWR for simplicity)
  const [dashboardStats, setDashboardStats] = React.useState<DashboardStats>(DEFAULT_STATS);

  const refreshDashboardStats = useCallback(async () => {
    try {
      const supabase = createClient();
      const stats = await fetchDashboardStats(supabase);
      setDashboardStats(stats);
    } catch (err) {
      console.error("[v0] Error fetching dashboard stats:", err);
    }
  }, []);

  // Fetch stats on mount
  React.useEffect(() => {
    refreshDashboardStats();
  }, [refreshDashboardStats]);

  // Memoized getters
  const getProductById = useCallback(
    (productId: string) => products.find(p => p.productId === productId),
    [products]
  );

  const getOfferById = useCallback(
    (offerId: string) => offers.find(o => o.offerId === offerId),
    [offers]
  );

  const getOffersByProduct = useCallback(
    (productId: string) => offers.filter(o => o.productId === productId),
    [offers]
  );

  const getHooksByFromOffer = useCallback(
    (offerId: string) => hooks.filter(h => h.fromOfferId === offerId),
    [hooks]
  );

  const getHooksToOffer = useCallback(
    (offerId: string) => hooks.filter(h => h.toOfferId === offerId),
    [hooks]
  );

  // Actions with automatic cache invalidation
  const createProduct = useCallback(async (product: Parameters<ActionsContextValue["createProduct"]>[0]) => {
    const supabase = createClient();
    const newProduct = await createProductService(supabase, product);
    await refreshProducts();
    return newProduct;
  }, [refreshProducts]);

  const createOffer = useCallback(async (offer: Parameters<ActionsContextValue["createOffer"]>[0]) => {
    const newOffer = await createOfferMutation(offer);
    await Promise.all([refreshOffers(), refreshProducts()]); // Refresh both as offer count changes
    return newOffer;
  }, [refreshOffers, refreshProducts]);

  const updateOffer = useCallback(async (
    offerId: string, 
    updates: Parameters<ActionsContextValue["updateOffer"]>[1]
  ) => {
    const updatedOffer = await updateOfferMutation(offerId, updates);
    await refreshOffers();
    return updatedOffer;
  }, [refreshOffers]);

  const deleteOffer = useCallback(async (offerId: string) => {
    await deleteOfferMutation(offerId);
    await Promise.all([refreshOffers(), refreshProducts(), refreshHooks()]);
  }, [refreshOffers, refreshProducts, refreshHooks]);

  const createHook = useCallback(async (hook: Parameters<ActionsContextValue["createHook"]>[0]) => {
    const newHook = await createHookMutation(hook);
    await Promise.all([refreshHooks(), refreshOffers()]); // Refresh offers too for hook counts
    return newHook;
  }, [refreshHooks, refreshOffers]);

  const updateHook = useCallback(async (
    hookId: string, 
    updates: Parameters<ActionsContextValue["updateHook"]>[1]
  ) => {
    const updatedHook = await updateHookMutation(hookId, updates);
    await refreshHooks();
    return updatedHook;
  }, [refreshHooks]);

  const deleteHook = useCallback(async (hookId: string) => {
    await deleteHookMutation(hookId);
    await Promise.all([refreshHooks(), refreshOffers()]);
  }, [refreshHooks, refreshOffers]);

  // Memoized context values
  const dataValue = useMemo<DataContextValue>(() => ({
    products,
    productsLoading,
    productsError,
    refreshProducts,
    getProductById,
    offers,
    offersLoading,
    offersError,
    refreshOffers,
    getOfferById,
    getOffersByProduct,
    hooks,
    hooksLoading,
    hooksError,
    refreshHooks,
    getHooksByFromOffer,
    getHooksToOffer,
    dashboardStats,
    refreshDashboardStats,
  }), [
    products, productsLoading, productsError, refreshProducts, getProductById,
    offers, offersLoading, offersError, refreshOffers, getOfferById, getOffersByProduct,
    hooks, hooksLoading, hooksError, refreshHooks, getHooksByFromOffer, getHooksToOffer,
    dashboardStats, refreshDashboardStats,
  ]);

  const actionsValue = useMemo<ActionsContextValue>(() => ({
    createProduct,
    createOffer,
    updateOffer,
    deleteOffer,
    createHook,
    updateHook,
    deleteHook,
  }), [createProduct, createOffer, updateOffer, deleteOffer, createHook, updateHook, deleteHook]);

  return (
    <DataContext.Provider value={dataValue}>
      <ActionsContext.Provider value={actionsValue}>
        {children}
      </ActionsContext.Provider>
    </DataContext.Provider>
  );
}

// ============================================================================
// EXPORTED PROVIDER
// ============================================================================

export function DataProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig 
      value={{
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        dedupingInterval: 5000,
        errorRetryCount: 3,
        errorRetryInterval: 1000,
      }}
    >
      <DataProviderInner>{children}</DataProviderInner>
    </SWRConfig>
  );
}

// ============================================================================
// HOOKS
// ============================================================================

export function useBarterData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) {
    throw new Error("useBarterData must be used within DataProvider");
  }
  return ctx;
}

export function useBarterActions(): ActionsContextValue {
  const ctx = useContext(ActionsContext);
  if (!ctx) {
    throw new Error("useBarterActions must be used within DataProvider");
  }
  return ctx;
}
